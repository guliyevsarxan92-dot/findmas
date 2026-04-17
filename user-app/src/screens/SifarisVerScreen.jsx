import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import C from '../utils/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BAKU_REGION = {
  latitude: 40.4093,
  longitude: 49.8671,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

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

function KatIkon({ ikon, lib, color, size = 22 }) {
  if (lib === 'mci') return <MaterialCommunityIcons name={ikon} size={size} color={color} />;
  return <Ionicons name={ikon} size={size} color={color} />;
}

export default function SifarisVerScreen({ route, navigation }) {
  const { kateqoriya } = route.params;

  const [tesvir, setTesvir] = useState('');
  const [fotolar, setFotolar] = useState([]);
  const [unvan, setUnvan] = useState('');
  const [konum, setKonum] = useState(null);
  const [mapRegion, setMapRegion] = useState(BAKU_REGION);
  const [konumYuklenir, setKonumYuklenir] = useState(false);
  const [yuklenir, setYuklenir] = useState(false);

  useEffect(() => {
    konumAl();
  }, []);

  async function konumAl() {
    setKonumYuklenir(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İcazə lazımdır', 'Konum icazəsi olmadan ünvan müəyyən edilə bilməz.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setKonum(coords);
      setMapRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      try {
        const [adres] = await Location.reverseGeocodeAsync(loc.coords);
        const parts = [adres.street, adres.streetNumber, adres.city || adres.region].filter(Boolean);
        setUnvan(parts.join(', '));
      } catch (err) { console.warn(err); }
    } catch {
      Alert.alert('Xəta', 'Konum alına bilmədi. Xəritəni əl ilə istifadə edin.');
    } finally {
      setKonumYuklenir(false);
    }
  }

  async function fotoEkle() {
    if (fotolar.length >= 3) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İcazə lazımdır', 'Qalereya icazəsi verin.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 3 - fotolar.length,
    });
    if (!result.canceled) {
      setFotolar(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 3));
    }
  }

  function fotoSil(index) {
    setFotolar(prev => prev.filter((_, i) => i !== index));
  }

  async function sifarisVer() {
    if (!tesvir.trim()) {
      Alert.alert('', 'Zəhmət olmasa problemi təsvir edin.');
      return;
    }
    if (!konum) {
      Alert.alert('', 'Konum seçilməyib. Ünvanı yeniləyin.');
      return;
    }
    setYuklenir(true);
    try {
      const { data } = await api.post('/sifaris', {
        kateqoriya: kateqoriya.key,
        problem_tesvirr: tesvir,
        unvan_metn: unvan,
        unvan_lat: konum.lat,
        unvan_lng: konum.lng,
        problem_foto: fotolar,
        alt_secim: kateqoriya.alt_secim || null,
      });
      navigation.replace('UstaAxtarilir', { sifaris_id: data.sifaris_id });
    } catch (err) {
      Alert.alert('Xəta', err?.xeta || 'Sifariş verilə bilmədi. Yenidən cəhd edin.');
    } finally {
      setYuklenir(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Full screen map */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={mapRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        customMapStyle={LIGHT_MAP_STYLE}
      >
        {konum && (
          <Marker
            coordinate={{ latitude: konum.lat, longitude: konum.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={s.markerOuter}>
              <View style={s.markerInner}>
                <Ionicons name="location-sharp" size={18} color={C.white} />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Back button */}
      <TouchableOpacity
        style={s.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-back" size={20} color={C.dark} />
      </TouchableOpacity>

      {/* Bottom sheet */}
      <View style={s.bottomSheet}>
        {/* Title */}
        <View style={s.sheetHeader}>
          <View style={[s.katIkonBox, { backgroundColor: kateqoriya.rang + '18' }]}>
            <KatIkon ikon={kateqoriya.ikon} lib={kateqoriya.lib} color={kateqoriya.rang} size={22} />
          </View>
          <View style={s.sheetTitleBox}>
            <Text style={s.sheetTitle}>{kateqoriya.ad}</Text>
            <Text style={s.sheetSubtitle}>Xidmət detalları</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.scrollContent}
          nestedScrollEnabled={true}
          style={s.scrollView}
        >
          {/* Address */}
          <TouchableOpacity
            style={[s.addressRow, konumYuklenir && s.addressRowLoading]}
            onPress={konumAl}
            activeOpacity={0.8}
            disabled={konumYuklenir}
          >
            <View style={s.addressIconBox}>
              {konumYuklenir ? (
                <ActivityIndicator size="small" color={C.primary} />
              ) : (
                <Ionicons
                  name={konum ? 'location-sharp' : 'locate-outline'}
                  size={18}
                  color={konum ? C.primary : C.textSoft}
                />
              )}
            </View>
            <Text
              style={[s.addressText, !unvan && s.addressPlaceholder]}
              numberOfLines={2}
            >
              {konumYuklenir
                ? 'Konum alınır...'
                : unvan || 'Ünvan daxil edin'}
            </Text>
            {!konumYuklenir && (
              <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
            )}
          </TouchableOpacity>

          {/* Problem description */}
          <View style={s.textInputBox}>
            <TextInput
              style={s.textInput}
              value={tesvir}
              onChangeText={setTesvir}
              placeholder="Problem haqqında qısaca yazın..."
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Photos */}
          <View style={s.photosRow}>
            {fotolar.map((uri, i) => (
              <TouchableOpacity key={i} onPress={() => fotoSil(i)} activeOpacity={0.85}>
                <Image source={{ uri }} style={s.photoThumb} />
                <View style={s.photoRemoveBadge}>
                  <Ionicons name="close" size={11} color={C.white} />
                </View>
              </TouchableOpacity>
            ))}
            {fotolar.length < 3 && (
              <TouchableOpacity style={s.photoAdd} onPress={fotoEkle} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={22} color={C.primary} />
                <Text style={s.photoAddText}>Foto</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Price range */}
          <View style={s.priceRow}>
            <Ionicons name="pricetag-outline" size={15} color={C.primary} />
            <Text style={s.priceLabel}>Təxmini qiymət:</Text>
            <View style={s.pricePill}>
              <Text style={s.priceText}>₼ {kateqoriya.qiymet}</Text>
            </View>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[s.submitBtn, yuklenir && s.submitBtnDisabled]}
            onPress={sifarisVer}
            activeOpacity={0.85}
            disabled={yuklenir}
          >
            {yuklenir ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <>
                <Ionicons name="flash" size={20} color={C.white} />
                <Text style={s.submitText}>Sifariş ver</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8eaf0',
  },

  /* ── MARKER ── */
  markerOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary + '28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },

  /* ── BACK BUTTON ── */
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 32) + 8,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },

  /* ── BOTTOM SHEET ── */
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.72,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
    flex: 0,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  katIkonBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sheetTitleBox: {
    gap: 2,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: C.textSoft,
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 14,
  },

  /* ── ADDRESS ROW ── */
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.bg,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  addressRowLoading: {
    borderColor: C.primary + '40',
    backgroundColor: C.primaryLight,
  },
  addressIconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: C.dark,
    fontWeight: '500',
  },
  addressPlaceholder: {
    color: C.textMuted,
    fontWeight: '400',
  },

  /* ── TEXT INPUT ── */
  textInputBox: {
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  textInput: {
    fontSize: 14,
    color: C.dark,
    minHeight: 80,
    lineHeight: 22,
  },

  /* ── PHOTOS ── */
  photosRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  photoRemoveBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.white,
  },
  photoAdd: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.primary + '60',
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.primary,
  },

  /* ── PRICE ── */
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: C.textSoft,
    flex: 1,
  },
  pricePill: {
    backgroundColor: C.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.primary + '30',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
  },

  /* ── SUBMIT BUTTON ── */
  submitBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
  },
});
