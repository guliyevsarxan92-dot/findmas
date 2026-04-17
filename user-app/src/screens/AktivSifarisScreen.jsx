import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { WS_URL } from '../services/api';
import C from '../utils/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BAKU = {
  latitude: 40.4093,
  longitude: 49.8671,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function etaFromQebul(qebulTarixi) {
  if (!qebulTarixi) return null;
  const gecenDeq = Math.floor((Date.now() - new Date(qebulTarixi).getTime()) / 60000);
  const qalan = Math.max(0, 15 - gecenDeq);
  if (qalan <= 0) return 'Hər an gələ bilər';
  return `~${qalan} dəq`;
}

function initials(ad, soyad) {
  return `${(ad || '')[0] || ''}${(soyad || '')[0] || ''}`.toUpperCase();
}

export default function AktivSifarisScreen({ navigation }) {
  const [sifaris, setSifaris] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [ustaLoc, setUstaLoc] = useState(null);
  const [secilmisReytinq, setSecilmisReytinq] = useState(0);
  const [reytinqYuklenir, setReytinqYuklenir] = useState(false);
  const socketRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    yukle();
    qosul();
    return () => socketRef.current?.disconnect();
  }, []);

  async function yukle() {
    try {
      const { data } = await api.get('/sifaris/aktiv');
      setSifaris(data);
      if (data?.unvan_lat && data?.unvan_lng) {
        setUserLoc({ latitude: parseFloat(data.unvan_lat), longitude: parseFloat(data.unvan_lng) });
      }
      if (data?.usta?.lat && data?.usta?.lng) {
        setUstaLoc({ latitude: parseFloat(data.usta.lat), longitude: parseFloat(data.usta.lng) });
      }
    } catch (err) {
      console.warn('AktivSifaris yukle xəta:', err);
    }
  }

  async function qosul() {
    try {
      const token = await AsyncStorage.getItem('token');
      const socket = io(WS_URL, { auth: { token } });
      socketRef.current = socket;

      socket.on('sifaris_status', ({ status, usta, xidmet_haqqi }) => {
        setSifaris(prev => {
          if (!prev) return prev;
          return { ...prev, status, ...(usta ? { usta } : {}), ...(xidmet_haqqi ? { xidmet_haqqi } : {}) };
        });
      });

      socket.on('yeni_mesaj', () => {
        Vibration.vibrate(200);
      });

      socket.on('usta_yeniden_axtarilir', ({ sifaris_id, mesaj }) => {
        Alert.alert('Yeni usta axtarılır', mesaj || 'Usta sifarişi ləğv etdi, yeni usta axtarılır...');
        navigation.replace('UstaAxtarilir', { sifaris_id });
      });

      socket.on('usta_konum', ({ lat, lng }) => {
        const coord = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
        setUstaLoc(coord);
        setSifaris(prev => prev ? { ...prev, usta: { ...prev.usta, lat, lng } } : prev);
      });
    } catch (err) {
      console.warn('AktivSifaris qoşulma xəta:', err);
    }
  }

  async function reytinqGonderVeBagla() {
    if (!secilmisReytinq || !sifaris) return;
    setReytinqYuklenir(true);
    try {
      await api.post(`/sifaris/${sifaris.id}/reytinq`, { reytinq: secilmisReytinq });
    } catch (err) {
      console.warn('Reytinq göndərmə xəta:', err);
    }
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }

  async function legvEt() {
    if (!sifaris) return;
    Alert.alert('Ləğv et', 'Sifarişi ləğv etmək istəyirsiniz?', [
      {
        text: 'Bəli',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/sifaris/${sifaris.id}/legv`);
          } catch (err) {
            console.warn('Ləğv xəta:', err);
          }
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        },
      },
      { text: 'Xeyr', style: 'cancel' },
    ]);
  }

  if (!sifaris) {
    return (
      <View style={s.loadWrap}>
        <MapView style={StyleSheet.absoluteFillObject} initialRegion={BAKU} />
        <View style={s.overlay} />
        <View style={s.bottomCard}>
          <View style={s.handle} />
          <Text style={{ color: C.textSoft, fontSize: 15, marginTop: 8 }}>Yüklənir...</Text>
        </View>
      </View>
    );
  }

  const { status, usta } = sifaris;

  const liveUstaCoord = ustaLoc
    || (usta?.lat && usta?.lng
      ? { latitude: parseFloat(usta.lat), longitude: parseFloat(usta.lng) }
      : null);

  const mapRegion = liveUstaCoord
    ? { ...liveUstaCoord, latitudeDelta: 0.03, longitudeDelta: 0.03 }
    : BAKU;

  const routePoints =
    liveUstaCoord && userLoc ? [liveUstaCoord, userLoc] : null;

  const ustaCoord = liveUstaCoord;

  // ---- STATE A: qebul_edildi ----
  if (status === 'qebul_edildi') {
    const eta = etaFromQebul(sifaris.qebul_tarixi);
    return (
      <View style={s.container}>
        <MapView style={StyleSheet.absoluteFillObject} region={mapRegion}>
          {ustaCoord && (
            <Marker coordinate={ustaCoord} pinColor="#22C55E" title={usta?.ad} />
          )}
        </MapView>

        <View style={s.bottomCard}>
          <View style={s.handle} />

          <View style={s.masterRow}>
            <View style={s.avatar}>
              {usta?.ad ? (
                <Text style={s.avatarInitials}>{initials(usta.ad, usta.soyad)}</Text>
              ) : (
                <Ionicons name="person" size={28} color={C.primary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.masterName}>{usta?.ad} {usta?.soyad}</Text>
              <View style={s.ratingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={s.ratingText}>
                  {usta?.orta_reytinq || 'Yeni'}
                  {usta?.mesafe ? ` · ${usta.mesafe} km` : ''}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.twoBtn}>
            <TouchableOpacity
              style={s.outlineBtn}
              onPress={() => Linking.openURL(`tel:${usta?.telefon}`)}
              activeOpacity={0.7}>
              <Ionicons name="call-outline" size={18} color={C.textSoft} />
              <Text style={s.outlineBtnText}>Zəng et</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.outlineBtn}
              onPress={() => navigation.navigate('Chat', { sifaris_id: sifaris.id })}
              activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={18} color={C.textSoft} />
              <Text style={s.outlineBtnText}>Mesaj yaz</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.etaLarge}>
            {eta || 'Usta yolda...'}
          </Text>

          <View style={s.separator} />

          <TouchableOpacity onPress={legvEt} activeOpacity={0.7} style={s.legvTextBtn}>
            <Text style={s.legvTextBtnLabel}>Ləğv et</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---- STATE B: yolda | baslandi ----
  if (status === 'yolda' || status === 'baslandi') {
    const statusTitle = status === 'yolda' ? 'Usta yoldadır' : 'İş başladı';
    const eta = etaFromQebul(sifaris.qebul_tarixi);

    return (
      <View style={s.container}>
        <MapView style={StyleSheet.absoluteFillObject} region={mapRegion}>
          {ustaCoord && (
            <Marker coordinate={ustaCoord} pinColor="#22C55E" title={usta?.ad} />
          )}
          {routePoints && (
            <Polyline
              coordinates={routePoints}
              strokeColor="#22C55E"
              strokeWidth={3}
              lineDashPattern={[6, 4]}
            />
          )}
        </MapView>

        <View style={s.bottomCard}>
          <View style={s.handle} />

          <Text style={s.statusTitle}>{statusTitle}</Text>
          {sifaris.unvan_metn ? (
            <Text style={s.addressText} numberOfLines={2}>{sifaris.unvan_metn}</Text>
          ) : null}

          {status === 'yolda' && eta ? (
            <View style={s.etaRow}>
              <Text style={s.etaLabel}>ETA</Text>
              <Text style={s.etaValue}>{eta}</Text>
            </View>
          ) : null}

          <View style={s.separator} />

          <View style={s.twoBtn}>
            <TouchableOpacity
              style={s.outlineBtn}
              onPress={() => Linking.openURL(`tel:${usta?.telefon}`)}
              activeOpacity={0.7}>
              <Ionicons name="call-outline" size={18} color={C.textSoft} />
              <Text style={s.outlineBtnText}>Əlaqə</Text>
            </TouchableOpacity>

            {status === 'yolda' && (
              <TouchableOpacity
                style={[s.outlineBtn, s.legvOutline]}
                onPress={legvEt}
                activeOpacity={0.7}>
                <Ionicons name="close-outline" size={18} color={C.error} />
                <Text style={[s.outlineBtnText, { color: C.error }]}>Ləğv et</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ---- STATE C: tamamlandi — reytinq ver + Tamam ----
  return (
    <View style={s.container}>
      <MapView style={StyleSheet.absoluteFillObject} initialRegion={BAKU} />

      <View style={s.bottomCard}>
        <View style={s.handle} />

        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View style={s.doneIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
          </View>
          <Text style={s.statusTitle}>Sifariş tamamlandı</Text>
          {sifaris.xidmet_haqqi ? (
            <Text style={s.xidmetHaqqi}>Xidmət haqqı: {parseFloat(sifaris.xidmet_haqqi).toFixed(2)} ₼</Text>
          ) : null}
        </View>

        <Text style={s.ratingLabel}>Ustanı qiymətləndirin</Text>
        <View style={s.starRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity key={n} onPress={() => setSecilmisReytinq(n)} activeOpacity={0.7}>
              <Ionicons
                name={n <= secilmisReytinq ? 'star' : 'star-outline'}
                size={36} color="#F59E0B"
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.primaryBtn, (!secilmisReytinq || reytinqYuklenir) && { opacity: 0.5 }]}
          onPress={reytinqGonderVeBagla}
          disabled={!secilmisReytinq || reytinqYuklenir}
          activeOpacity={0.8}>
          {reytinqYuklenir ? (
            <ActivityIndicator color={C.white} size="small" />
          ) : (
            <Text style={s.primaryBtnText}>Tamam</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CARD_RADIUS = 24;

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadWrap: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    marginBottom: 20,
  },

  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '700',
    color: C.primary,
  },
  masterName: {
    fontSize: 17,
    fontWeight: '700',
    color: C.dark,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: C.textSoft,
    fontWeight: '500',
  },

  etaLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: C.dark,
    textAlign: 'center',
    marginVertical: 16,
  },

  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.dark,
    marginBottom: 6,
  },
  addressText: {
    fontSize: 13,
    color: C.textSoft,
    lineHeight: 18,
    marginBottom: 14,
  },

  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  etaLabel: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  etaValue: {
    fontSize: 17,
    fontWeight: '700',
    color: C.dark,
  },

  separator: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 16,
  },

  twoBtn: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textSoft,
  },
  legvOutline: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },

  legvTextBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  legvTextBtnLabel: {
    fontSize: 14,
    color: C.textMuted,
    fontWeight: '500',
  },

  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 12,
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.white,
  },
  doneIcon: { marginBottom: 8 },
  xidmetHaqqi: { fontSize: 15, fontWeight: '600', color: C.primary, marginTop: 4 },
  ratingLabel: { fontSize: 14, fontWeight: '600', color: C.dark, textAlign: 'center', marginBottom: 8 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 4 },
});
