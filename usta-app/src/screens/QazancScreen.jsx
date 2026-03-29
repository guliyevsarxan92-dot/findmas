import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import api from '../services/api';
import C from '../utils/colors';

export default function QazancScreen() {
  const [tarixce, setTarixce] = useState([]);
  const [profil, setProfil] = useState(null);
  const [yuklenir, setYuklenir] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/usta/profil').then(r => setProfil(r.data)),
      api.get('/sifaris/tarixce').then(r => setTarixce(r.data.sifarisler)),
    ]).finally(() => setYuklenir(false));
  }, []);

  if (yuklenir) return <View style={s.wrap}><ActivityIndicator color={C.primary} /></View>;

  return (
    <View style={s.wrap}>
      {/* Ümumi statistika */}
      <View style={s.header}>
        <View style={s.statRow}>
          <View style={s.statKart}>
            <Text style={s.statDeger}>{profil?.umuml_qazanc || 0} ₼</Text>
            <Text style={s.statLabel}>Ümumi qazanc</Text>
          </View>
          <View style={s.statKart}>
            <Text style={s.statDeger}>{profil?.tamamlanan_sifaris || 0}</Text>
            <Text style={s.statLabel}>Tamamlanan</Text>
          </View>
          <View style={s.statKart}>
            <Text style={s.statDeger}>⭐ {profil?.orta_reytinq || '—'}</Text>
            <Text style={s.statLabel}>Reytinq</Text>
          </View>
        </View>
      </View>

      <Text style={s.tarixceBasliq}>Son sifarişlər</Text>

      <FlatList
        data={tarixce}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={s.kart}>
            <View style={{ flex: 1 }}>
              <Text style={s.kartKat}>{item.kateqoriya}</Text>
              <Text style={s.kartTarix}>
                {new Date(item.yaradildi).toLocaleDateString('az-AZ', { day: '2-digit', month: 'long' })}
              </Text>
              {item.reytinq && <Text style={s.reytinq}>{'★'.repeat(item.reytinq)}</Text>}
            </View>
            {item.məbleg && <Text style={s.məbleg}>+{item.məbleg} ₼</Text>}
          </View>
        )}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<Text style={s.bos}>Hələ tamamlanan sifariş yoxdur</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, padding: 20, paddingTop: 10 },
  statRow: { flexDirection: 'row', gap: 10 },
  statKart: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statDeger: { fontSize: 16, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 3, textAlign: 'center' },
  tarixceBasliq: { fontSize: 16, fontWeight: '700', color: C.text, padding: 16, paddingBottom: 0 },
  kart: {
    backgroundColor: C.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  kartKat: { fontSize: 15, fontWeight: '700', color: C.text, textTransform: 'capitalize' },
  kartTarix: { fontSize: 12, color: C.textSoft, marginTop: 2 },
  reytinq: { fontSize: 13, color: '#f59e0b', marginTop: 4 },
  məbleg: { fontSize: 18, fontWeight: '800', color: C.success },
  bos: { textAlign: 'center', color: C.textSoft, marginTop: 40 },
});
