import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, Dimensions, Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import C from '../utils/colors';

const { height: SCREEN_H } = Dimensions.get('window');
const SURE = 30;
const SHEET_H = SCREEN_H * 0.52;

const BAKU_REGION = {
  latitude: 40.4093,
  longitude: 49.8671,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const FALLBACK_IKON = 'construct-outline';
const FALLBACK_IKON_LIB = 'Ionicons';

// ─── Spinning arc loader ──────────────────────────────────────────────────────
function SpinArc() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rot, { toValue: 1, duration: 1200, useNativeDriver: true })
    ).start();
  }, []);
  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={[sp.arc, { transform: [{ rotate }] }]} />
  );
}

const sp = StyleSheet.create({
  arc: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: C.primary,
    borderTopColor: 'transparent',
  },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function YeniSifarisScreen({ route, navigation }) {
  const { sifaris } = route.params;
  const [usta, setUsta] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('usta').then(r => { if (r) setUsta(JSON.parse(r)); });
  }, []);

  // 30-second auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => navigation.goBack(), SURE * 1000);
    return () => clearTimeout(timer);
  }, []);

  async function qebulEt() {
    try {
      await api.post(`/sifaris/${sifaris.id}/qebul`);
      navigation.replace('AktivSifaris');
    } catch (err) {
      const msg = err?.xeta || 'Naməlum xəta';
      console.log('Qebul xeta:', msg, err);
      Alert.alert('Qəbul edilmədi', msg, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }

  async function reddEt() {
    try {
      await api.post(`/sifaris/${sifaris.id}/redd`);
    } catch {}
    navigation.goBack();
  }

  const katAd   = sifaris.kateqoriya_ad
    || (sifaris.kateqoriya ? sifaris.kateqoriya.charAt(0).toUpperCase() + sifaris.kateqoriya.slice(1) : 'Ümumi');
  const katSub  = katAd + ' xidməti';
  const katIkon = sifaris.kateqoriya_ikon || FALLBACK_IKON;
  const katIkonLib = sifaris.kateqoriya_ikon_lib || FALLBACK_IKON_LIB;
  const basSehri = ((usta?.ad?.[0] || '') + (usta?.soyad?.[0] || '')).toUpperCase();

  const mapRegion = sifaris.unvan_lat && sifaris.unvan_lng
    ? {
        latitude:       parseFloat(sifaris.unvan_lat),
        longitude:      parseFloat(sifaris.unvan_lng),
        latitudeDelta:  0.04,
        longitudeDelta: 0.04,
      }
    : BAKU_REGION;

  const ustaCoord = sifaris.usta_lat && sifaris.usta_lng
    ? { latitude: parseFloat(sifaris.usta_lat), longitude: parseFloat(sifaris.usta_lng) }
    : null;

  return (
    <View style={s.wrap}>

      {/* ── FULL-SCREEN MAP ─────────────────────────────────────────────── */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={mapRegion}
        showsUserLocation={false}
        showsCompass={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {ustaCoord && (
          <Marker coordinate={ustaCoord} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={s.ustaMarker}>
              <Ionicons name="person" size={14} color={C.white} />
            </View>
          </Marker>
        )}
        {sifaris.unvan_lat && sifaris.unvan_lng && (
          <Marker
            coordinate={{
              latitude:  parseFloat(sifaris.unvan_lat),
              longitude: parseFloat(sifaris.unvan_lng),
            }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={s.jobMarker}>
              {katIkonLib === 'MaterialCommunityIcons'
                ? <MaterialCommunityIcons name={katIkon} size={14} color={C.white} />
                : <Ionicons name={katIkon} size={14} color={C.white} />}
            </View>
          </Marker>
        )}
      </MapView>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <View style={s.topBar}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>{basSehri || '?'}</Text>
        </View>
        <View style={s.onlinePill}>
          <View style={s.onlineDot} />
          <Text style={s.onlinePillText}>Online</Text>
        </View>
      </View>

      {/* ── BOTTOM SHEET ────────────────────────────────────────────────── */}
      <View style={s.sheet}>
        <View style={s.handle} />

        {/* Spinning arc */}
        <View style={s.spinWrap}>
          <SpinArc />
          <View style={s.spinIcon}>
            {katIkonLib === 'MaterialCommunityIcons'
              ? <MaterialCommunityIcons name={katIkon} size={28} color={C.primary} />
              : <Ionicons name={katIkon} size={28} color={C.primary} />}
          </View>
        </View>

        {/* Service name */}
        <Text style={s.katAd}>{katAd}</Text>
        <Text style={s.katSub}>{katSub}</Text>

        {/* Info pills row */}
        <View style={s.pillsRow}>
          <View style={s.infoPill}>
            <Ionicons name="navigate-outline" size={14} color={C.primary} />
            <Text style={s.infoPillText}>
              {sifaris.məsafe ? `${parseFloat(sifaris.məsafe).toFixed(1)} km` : '— km'}
            </Text>
          </View>
          <View style={s.infoPill}>
            <Ionicons name="cash-outline" size={14} color={C.primary} />
            <Text style={s.infoPillText}>
              {sifaris.məbleg ? `₼ ${sifaris.məbleg}` : '₼ —'}
            </Text>
          </View>
        </View>

        {/* Accept button */}
        <TouchableOpacity style={s.qebulBtn} onPress={qebulEt} activeOpacity={0.85}>
          <Text style={s.qebulText}>QƏBUL ET</Text>
        </TouchableOpacity>

        {/* Reject */}
        <TouchableOpacity
          onPress={reddEt}
          activeOpacity={0.7}
          style={s.reddWrap}
        >
          <Text style={s.reddText}>Rədd et</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#F5F5F5' },

  // ── top bar ──
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 10,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.primaryLightBg,
    borderWidth: 2,
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: C.primary },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primaryLightBg,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.primary + '40',
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  onlinePillText: { fontSize: 13, fontWeight: '700', color: C.primary },

  // ── markers ──
  ustaMarker: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.white,
  },
  jobMarker: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.orange,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.white,
  },

  // ── bottom sheet ──
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
    alignItems: 'center',
  },
  handle: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: C.border,
    marginBottom: 24,
  },

  // ── spinning arc ──
  spinWrap: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  spinIcon: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.primaryLightBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── service name ──
  katAd: {
    fontSize: 28,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  katSub: {
    fontSize: 14,
    color: C.textSoft,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },

  // ── info pills ──
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.primaryLightBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.primary + '30',
  },
  infoPillText: { fontSize: 14, fontWeight: '700', color: C.primary },

  // ── accept button ──
  qebulBtn: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  qebulText: {
    fontSize: 17,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 2,
  },

  // ── reject ──
  reddWrap: { paddingVertical: 8 },
  reddText: { fontSize: 15, color: C.textSoft, fontWeight: '600' },
});
