import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import C from '../utils/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function ikonLib(ikon_lib) {
  if (ikon_lib === 'MaterialCommunityIcons' || ikon_lib === 'mci') return 'mci';
  return 'ion';
}

function qiymetMetn(min, max) {
  if (min && max) return `${min}-${max} ₼`;
  if (min) return `${min}+ ₼`;
  if (max) return `${max} ₼-dək`;
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
  const [user, setUser] = useState(null);
  const [aktivSifaris, setAktivSifaris] = useState(null);
  const [mapRegion, setMapRegion] = useState(BAKU_REGION);
  const [xidmetler, setXidmetler] = useState([]);

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
    } catch {}
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
    } catch {}
  }

  async function aktivYoxla() {
    try {
      const { data } = await api.get('/sifaris/aktiv');
      if (data) setAktivSifaris(data);
    } catch {}
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
    // API məlumatını SifarisVerScreen-in gözlədiyi formata çevir
    const normalized = {
      ...kat,
      lib: ikonLib(kat.ikon_lib),
      qiymet: qiymetMetn(kat.qiymet_min, kat.qiymet_max),
    };
    navigation.navigate('SifarisVer', { kateqoriya: normalized });
  }

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
        {/* Location dropdown */}
        <TouchableOpacity style={s.locationPill} activeOpacity={0.7}>
          <Ionicons name="location-sharp" size={16} color={C.primary} />
          <Text style={s.locationText}>Bakı</Text>
          <Ionicons name="chevron-down" size={16} color={C.textSoft} />
        </TouchableOpacity>

        {/* Search bar */}
        <TouchableOpacity style={s.searchBar} activeOpacity={0.9}>
          <Ionicons name="search-outline" size={18} color={C.textMuted} style={s.searchIcon} />
          <Text style={s.searchPlaceholder}>Hansı xidmət lazımdır?</Text>
          <View style={s.qrBtn}>
            <Ionicons name="qr-code-outline" size={18} color={C.textSoft} />
          </View>
        </TouchableOpacity>
      </View>

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

      {/* BOTTOM SHEET */}
      <View style={s.bottomSheet}>
        {/* Handle */}
        <View style={s.handle} />

        <Text style={s.sheetTitle}>Xidmət seçin</Text>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.listContent}
          bounces={true}
          overScrollMode="always"
        >
          {xidmetler.map((kat, index) => (
            <View key={kat.key}>
              <TouchableOpacity
                style={s.serviceRow}
                onPress={() => kateqoriyaSecildi(kat)}
                activeOpacity={0.7}
              >
                {/* Icon */}
                <View style={[s.serviceIconBox, { backgroundColor: (kat.rang || '#3B82F6') + '18' }]}>
                  <KatIkon ikon={kat.ikon} lib={ikonLib(kat.ikon_lib)} color={kat.rang || '#3B82F6'} size={26} />
                </View>

                {/* Text */}
                <View style={s.serviceTextBox}>
                  <Text style={s.serviceName}>{kat.ad}</Text>
                  {kat.altbaslik ? <Text style={s.serviceSubtitle}>{kat.altbaslik}</Text> : null}
                </View>

                {/* Price */}
                {(kat.qiymet_min || kat.qiymet_max) ? (
                  <Text style={s.servicePrice}>{qiymetMetn(kat.qiymet_min, kat.qiymet_max)}</Text>
                ) : null}
              </TouchableOpacity>

              {index < xidmetler.length - 1 && <View style={s.separator} />}
            </View>
          ))}
        </ScrollView>
      </View>
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
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: C.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.primary + '30',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.dark,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: C.textMuted,
  },
  qrBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },

  /* ── ACTIVE ORDER BANNER ── */
  aktivBanner: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.65 + 12,
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
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.72,
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.dark,
    paddingHorizontal: 20,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
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
