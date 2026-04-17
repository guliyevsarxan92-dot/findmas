import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import C from '../utils/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TAB_BAR_HEIGHT = 80;
const SNAP_TOP = SCREEN_HEIGHT * 0.08;
const SNAP_MID = SCREEN_HEIGHT * 0.55;
const SNAP_BOTTOM = SCREEN_HEIGHT - TAB_BAR_HEIGHT - 120;

function ikonLib(ikon_lib) {
  if (ikon_lib === 'MaterialCommunityIcons' || ikon_lib === 'mci') return 'mci';
  return 'ion';
}

function qiymetMetn(qiymet) {
  if (qiymet) return `${qiymet} ₼`;
  return '';
}

const STATUS_METN = {
  gozlenilir: 'Usta axtarılır...',
  qebul_edildi: 'Usta qəbul etdi',
  yolda: 'Usta yolda',
  baslandi: 'İş başladı',
};

const BAKU_REGION = {
  latitude: 40.4093,
  longitude: 49.8671,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function KatIkon({ ikon, lib, color, size = 26 }) {
  if (lib === 'mci') return <MaterialCommunityIcons name={ikon} size={size} color={color} />;
  return <Ionicons name={ikon} size={size} color={color} />;
}

export default function AnaScreen({ navigation }) {
  const SEHERLER = [
    { ad: 'Bakı',    lat: 40.4093, lng: 49.8671 },
    { ad: 'Sumqayıt', lat: 40.5855, lng: 49.6317 },
    { ad: 'Gəncə',  lat: 40.6828, lng: 46.3606 },
  ];

  const [user, setUser] = useState(null);
  const [aktivSifaris, setAktivSifaris] = useState(null);
  const [mapRegion, setMapRegion] = useState(BAKU_REGION);
  const [xidmetler, setXidmetler] = useState([]);
  const [seher, setSeher] = useState(SEHERLER[0]);
  const [seherMenu, setSeherMenu] = useState(false);

  // Sheet position — starts at mid
  const sheetY = useRef(new Animated.Value(SNAP_MID)).current;
  const lastSnap = useRef(SNAP_MID);

  function animateTo(target) {
    lastSnap.current = target;
    Animated.spring(sheetY, {
      toValue: target,
      useNativeDriver: false,
      bounciness: 3,
      speed: 16,
    }).start();
  }

  // PanResponder — ONLY for the handle/title drag area
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
    onPanResponderGrant: () => {
      sheetY.stopAnimation((val) => {
        lastSnap.current = val;
        sheetY.setOffset(val);
        sheetY.setValue(0);
      });
    },
    onPanResponderMove: (_, g) => {
      const raw = lastSnap.current + g.dy;
      const clamped = Math.max(SNAP_TOP, Math.min(SNAP_BOTTOM, raw));
      sheetY.setValue(clamped - lastSnap.current);
    },
    onPanResponderRelease: (_, g) => {
      sheetY.flattenOffset();
      const current = lastSnap.current + g.dy;
      const vy = g.vy;

      let target;
      if (vy > 0.5) {
        target = current < SNAP_MID ? SNAP_MID : SNAP_BOTTOM;
      } else if (vy < -0.5) {
        target = current > SNAP_MID ? SNAP_MID : SNAP_TOP;
      } else {
        const snaps = [SNAP_TOP, SNAP_MID, SNAP_BOTTOM];
        target = snaps.reduce((a, b) =>
          Math.abs(b - current) < Math.abs(a - current) ? b : a
        );
      }

      lastSnap.current = target;
      Animated.spring(sheetY, {
        toValue: target,
        useNativeDriver: false,
        bounciness: 3,
        speed: 16,
      }).start();
    },
  }), []);

  useEffect(() => {
    AsyncStorage.getItem('user').then(r => r && setUser(JSON.parse(r)));
    konumAl();
    xidmetYukle();
  }, []);

  useFocusEffect(useCallback(() => {
    aktivYoxla();
  }, []));

  async function xidmetYukle() {
    try {
      const { data } = await api.get('/xidmetler');
      setXidmetler(data.xidmetler || []);
    } catch (err) { console.warn(err); }
  }

  async function konumAl() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setMapRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (err) { console.warn(err); }
  }

  async function aktivYoxla() {
    try {
      const { data } = await api.get('/sifaris/aktiv');
      if (data) setAktivSifaris(data);
    } catch (err) { console.warn(err); }
  }

  function aktivSifarisEkrani() {
    if (!aktivSifaris) return;
    if (aktivSifaris.status === 'gozlenilir') {
      navigation.navigate('UstaAxtarilir', { sifaris_id: aktivSifaris.id });
    } else {
      navigation.navigate('AktivSifaris');
    }
  }

  function kateqoriyaSecildi(kat) {
    if (aktivSifaris) {
      Alert.alert('Aktiv sifariş var', 'Mövcud sifarişiniz hələ davam edir.', [
        { text: 'Sifarişə bax', onPress: aktivSifarisEkrani },
        { text: 'Bağla', style: 'cancel' },
      ]);
      return;
    }
    const normalized = {
      ...kat,
      lib: ikonLib(kat.ikon_lib),
      qiymet: qiymetMetn(kat.qiymet),
    };
    navigation.navigate('SifarisVer', { kateqoriya: normalized });
  }

  // Sheet height derived from sheetY
  const sheetHeight = sheetY.interpolate({
    inputRange: [SNAP_TOP, SNAP_BOTTOM],
    outputRange: [SCREEN_HEIGHT - SNAP_TOP, SCREEN_HEIGHT - SNAP_BOTTOM],
    extrapolate: 'clamp',
  });

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Full screen map */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={mapRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        customMapStyle={LIGHT_MAP_STYLE}
      />

      {/* TOP CARD */}
      <View style={s.topCard}>
        <TouchableOpacity
          style={s.locationPill}
          activeOpacity={0.7}
          onPress={() => setSeherMenu(!seherMenu)}
        >
          <Ionicons name="location-sharp" size={16} color={C.primary} />
          <Text style={s.locationText}>{seher.ad}</Text>
          <Ionicons name={seherMenu ? 'chevron-up' : 'chevron-down'} size={16} color={C.textSoft} />
        </TouchableOpacity>
      </View>

      {seherMenu && (
        <View style={s.seherDropdown}>
          {SEHERLER.map((sh) => (
            <TouchableOpacity
              key={sh.ad}
              style={[s.seherItem, sh.ad === seher.ad && s.seherItemAktiv]}
              onPress={() => {
                setSeher(sh);
                setSeherMenu(false);
                setMapRegion({ latitude: sh.lat, longitude: sh.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={sh.ad === seher.ad ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={sh.ad === seher.ad ? C.primary : C.textMuted}
              />
              <Text style={[s.seherText, sh.ad === seher.ad && s.seherTextAktiv]}>{sh.ad}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ACTIVE ORDER BANNER */}
      {aktivSifaris && (
        <TouchableOpacity style={s.aktivBanner} onPress={aktivSifarisEkrani} activeOpacity={0.9}>
          <View style={s.aktivBannerLeft}>
            <View style={s.aktivBannerIcon}>
              <Ionicons name="flash" size={18} color={C.white} />
            </View>
            <View>
              <Text style={s.aktivBannerTitle}>Aktiv sifariş</Text>
              <Text style={s.aktivBannerSub}>{STATUS_METN[aktivSifaris.status] || aktivSifaris.status}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      )}

      {/* BOTTOM SHEET — position: absolute, top = sheetY */}
      <Animated.View style={[s.bottomSheet, { top: sheetY, height: sheetHeight }]}>

        {/* DRAG HANDLE — PanResponder ONLY here */}
        <View {...panResponder.panHandlers} style={s.dragArea}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Xidmət seçin</Text>
        </View>

        {/* SERVICE LIST — always scrollable, no gesture conflict */}
        <FlatList
          style={{ flex: 1 }}
          data={xidmetler}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.listContent}
          scrollEnabled={true}
          bounces={true}
          nestedScrollEnabled={true}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          renderItem={({ item: kat }) => (
            <TouchableOpacity
              style={s.serviceRow}
              onPress={() => kateqoriyaSecildi(kat)}
              activeOpacity={0.7}
            >
              <View style={[s.serviceIconBox, { backgroundColor: (kat.rang || '#3B82F6') + '18' }]}>
                <KatIkon ikon={kat.ikon} lib={ikonLib(kat.ikon_lib)} color={kat.rang || '#3B82F6'} size={26} />
              </View>
              <View style={s.serviceTextBox}>
                <Text style={s.serviceName}>{kat.ad}</Text>
                {kat.altbaslik ? <Text style={s.serviceSubtitle}>{kat.altbaslik}</Text> : null}
              </View>
              {kat.qiymet ? (
                <Text style={s.servicePrice}>{qiymetMetn(kat.qiymet)}</Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      </Animated.View>
    </View>
  );
}

const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8f5' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d5e8d4' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
];

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8eaf0',
  },

  /* ── TOP CARD ── */
  topCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 32) + 8,
    left: 16,
    right: 16,
    backgroundColor: C.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 50,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.primary + '30',
  },
  locationText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.dark,
  },
  seherDropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 + 56 : (StatusBar.currentHeight || 32) + 8 + 56,
    left: 16,
    backgroundColor: C.white,
    borderRadius: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 100,
  },
  seherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  seherItemAktiv: {
    backgroundColor: C.primaryLight,
  },
  seherText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.dark,
  },
  seherTextAktiv: {
    color: C.primary,
    fontWeight: '700',
  },

  /* ── ACTIVE ORDER BANNER ── */
  aktivBanner: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.5 + 12,
    left: 16,
    right: 16,
    backgroundColor: C.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: C.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  aktivBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aktivBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aktivBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },
  aktivBannerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  /* ── BOTTOM SHEET ── */
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
    overflow: 'hidden',
  },
  dragArea: {
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: -0.3,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  /* ── SERVICE ROW ── */
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  serviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  serviceTextBox: {
    flex: 1,
    gap: 3,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.dark,
  },
  serviceSubtitle: {
    fontSize: 13,
    color: C.textSoft,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
    flexShrink: 0,
  },
  separator: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 62,
  },
});
