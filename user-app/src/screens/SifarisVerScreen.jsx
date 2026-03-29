import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../services/api';
import C from '../utils/colors';

export default function SifarisVerScreen({ route, navigation }) {
  const { kateqoriya } = route.params;
  const [tesvirr, setTesvirr] = useState('');
  const [fotolar, setFotolar] = useState([]);
  const [unvan, setUnvan] = useState('');
  const [konum, setKonum] = useState(null);
  const [konumYuklenir, setKonumYuklenir] = useState(false);
  const [yuklenir, setYuklenir] = useState(false);

  async function fotoEkle() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('İcazə lazımdır', 'Qalereya icazəsi verin'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 3,
    });
    if (!result.canceled) {
      setFotolar(f => [...f, ...result.assets.map(a => a.uri)].slice(0, 3));
    }
  }

  async function konumAl() {
    setKonumYuklenir(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('İcazə lazımdır', 'Konum icazəsi verin'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [adres] = await Location.reverseGeocodeAsync(loc.coords);
      const unvanMetn = `${adres.street || ''} ${adres.streetNumber || ''}, ${adres.city || adres.region}`.trim();
      setKonum({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setUnvan(unvanMetn);
    } catch {
      Alert.alert('Xəta', 'Konum alına bilmədi');
    } finally {
      setKonumYuklenir(false);
    }
  }

  async function sifarisVer() {
    if (!tesvirr.trim()) { Alert.alert('', 'Problemi təsvir edin'); return; }
    if (!konum) { Alert.alert('', 'Konum seçin'); return; }
    setYuklenir(true);
    try {
      const { data } = await api.post('/sifaris', {
        kateqoriya: kateqoriya.key,
        problem_tesvirr: tesvirr,
        unvan_metn: unvan,
        unvan_lat: konum.lat,
        unvan_lng: konum.lng,
        problem_foto: fotolar,
      });
      navigation.replace('UstaAxtarilir', { sifaris_id: data.sifaris_id });
    } catch (err) {
      Alert.alert('Xəta', err.xeta || 'Sifariş verilə bilmədi');
    } finally {
      setYuklenir(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.wrap} keyboardShouldPersistTaps="handled">
        <View style={s.katBadge}>
          <Text style={s.katIkon}>{kateqoriya.ikon}</Text>
          <Text style={s.katAd}>{kateqoriya.ad}</Text>
        </View>

        <Text style={s.baslik}>Sifariş detalları</Text>

        <Input
          label="Problemi təsvir edin"
          value={tesvirr}
          onChangeText={setTesvirr}
          placeholder="Məsələn: Vanna otağında su sızır..."
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
        />

        {/* Foto */}
        <Text style={s.label}>Foto (istəyə bağlı)</Text>
        <View style={s.fotoRow}>
          {fotolar.map((uri, i) => (
            <TouchableOpacity key={i} onPress={() => setFotolar(f => f.filter((_, j) => j !== i))}>
              <Image source={{ uri }} style={s.foto} />
              <View style={s.fotoCixar}><Text style={{ color: '#fff', fontWeight: '700' }}>✕</Text></View>
            </TouchableOpacity>
          ))}
          {fotolar.length < 3 && (
            <TouchableOpacity style={s.fotoEkle} onPress={fotoEkle}>
              <Text style={{ fontSize: 28, color: C.textSoft }}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Konum */}
        <Text style={s.label}>Ünvan</Text>
        <TouchableOpacity style={s.konumBtn} onPress={konumAl} disabled={konumYuklenir}>
          {konumYuklenir
            ? <ActivityIndicator color={C.primary} />
            : <>
                <Text style={s.konumIkon}>{konum ? '✅' : '📍'}</Text>
                <Text style={[s.konumMetn, konum && { color: C.text }]}>
                  {konum ? unvan || 'Konum alındı' : 'Cari konumumu istifadə et'}
                </Text>
              </>
          }
        </TouchableOpacity>

        {konum && (
          <Input
            label="Ünvanı dəqiqləşdir"
            value={unvan}
            onChangeText={setUnvan}
            placeholder="Küçə, ev nömrəsi..."
          />
        )}

        <Button title="Usta Çağır 🔧" onPress={sifarisVer} loading={yuklenir} style={{ marginTop: 16, marginBottom: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, padding: 20 },
  katBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  katIkon: { fontSize: 24 },
  katAd: { fontSize: 16, fontWeight: '700', color: C.primary },
  baslik: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '500', color: C.textSoft, marginBottom: 8 },
  fotoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  foto: { width: 80, height: 80, borderRadius: 10 },
  fotoCixar: {
    position: 'absolute', top: -6, right: -6, width: 20, height: 20,
    borderRadius: 10, backgroundColor: C.error, alignItems: 'center', justifyContent: 'center',
  },
  fotoEkle: {
    width: 80, height: 80, borderRadius: 10, borderWidth: 1.5,
    borderColor: C.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  konumBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white,
    borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: C.border, marginBottom: 16,
  },
  konumIkon: { fontSize: 20 },
  konumMetn: { fontSize: 14, color: C.textSoft, flex: 1 },
});
