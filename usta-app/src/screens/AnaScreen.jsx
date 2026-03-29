import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import api, { WS_URL } from '../services/api';
import C from '../utils/colors';


export default function AnaScreen({ navigation }) {
  const [usta, setUsta] = useState(null);
  const [onlayn, setOnlayn] = useState(false);
  const [aktivSifaris, setAktivSifaris] = useState(null);
  const socketRef = useRef(null);
  const konumInterval = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('usta').then(r => {
      if (r) {
        const u = JSON.parse(r);
        setUsta(u);
        setOnlayn(u.onlayn || false);
      }
    });
    aktivYoxla();
    qosul();
    return () => {
      socketRef.current?.disconnect();
      clearInterval(konumInterval.current);
    };
  }, []);

  async function aktivYoxla() {
    try {
      const { data } = await api.get('/sifaris/aktiv');
      if (data) setAktivSifaris(data);
    } catch {}
  }

  async function qosul() {
    const token = await AsyncStorage.getItem('token');
    const socket = io(WS_URL, { auth: { token } });
    socketRef.current = socket;

    // Yeni sifariş gəldi — 30 saniyə bildiriş ekranı
    socket.on('yeni_sifaris', (sifaris) => {
      navigation.navigate('YeniSifaris', { sifaris });
    });
  }

  async function onlaynDeyis(deger) {
    if (deger && !usta?.tesdiqlendi) {
      Alert.alert('Hesab təsdiqlənməyib', 'Admin hesabınızı hələ təsdiqləməyib. Zəhmət olmasa gözləyin.');
      return;
    }
    try {
      await api.put('/usta/onlayn', { onlayn: deger });
      setOnlayn(deger);
      const yeniUsta = { ...usta, onlayn: deger };
      setUsta(yeniUsta);
      await AsyncStorage.setItem('usta', JSON.stringify(yeniUsta));

      if (deger) {
        // Konum yeniləməyə başla
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          konumInterval.current = setInterval(async () => {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            api.put('/usta/konum', { lat: loc.coords.latitude, lng: loc.coords.longitude }).catch(() => {});
          }, 30000); // 30 saniyədən bir
        }
      } else {
        clearInterval(konumInterval.current);
      }
    } catch (err) {
      Alert.alert('Xəta', err.xeta || 'Xəta baş verdi');
    }
  }

  return (
    <ScrollView style={s.wrap} showsVerticalScrollIndicator={false}>
      {/* Onlayn/Offline toggle */}
      <View style={[s.toggleKart, { backgroundColor: onlayn ? C.success : '#94a3b8' }]}>
        <View>
          <Text style={s.toggleBasliq}>{onlayn ? '🟢 Onlaynsınız' : '⚫ Offlayn'}</Text>
          <Text style={s.toggleAlt}>{onlayn ? 'Sifarişlər alırsınız' : 'Sifarişlər almırsınız'}</Text>
        </View>
        <Switch
          value={onlayn}
          onValueChange={onlaynDeyis}
          trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.5)' }}
          thumbColor="#fff"
        />
      </View>

      {/* Hesab təsdiq gözləyir */}
      {usta && !usta.tesdiqlendi && (
        <View style={s.xeberdarlik}>
          <Text style={s.xeberdarlikMetn}>⏳ Hesabınız admin tərəfindən təsdiq gözləyir</Text>
        </View>
      )}

      {/* Aktiv sifariş */}
      {aktivSifaris && (
        <TouchableOpacity style={s.aktivBanner} onPress={() => navigation.navigate('AktivSifaris')}>
          <Text style={s.aktivIkon}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.aktivBasliq}>Aktiv sifariş</Text>
            <Text style={s.aktivAlt}>{aktivSifaris.kateqoriya} • {aktivSifaris.unvan_metn}</Text>
          </View>
          <Text style={{ color: C.primary, fontWeight: '600' }}>Bax →</Text>
        </TouchableOpacity>
      )}

      {/* Statistika kartları */}
      {usta && (
        <View style={s.statRow}>
          <View style={s.statKart}>
            <Text style={s.statDeger}>{usta.tamamlanan_sifaris || 0}</Text>
            <Text style={s.statLabel}>Sifariş</Text>
          </View>
          <View style={s.statKart}>
            <Text style={s.statDeger}>⭐ {usta.orta_reytinq || '—'}</Text>
            <Text style={s.statLabel}>Reytinq</Text>
          </View>
          <View style={s.statKart}>
            <Text style={s.statDeger}>{usta.umuml_qazanc || 0} ₼</Text>
            <Text style={s.statLabel}>Qazanc</Text>
          </View>
        </View>
      )}

      {/* İxtisas */}
      {usta && (
        <View style={s.ixtisasKart}>
          <Text style={s.ixtisasLabel}>İxtisasınız</Text>
          <Text style={s.ixtisas} >{usta.kateqoriya}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  toggleKart: {
    margin: 16, borderRadius: 18, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  toggleBasliq: { color: '#fff', fontSize: 18, fontWeight: '800' },
  toggleAlt: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  xeberdarlik: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fef3c7', borderRadius: 12, padding: 12 },
  xeberdarlikMetn: { color: '#92400e', fontSize: 13, fontWeight: '500' },
  aktivBanner: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: C.white,
    borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderLeftWidth: 4, borderLeftColor: C.primary,
  },
  aktivIkon: { fontSize: 24 },
  aktivBasliq: { fontWeight: '700', fontSize: 14, color: C.text },
  aktivAlt: { fontSize: 12, color: C.textSoft, marginTop: 2 },
  statRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 12 },
  statKart: {
    flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  statDeger: { fontSize: 17, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 12, color: C.textSoft, marginTop: 4 },
  ixtisasKart: { marginHorizontal: 16, backgroundColor: C.white, borderRadius: 14, padding: 16 },
  ixtisasLabel: { fontSize: 12, color: C.textSoft, marginBottom: 4 },
  ixtisas: { fontSize: 16, fontWeight: '700', color: C.text, textTransform: 'capitalize' },
});
