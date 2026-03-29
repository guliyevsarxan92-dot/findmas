import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { WS_URL } from '../services/api';
import C from '../utils/colors';


// Ustanın edə biləcəyi status keçidləri
const STATUS_ADDIMLAR = [
  { cari: 'qebul_edildi', novbeti: 'yolda', label: '🚗 Yola çıxdım' },
  { cari: 'yolda', novbeti: 'baslandi', label: '🔧 İşi başladım' },
  { cari: 'baslandi', novbeti: 'tamamlandi', label: '✅ İşi tamamladım' },
];

export default function AktivSifarisScreen({ navigation }) {
  const [sifaris, setSifaris] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    yukle();
    qosul();
    return () => socketRef.current?.disconnect();
  }, []);

  async function yukle() {
    try {
      const { data } = await api.get('/sifaris/aktiv');
      setSifaris(data);
    } catch {}
  }

  async function qosul() {
    const token = await AsyncStorage.getItem('token');
    const socket = io(WS_URL, { auth: { token } });
    socketRef.current = socket;
    socket.on('odenis_alindi', ({ məbleg }) => {
      Alert.alert('Ödəniş alındı! 💰', `${məbleg} ₼ alındı`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    });
  }

  async function statusDeyis(novbeti) {
    try {
      await api.post(`/sifaris/${sifaris.id}/status`, { yeni_status: novbeti });
      setSifaris(prev => ({ ...prev, status: novbeti }));
    } catch (err) {
      Alert.alert('Xəta', err.xeta || 'Xəta baş verdi');
    }
  }

  function xeriteyeAc() {
    if (!sifaris) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${sifaris.unvan_lat},${sifaris.unvan_lng}`;
    Linking.openURL(url);
  }

  function zengVur() {
    if (sifaris?.istifadeci?.telefon) Linking.openURL(`tel:${sifaris.istifadeci.telefon}`);
  }

  if (!sifaris) return <View style={s.wrap}><Text style={{ color: C.textSoft, textAlign: 'center', marginTop: 60 }}>Yüklənir...</Text></View>;

  const addim = STATUS_ADDIMLAR.find(a => a.cari === sifaris.status);

  return (
    <ScrollView style={s.wrap} showsVerticalScrollIndicator={false}>
      {/* Müştəri kartı */}
      <View style={s.musteriKart}>
        <View style={s.avatar}><Text style={{ fontSize: 26 }}>👤</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.musteriAd}>{sifaris.istifadeci?.ad} {sifaris.istifadeci?.soyad}</Text>
          <Text style={s.musteriAlt}>Müştəri</Text>
        </View>
        <TouchableOpacity style={s.actionBtn} onPress={zengVur}>
          <Text style={{ fontSize: 20 }}>📞</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Chat', { sifaris_id: sifaris.id })}>
          <Text style={{ fontSize: 20 }}>💬</Text>
        </TouchableOpacity>
      </View>

      {/* Xəritə düyməsi */}
      <TouchableOpacity style={s.xeritəBtn} onPress={xeriteyeAc}>
        <Text style={s.xeritəMetn}>🗺️ Naviqasiyanı aç — {sifaris.unvan_metn}</Text>
      </TouchableOpacity>

      {/* Problem */}
      <View style={s.problemKart}>
        <Text style={s.problemLabel}>Problem</Text>
        <Text style={s.problemMetn}>{sifaris.problem_tesvirr}</Text>
        <View style={[s.statusBadge]}>
          <Text style={s.statusMetn}>{sifaris.status.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Növbəti addım düyməsi */}
      {addim && (
        <TouchableOpacity
          style={s.novbetiBtn}
          onPress={() => {
            Alert.alert('Təsdiq', `"${addim.label}" — davam etmək istəyirsiniz?`, [
              { text: 'Bəli', onPress: () => statusDeyis(addim.novbeti) },
              { text: 'Xeyr' },
            ]);
          }}
        >
          <Text style={s.novbetiMetn}>{addim.label}</Text>
        </TouchableOpacity>
      )}

      {sifaris.status === 'tamamlandi' && (
        <View style={s.gozlemeKart}>
          <Text style={s.gozlemeMetn}>✅ İş tamamlandı. Müştərinin ödənişi gözlənilir...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  musteriKart: {
    margin: 16, backgroundColor: C.white, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  musteriAd: { fontSize: 16, fontWeight: '700', color: C.text },
  musteriAlt: { fontSize: 12, color: C.textSoft },
  actionBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  xeritəBtn: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1d4ed8', borderRadius: 14, padding: 14 },
  xeritəMetn: { color: '#fff', fontWeight: '600', fontSize: 14, textAlign: 'center' },
  problemKart: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.white, borderRadius: 14, padding: 16 },
  problemLabel: { fontSize: 12, color: C.textSoft, marginBottom: 6 },
  problemMetn: { fontSize: 15, color: C.text, lineHeight: 22 },
  statusBadge: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: C.primary + '15', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  statusMetn: { color: C.primary, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' },
  novbetiBtn: {
    margin: 16, backgroundColor: C.success, borderRadius: 16, padding: 18, alignItems: 'center',
    shadowColor: C.success, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  novbetiMetn: { color: '#fff', fontSize: 18, fontWeight: '800' },
  gozlemeKart: { margin: 16, backgroundColor: '#dcfce7', borderRadius: 14, padding: 16 },
  gozlemeMetn: { color: '#166534', fontSize: 14, fontWeight: '500', textAlign: 'center' },
});
