import { useEffect, useRef, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Vibration, Platform, Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import api, { WS_URL } from '../services/api';
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
  const konumInterval = useRef(null);

  /* ─── Boot ─────────────────────────────────────────────── */
  useEffect(() => {
    bootstrap();
    return () => {
      socketRef.current?.disconnect();
      if (konumInterval.current) clearInterval(konumInterval.current);
    };
  }, []);

  // Re-check active order on screen focus
  useFocusEffect(useCallback(() => {
    api.get('/sifaris/aktiv').then(({ data }) => setAktivSifaris(data || null)).catch(() => {});
  }, []));

  async function bootstrap() {
    // Load usta from storage
    const raw = await AsyncStorage.getItem('usta');
    if (raw) {
      const u = JSON.parse(raw);
      setUsta(u);
      setOnlayn(u.onlayn || false);
    }

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
    } catch {}

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
      navigation.popToTop();
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
        'Hesab tesdiqlenmeib',
        'Admin hesabinizi hele tesdiqlemeyib. Onlayn ola bilmezsiniz.'
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
        // Start sending location every 30 s
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          konumInterval.current = setInterval(async () => {
            try {
              const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              setKonum({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
              api
                .put('/usta/konum', {
                  lat: loc.coords.latitude,
                  lng: loc.coords.longitude,
                })
                .catch(() => {});
            } catch {}
          }, 30000);
        }
      } else {
        if (konumInterval.current) clearInterval(konumInterval.current);
      }
    } catch (err) {
      Alert.alert('Xeta', err.xeta || 'Xeta bas verdi');
    } finally {
      setToggling(false);
    }
  }

  /* ─── Derived ────────────────────────────────────────────── */
  const basSehri = ((usta?.ad?.[0] || '') + (usta?.soyad?.[0] || '')).toUpperCase();
  const qazanc = parseFloat(usta?.umuml_qazanc ?? 0).toFixed(2);
  const markerCoord = konum || BAKU;

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <View style={s.root}>

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
        {/* Avatar */}
        <View style={s.avatar}>
          {basSehri ? (
            <Text style={s.avatarText}>{basSehri}</Text>
          ) : (
            <Ionicons name="person" size={20} color={C.primary} />
          )}
        </View>

        {/* Segmented Online / Offline toggle */}
        <View style={s.segment}>
          <TouchableOpacity
            style={[s.segOption, !onlayn && s.segOptionActive]}
            onPress={() => !toggling && onlayn && onlaynDeyis(false)}
            activeOpacity={0.8}
          >
            <Text style={[s.segText, !onlayn && s.segTextActive]}>Offline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.segOption, onlayn && s.segOptionActive]}
            onPress={() => !toggling && !onlayn && onlaynDeyis(true)}
            activeOpacity={0.8}
          >
            <Text style={[s.segText, onlayn && s.segTextActive]}>Online</Text>
          </TouchableOpacity>
        </View>
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

  /* Segmented control */
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.dark,
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  segOption: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  segOptionActive: {
    backgroundColor: C.white,
  },
  segText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
  },
  segTextActive: {
    color: C.dark,
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
});
