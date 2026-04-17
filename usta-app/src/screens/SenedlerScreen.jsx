import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import C from '../utils/colors';

export default function SenedlerScreen({ navigation }) {
  const [vesiqeOn, setVesiqeOn] = useState(null);
  const [lisenziya, setLisenziya] = useState(null);
  const [yuklenir, setYuklenir] = useState(false);
  const [ilkYukleme, setIlkYukleme] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/usta/profil');
        if (data?.vesiqe_on) setVesiqeOn(data.vesiqe_on);
        if (data?.lisenziya) setLisenziya(data.lisenziya);
      } catch {}
      setIlkYukleme(false);
    })();
  }, []);

  async function sekliSec(tip) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İcazə lazımdır', 'Foto seçmək üçün qalereya icazəsi verin.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
    if (tip === 'vesiqe') setVesiqeOn(base64Uri);
    else setLisenziya(base64Uri);
  }

  async function saxla() {
    if (!vesiqeOn) {
      Alert.alert('Xəta', 'Şəxsiyyət vəsiqəsinin ön hissəsini yükləyin');
      return;
    }
    if (!lisenziya) {
      Alert.alert('Xəta', 'Lisenziya / sertifikat yükləyin');
      return;
    }
    setYuklenir(true);
    try {
      await api.put('/usta/senedler', { vesiqe_on: vesiqeOn, lisenziya });
      // Lokal usta məlumatını yenilə
      const raw = await AsyncStorage.getItem('usta');
      if (raw) {
        const u = JSON.parse(raw);
        await AsyncStorage.setItem('usta', JSON.stringify({ ...u, vesiqe_on: vesiqeOn, lisenziya }));
      }
      Alert.alert('Uğurlu', 'Sənədləriniz göndərildi. Admin təsdiqlədikdən sonra onlayn ola biləcəksiniz.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Xəta', err.response?.data?.xeta || 'Sənədlər göndərilmədi');
    } finally {
      setYuklenir(false);
    }
  }

  if (ilkYukleme) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>;

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={s.basliq}>Sənədlərinizi yükləyin</Text>
      <Text style={s.alt}>Admin təsdiqi üçün aşağıdakı sənədlər tələb olunur.</Text>

      {/* Şəxsiyyət vəsiqəsi */}
      <Text style={s.label}>Şəxsiyyət vəsiqəsi (ön hissə)</Text>
      <TouchableOpacity style={s.yukleBox} onPress={() => sekliSec('vesiqe')} activeOpacity={0.8}>
        {vesiqeOn ? (
          <Image source={{ uri: vesiqeOn }} style={s.sekil} resizeMode="cover" />
        ) : (
          <View style={s.bosBox}>
            <Ionicons name="id-card-outline" size={40} color={C.textMuted} />
            <Text style={s.bosMetn}>Şəkil seçin</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Lisenziya */}
      <Text style={s.label}>Lisenziya / Sertifikat</Text>
      <TouchableOpacity style={s.yukleBox} onPress={() => sekliSec('lisenziya')} activeOpacity={0.8}>
        {lisenziya ? (
          <Image source={{ uri: lisenziya }} style={s.sekil} resizeMode="cover" />
        ) : (
          <View style={s.bosBox}>
            <Ionicons name="document-text-outline" size={40} color={C.textMuted} />
            <Text style={s.bosMetn}>Şəkil seçin</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={s.saxlaBtn} onPress={saxla} disabled={yuklenir} activeOpacity={0.85}>
        {yuklenir ? (
          <ActivityIndicator color={C.white} />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={20} color={C.white} />
            <Text style={s.saxlaMetn}>Sənədləri göndər</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.softBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  basliq: { fontSize: 22, fontWeight: '800', color: C.dark, marginBottom: 6 },
  alt: { fontSize: 14, color: C.textSoft, marginBottom: 24, lineHeight: 20 },

  label: { fontSize: 14, fontWeight: '600', color: C.dark, marginBottom: 8, marginTop: 8 },

  yukleBox: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 20,
    minHeight: 160,
  },
  sekil: { width: '100%', height: 200, borderRadius: 14 },
  bosBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  bosMetn: { fontSize: 14, color: C.textMuted, marginTop: 8 },

  saxlaBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saxlaMetn: { fontSize: 17, fontWeight: '800', color: C.white },
});
