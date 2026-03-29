import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import C from '../utils/colors';

const KATEQORIYALAR = [
  { key: 'santexnik', ikon: '🔧', ad: 'Santexnik' },
  { key: 'elektrik', ikon: '⚡', ad: 'Elektrik' },
  { key: 'qaynaqci', ikon: '🔥', ad: 'Qaynaqçı' },
  { key: 'duluscu', ikon: '🏗️', ad: 'Dulusçu' },
  { key: 'boyaqci', ikon: '🎨', ad: 'Boyaqçı' },
  { key: 'ustav', ikon: '🪚', ad: 'Ustav' },
  { key: 'kondisioner', ikon: '❄️', ad: 'Kondisioner' },
  { key: 'temizlik', ikon: '🧹', ad: 'Təmizlik' },
  { key: 'diger', ikon: '🛠️', ad: 'Digər' },
];

export default function AnaScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [aktivSifaris, setAktivSifaris] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('user').then(r => r && setUser(JSON.parse(r)));
    aktivYoxla();
  }, []);

  async function aktivYoxla() {
    try {
      const { data } = await api.get('/sifaris/aktiv');
      if (data) setAktivSifaris(data);
    } catch {}
  }

  function kateqoriyaSecildi(kat) {
    if (aktivSifaris) {
      Alert.alert('Aktiv sifariş', 'Artıq aktiv sifarişiniz var', [
        { text: 'Sifarişə bax', onPress: () => navigation.navigate('AktivSifaris') },
        { text: 'Bağla' },
      ]);
      return;
    }
    navigation.navigate('SifarisVer', { kateqoriya: kat });
  }

  return (
    <ScrollView style={s.wrap} showsVerticalScrollIndicator={false}>
      {/* Salam */}
      <View style={s.header}>
        <View>
          <Text style={s.salam}>Salam, {user?.ad || 'İstifadəçi'} 👋</Text>
          <Text style={s.alt}>Hansı usta lazımdır?</Text>
        </View>
      </View>

      {/* Aktiv sifariş banneri */}
      {aktivSifaris && (
        <TouchableOpacity style={s.aktivBanner} onPress={() => navigation.navigate('AktivSifaris')}>
          <Text style={s.aktivIkon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.aktivBasliq}>Aktiv sifariş</Text>
            <Text style={s.aktivAlt}>{aktivSifaris.kateqoriya} • {STATUS_METN[aktivSifaris.status]}</Text>
          </View>
          <Text style={{ color: C.primary, fontWeight: '600' }}>Bax →</Text>
        </TouchableOpacity>
      )}

      {/* Kateqoriyalar */}
      <View style={s.grid}>
        {KATEQORIYALAR.map(k => (
          <TouchableOpacity key={k.key} style={s.kart} onPress={() => kateqoriyaSecildi(k)} activeOpacity={0.7}>
            <Text style={s.kartIkon}>{k.ikon}</Text>
            <Text style={s.kartAd}>{k.ad}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const STATUS_METN = {
  gozlenilir: 'Usta axtarılır',
  qebul_edildi: 'Usta yolda',
  yolda: 'Usta gəlir',
  baslandi: 'İş başladı',
};

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  header: { padding: 24, paddingBottom: 16 },
  salam: { fontSize: 22, fontWeight: '800', color: C.text },
  alt: { fontSize: 15, color: C.textSoft, marginTop: 2 },
  aktivBanner: {
    margin: 16, marginTop: 0, backgroundColor: C.primary,
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  aktivIkon: { fontSize: 28 },
  aktivBasliq: { color: '#fff', fontWeight: '700', fontSize: 15 },
  aktivAlt: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  kart: {
    width: '30%', backgroundColor: C.white, borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  kartIkon: { fontSize: 32 },
  kartAd: { fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'center' },
});
