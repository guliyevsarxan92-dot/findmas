import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { WS_URL } from '../services/api';
import C from '../utils/colors';


const ADDIMLAR = [
  { status: 'qebul_edildi', metn: 'Usta qəbul etdi', ikon: '✅' },
  { status: 'yolda', metn: 'Usta yolda', ikon: '🚗' },
  { status: 'baslandi', metn: 'İş başladı', ikon: '🔧' },
  { status: 'tamamlandi', metn: 'İş tamamlandı', ikon: '🎉' },
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

    socket.on('sifaris_status', ({ status }) => {
      setSifaris(prev => prev ? { ...prev, status } : prev);
    });

    socket.on('odenis_alindi', () => {
      navigation.replace('OdenisUgurlu');
    });
  }

  function addimIndeksi(status) {
    return ADDIMLAR.findIndex(a => a.status === status);
  }

  async function zengVur() {
    if (sifaris?.usta?.telefon) {
      Linking.openURL(`tel:${sifaris.usta.telefon}`);
    }
  }

  function odenisEt() {
    navigation.navigate('Odenish', { sifaris_id: sifaris.id });
  }

  if (!sifaris) {
    return <View style={s.wrap}><Text style={{ color: C.textSoft }}>Yüklənir...</Text></View>;
  }

  const cariIndeks = addimIndeksi(sifaris.status);

  return (
    <ScrollView style={s.wrap} showsVerticalScrollIndicator={false}>
      {/* Usta kartı */}
      {sifaris.usta && (
        <View style={s.ustaKart}>
          <View style={s.ustaAvatar}>
            <Text style={{ fontSize: 28 }}>👷</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.ustaAd}>{sifaris.usta.ad} {sifaris.usta.soyad}</Text>
            <Text style={s.ustaReytinq}>⭐ {sifaris.usta.orta_reytinq || 'Yeni'}</Text>
          </View>
          <TouchableOpacity style={s.zengBtn} onPress={zengVur}>
            <Text style={{ fontSize: 20 }}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.chatBtn} onPress={() => navigation.navigate('Chat', { sifaris_id: sifaris.id })}>
            <Text style={{ fontSize: 20 }}>💬</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status addımları */}
      <View style={s.addimlarWrap}>
        {ADDIMLAR.map((a, i) => {
          const kecdi = i <= cariIndeks;
          const caridır = i === cariIndeks;
          return (
            <View key={a.status} style={s.addim}>
              <View style={[s.addimDaire, kecdi && s.addimAktiv, caridır && s.addimCari]}>
                <Text style={{ fontSize: 16 }}>{a.ikon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.addimMetn, kecdi && { color: C.text, fontWeight: '600' }]}>{a.metn}</Text>
              </View>
              {i < ADDIMLAR.length - 1 && (
                <View style={[s.xett, { backgroundColor: i < cariIndeks ? C.primary : C.border }]} />
              )}
            </View>
          );
        })}
      </View>

      {/* Sifariş detalları */}
      <View style={s.detalKart}>
        <Text style={s.detalBasliq}>Sifariş detalı</Text>
        <Text style={s.detalMetn}>{sifaris.problem_tesvirr}</Text>
        <Text style={s.detalUnvan}>📍 {sifaris.unvan_metn}</Text>
      </View>

      {/* Ödəniş düyməsi */}
      {sifaris.status === 'tamamlandi' && (
        <TouchableOpacity style={s.odenisBtn} onPress={odenisEt}>
          <Text style={s.odenisBtnMetn}>💳 Ödəniş et</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  ustaKart: {
    margin: 16, backgroundColor: C.white, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  ustaAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  ustaAd: { fontSize: 16, fontWeight: '700', color: C.text },
  ustaReytinq: { fontSize: 13, color: C.textSoft, marginTop: 2 },
  zengBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.success + '20', alignItems: 'center', justifyContent: 'center' },
  chatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary + '20', alignItems: 'center', justifyContent: 'center' },
  addimlarWrap: { margin: 16, backgroundColor: C.white, borderRadius: 16, padding: 20, gap: 20 },
  addim: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  addimDaire: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  addimAktiv: { backgroundColor: C.primary + '20' },
  addimCari: { backgroundColor: C.primary, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  addimMetn: { fontSize: 15, color: C.textSoft },
  xett: { position: 'absolute', left: 21, top: 44, width: 2, height: 20 },
  detalKart: { margin: 16, marginTop: 0, backgroundColor: C.white, borderRadius: 16, padding: 16 },
  detalBasliq: { fontSize: 14, fontWeight: '600', color: C.textSoft, marginBottom: 8 },
  detalMetn: { fontSize: 15, color: C.text, lineHeight: 22 },
  detalUnvan: { fontSize: 13, color: C.textSoft, marginTop: 8 },
  odenisBtn: {
    margin: 16, backgroundColor: C.primary, borderRadius: 16,
    padding: 18, alignItems: 'center',
  },
  odenisBtnMetn: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
