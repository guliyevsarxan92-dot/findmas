import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../services/api';
import C from '../utils/colors';

const STATUS_LABEL = {
  odendi: { text: 'Tamamlandı', color: C.success },
  legv_edildi: { text: 'Ləğv edildi', color: C.error },
};

export default function TarixceScreen() {
  const [sifarisler, setSifarisler] = useState([]);
  const [sehife, setSehife] = useState(1);
  const [daha, setDaha] = useState(true);
  const [yuklenir, setYuklenir] = useState(false);

  useEffect(() => { yukle(1); }, []);

  async function yukle(s) {
    if (yuklenir) return;
    setYuklenir(true);
    try {
      const { data } = await api.get(`/sifaris/tarixce?sehife=${s}`);
      setSifarisler(prev => s === 1 ? data.sifarisler : [...prev, ...data.sifarisler]);
      setDaha(data.sifarisler.length === 20);
      setSehife(s);
    } catch {}
    setYuklenir(false);
  }

  function renderItem({ item }) {
    const st = STATUS_LABEL[item.status] || { text: item.status, color: C.textSoft };
    return (
      <View style={s.kart}>
        <View style={s.kartIkon}>
          <Text style={{ fontSize: 22 }}>🔧</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.kateqoriya}>{item.kateqoriya}</Text>
          <Text style={s.tarix} numberOfLines={1}>{item.unvan_metn}</Text>
          <Text style={s.tarix}>
            {new Date(item.yaradildi).toLocaleDateString('az-AZ', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={[s.status, { color: st.color }]}>{st.text}</Text>
          {item.məbleg && <Text style={s.mebleg}>{item.məbleg} ₼</Text>}
          {item.reytinq && <Text style={{ fontSize: 12 }}>{'★'.repeat(item.reytinq)}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <FlatList
        data={sifarisler}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          yuklenir ? null : <Text style={s.bos}>Sifariş tarixçəsi yoxdur</Text>
        }
        onEndReached={() => daha && yukle(sehife + 1)}
        onEndReachedThreshold={0.3}
        ListFooterComponent={yuklenir ? <ActivityIndicator color={C.primary} style={{ padding: 20 }} /> : null}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, gap: 12 },
  kart: {
    backgroundColor: C.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  kartIkon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary + '15', alignItems: 'center', justifyContent: 'center' },
  kateqoriya: { fontSize: 15, fontWeight: '700', color: C.text, textTransform: 'capitalize' },
  tarix: { fontSize: 12, color: C.textSoft, marginTop: 2 },
  status: { fontSize: 12, fontWeight: '600' },
  mebleg: { fontSize: 14, fontWeight: '700', color: C.text },
  bos: { textAlign: 'center', color: C.textSoft, marginTop: 60, fontSize: 15 },
});
