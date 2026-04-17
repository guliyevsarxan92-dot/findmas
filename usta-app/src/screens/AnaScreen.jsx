import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Vibration, Platform, Dimensions,
  Animated, PanResponder,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import api, { WS_URL } from '../services/api';
import { startBackgroundLocation, stopBackgroundLocation } from '../services/backgroundLocation';
import C from '../utils/colors';

const { width: SW } = Dimensions.get('window');

// Safe area top: iOS uses notch offset, Android uses status bar height
const TOP_INSET = Platform.OS === 'ios' ? 54 : 36;

// Baku centre coordinates
const BAKU = { latitude: 40.4093, longitude: 49.8671 };

export default function AnaScreen({ navigation }) {
  const [usta, setUsta] = useState(null);
  const [onlayn, setOnlayn] = useState(false);
  const [konum, setKonum] = useState(null);
  const [aktivSifaris, setAktivSifaris] = useState(null);
  const [toggling, setToggling] = useState(false);

  const socketRef = useRef(null);

  /* ─── Boot ─────────────────────────────────────────────── */
  useEffect(() => {
    bootstrap();
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useFocusEffect(useCallback(() => {
    api.get('/sifaris/aktiv').then(({ data }) => setAktivSifaris(data || null)).catch(() => {});
    api.get('/usta/profil').then(async ({ data }) => {
      if (data) {
        setUsta(prev => {
          const yeni = { ...prev, ...data };
          AsyncStorage.setItem('usta', JSON.stringify(yeni));
          return yeni;
        });
        setOnlayn(data.onlayn || false);
      }
    }).catch(() => {});
  }, []));

  async function bootstrap() {
    // Load usta from storage first (fast)
    const raw = await AsyncStorage.getItem('usta');
    let u = raw ? JSON.parse(raw) : null;
    if (u) {
      setUsta(u);
      setOnlayn(u.onlayn || false);
    }

    // Fetch fresh profile from backend (tesdiqlendi statusu yenilənsin)
    try {
      const { data } = await api.get('/usta/profil');
      if (data) {
        u = { ...u, ...data };
        setUsta(u);
        setOnlayn(u.onlayn || false);
        await AsyncStorage.setItem('usta', JSON.stringify(u));
      }
    } catch (err) { console.warn('Profil y��kləmə xəta:', err); }

    // Get current position for map marker
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setKonum({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch {}

    // Check for active order
    try {
      const { data } = await api.get('/sifaris/aktiv');
      setAktivSifaris(data || null);
    } catch (err) { console.warn(err); }

    // Connect socket
    qosul();
  }

  /* ─── Socket ────────────────────────────────────────────── */
  async function qosul() {
    const token = await AsyncStorage.getItem('token');
    const socket = io(WS_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('yeni_sifaris', async (sifaris) => {
      Vibration.vibrate([0, 500, 200, 500, 200, 500, 200, 500]);
      navigation.navigate('YeniSifaris', { sifaris });
    });

    // Başqa usta qəbul etdi — əgər YeniSifaris ekranındayıqsa geri qayıt
    socket.on('sifaris_bashqasi_qebul_etdi', () => {
      navigation.goBack();
    });

    // Müştəri sifarişi ləğv etdi
    socket.on('sifaris_legv_edildi', ({ mesaj } = {}) => {
      Vibration.vibrate(500);
      setAktivSifaris(null);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      Alert.alert('Sifariş ləğv edildi', mesaj || 'Müştəri sifarişi ləğv etdi.');
    });

    // Yeni mesaj bildirişi
    socket.on('yeni_mesaj', () => {
      Vibration.vibrate(200);
    });

    socket.on('hesab_tesdiqlendi', async ({ mesaj }) => {
      // Lokal usta obyektini yenilə
      const raw = await AsyncStorage.getItem('usta');
      if (raw) {
        const u = JSON.parse(raw);
        const yeniUsta = { ...u, tesdiqlendi: true };
        await AsyncStorage.setItem('usta', JSON.stringify(yeniUsta));
        setUsta(yeniUsta);
      }
      Alert.alert('Hesab təsdiqləndi!', mesaj || 'Admin hesabınızı təsdiqlədi. Artıq onlayn ola bilərsiniz.');
    });

    socket.on('hesab_bloklandi', async ({ blok_bitis, blok_sebeb, muddet_metn }) => {
      const raw = await AsyncStorage.getItem('usta');
      if (raw) {
        const u = JSON.parse(raw);
        const yeniUsta = { ...u, bloklanib: true, blok_bitis, blok_sebeb, onlayn: false };
        await AsyncStorage.setItem('usta', JSON.stringify(yeniUsta));
        setUsta(yeniUsta);
        setOnlayn(false);
      }
    });

    socket.on('blok_acildi', async () => {
      const raw = await AsyncStorage.getItem('usta');
      if (raw) {
        const u = JSON.parse(raw);
        const yeniUsta = { ...u, bloklanib: false, blok_bitis: null, blok_sebeb: null };
        await AsyncStorage.setItem('usta', JSON.stringify(yeniUsta));
        setUsta(yeniUsta);
      }
      Alert.alert('Blok açıldı', 'Hesabınızın bloku açıldı.');
    });

    socket.on('balans_artdi', async ({ yeni_balans, məbleg }) => {
      const raw = await AsyncStorage.getItem('usta');
      if (raw) {
        const u = JSON.parse(raw);
        const yeniUsta = { ...u, balans: yeni_balans };
        await AsyncStorage.setItem('usta', JSON.stringify(yeniUsta));
        setUsta(yeniUsta);
      }
      Alert.alert('Balans artırıldı!', `${məbleg} ₼ balansınıza əlavə edildi.`);
    });
  }

  /* ─── Online toggle ──────────────────────────────────────── */
  async function onlaynDeyis(deger) {
    if (toggling) return;

    if (deger && !usta?.tesdiqlendi) {
      Alert.alert(
        'Hesab təsdiqlənməyib',
        'Hesabınız hələ admin tərəfindən təsdiqlənməyib. Təsdiq edildikdən sonra onlayn ola bilərsiniz.',
      );
      return;
    }

    setToggling(true);
    try {
      await api.put('/usta/onlayn', { onlayn: deger });
      const yeniUsta = { ...usta, onlayn: deger };
      setOnlayn(deger);
      setUsta(yeniUsta);
      await AsyncStorage.setItem('usta', JSON.stringify(yeniUsta));

      if (deger) {
        await startBackgroundLocation();
      } else {
        await stopBackgroundLocation();
      }
    } catch (err) {
      const msg = err?.response?.data?.xeta || err?.xeta || 'Xəta baş verdi';
      Alert.alert('Xəta', msg);
    } finally {
      setToggling(false);
    }
  }

  /* ─── Derived ────────────────────────────────────────────── */
  const basSehri = ((usta?.ad?.[0] || '') + (usta?.soyad?.[0] || '')).toUpperCase();
  const qazanc = parseFloat(usta?.umuml_qazanc ?? 0).toFixed(2);
  const markerCoord = konum || BAKU;

  /* ─── Swipe Toggle ─────────────────────────────────────── */
  const TRACK_W = 200;
  const THUMB_W = 56;
  const MAX_SLIDE = TRACK_W - THUMB_W - 8;
  const slideAnim = useRef(new Animated.Value(onlayn ? MAX_SLIDE : 0)).current;
  const bgAnim = useRef(new Animated.Value(onlayn ? 1 : 0)).current;
  const isSliding = useRef(false);

  // Sync animation when onlayn changes externally
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: onlayn ? MAX_SLIDE : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
    Animated.timing(bgAnim, {
      toValue: onlayn ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [onlayn]);

  const onlaynRef = useRef(onlayn);
  useEffect(() => { onlaynRef.current = onlayn; }, [onlayn]);

  const ustaRef = useRef(usta);
  useEffect(() => { ustaRef.current = usta; }, [usta]);

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => !toggling,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5,
      onPanResponderGrant: () => {
        isSliding.current = true;
        slideAnim.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const base = onlaynRef.current ? MAX_SLIDE : 0;
        let val = Math.max(0, Math.min(MAX_SLIDE, base + g.dx));
        if (!ustaRef.current?.tesdiqlendi && !onlaynRef.current) {
          val = Math.min(val, MAX_SLIDE * 0.3);
        }
        slideAnim.setValue(val);
        bgAnim.setValue(val / MAX_SLIDE);
      },
      onPanResponderRelease: (_, g) => {
        isSliding.current = false;
        const cur = onlaynRef.current;
        const base = cur ? MAX_SLIDE : 0;
        const final = base + g.dx;
        const threshold = MAX_SLIDE * 0.45;

        if (!cur && final > threshold) {
          if (!ustaRef.current?.tesdiqlendi) {
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false, bounciness: 4 }).start();
            Animated.timing(bgAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
            onlaynDeyis(true);
            return;
          }
          Animated.spring(slideAnim, { toValue: MAX_SLIDE, useNativeDriver: false, bounciness: 4 }).start();
          Animated.timing(bgAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
          onlaynDeyis(true);
        } else if (cur && final < MAX_SLIDE - threshold) {
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false, bounciness: 4 }).start();
          Animated.timing(bgAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
          onlaynDeyis(false);
        } else {
          Animated.spring(slideAnim, { toValue: cur ? MAX_SLIDE : 0, useNativeDriver: false, bounciness: 6 }).start();
          Animated.timing(bgAnim, { toValue: cur ? 1 : 0, duration: 200, useNativeDriver: false }).start();
        }
      },
    })
  , []);

  const trackBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#3a3a3c', C.primary],
  });

  const slideLabel = onlayn ? 'Online' : 'Offline';

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <View style={s.root}>

      {/* ── BLOK EKRANI ── */}
      {usta?.bloklanib && (
        <View style={s.blokEkran}>
          <View style={s.blokKart}>
            <View style={s.blokIkon}>
              <Ionicons name="ban-outline" size={48} color="#DC2626" />
            </View>
            <Text style={s.blokBasliq}>Hesabınız bloklanıb</Text>
            {usta.blok_sebeb && <Text style={s.blokSebeb}>{usta.blok_sebeb}</Text>}
            <Text style={s.blokMuddet}>
              {usta.blok_bitis
                ? `Bitmə tarixi: ${new Date(usta.blok_bitis).toLocaleDateString('az')}`
                : 'Müddət: Həmişəlik'}
            </Text>
            <Text style={s.blokAlt}>Sualınız varsa dəstək xətti ilə əlaqə saxlayın.</Text>
          </View>
        </View>
      )}

      {/* ── Full-screen map ── */}
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          ...BAKU,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        userInterfaceStyle="light"
        showsUserLocation={false}
        showsCompass={false}
        showsMyLocationButton={false}
      >
        <Marker coordinate={markerCoord} anchor={{ x: 0.5, y: 1 }}>
          <View style={s.markerWrap}>
            <View style={s.markerPin}>
              <Ionicons name="construct" size={16} color={C.white} />
            </View>
            <Text style={s.markerLabel}>usta</Text>
          </View>
        </Marker>
      </MapView>

      {/* ── TOP BAR ── */}
      <View style={[s.topBar, { top: TOP_INSET }]}>
        {/* Avatar (sol) */}
        <View style={s.avatar}>
          {basSehri ? (
            <Text style={s.avatarText}>{basSehri}</Text>
          ) : (
            <Ionicons name="person" size={20} color={C.primary} />
          )}
        </View>

        {/* Swipe Online / Offline toggle (ortada) */}
        <Animated.View style={[s.slideTrack, { backgroundColor: trackBg }]}>
          <Text style={s.slideTrackLabel}>{slideLabel}</Text>
          <Animated.View
            style={[s.slideThumb, { transform: [{ translateX: slideAnim }] }]}
            {...panResponder.panHandlers}
          >
            <Ionicons
              name={onlayn ? 'power' : 'power-outline'}
              size={22}
              color={onlayn ? C.primary : '#888'}
            />
          </Animated.View>
        </Animated.View>

        {/* Sağ tərəf boş placeholder (avatar ilə simmetrik) */}
        <View style={{ width: 44 }} />
      </View>

      {/* ── ACTIVE ORDER BANNER (shown below topbar) ── */}
      {aktivSifaris && (
        <TouchableOpacity
          style={[s.aktivBanner, { top: TOP_INSET + 68 }]}
          onPress={() => navigation.navigate('AktivSifaris')}
          activeOpacity={0.85}
        >
          <View style={s.aktivDot} />
          <Text style={s.aktivText}>Aktiv sifaris davam edir</Text>
          <Ionicons name="chevron-forward" size={14} color={C.white} />
        </TouchableOpacity>
      )}

      {/* ── TESDIQ GOZLENILIR BANNER ── */}
      {usta && !usta.tesdiqlendi && !usta.bloklanib && (
        <View style={[s.tesdiqBanner, { top: TOP_INSET + 68 }]}>
          <Ionicons name="time-outline" size={18} color="#F59E0B" />
          <Text style={s.tesdiqText}>Hesabınız təsdiq gözləyir</Text>
        </View>
      )}

      {/* ── WAITING CARD (online but no active order) ── */}
      {onlayn && !aktivSifaris && (
        <View style={[s.waitingCard, { top: TOP_INSET + 68 }]}>
          <Text style={s.waitingText}>Sifariş gözlənilir</Text>
        </View>
      )}

      {/* ── EARNINGS MINI CARD (floating above bottom) ── */}
      <TouchableOpacity
        style={s.earningsCard}
        onPress={() => navigation.navigate('Qazanc')}
        activeOpacity={0.85}
      >
        <Text style={s.earningsCaption}>Bugünkü qazanc  →</Text>
        <Text style={s.earningsAmount}>₼ {qazanc}</Text>
      </TouchableOpacity>

    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  /* ── Marker ── */
  markerWrap: {
    alignItems: 'center',
  },
  markerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  markerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.dark,
    marginTop: 3,
    backgroundColor: C.white,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },

  /* ── Top bar ── */
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    borderWidth: 2,
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: C.primary,
  },

  /* Swipe slide toggle */
  slideTrack: {
    width: 200,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  slideTrackLabel: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  slideThumb: {
    position: 'absolute',
    left: 4,
    width: 56,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  /* ── Waiting card ── */
  waitingCard: {
    position: 'absolute',
    alignSelf: 'center',
    left: 40,
    right: 40,
    backgroundColor: C.white,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  waitingText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.dark,
  },

  /* ── Active order banner ── */
  aktivBanner: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: C.primary,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  aktivDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.white,
  },
  aktivText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.white,
  },

  /* ── Earnings card ── */
  earningsCard: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    backgroundColor: C.white,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 16,
    alignItems: 'center',
    minWidth: SW * 0.5,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  earningsCaption: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textSoft,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: -0.5,
  },

  /* ── Blok ekranı ── */
  blokEkran: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  blokKart: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  blokIkon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  blokBasliq: {
    fontSize: 22,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 12,
  },
  blokSebeb: {
    fontSize: 15,
    color: C.dark,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  blokMuddet: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textSoft,
    marginBottom: 16,
  },
  blokAlt: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },

  /* ── Təsdiq gözlənilir banner ── */
  tesdiqBanner: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tesdiqText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
});
