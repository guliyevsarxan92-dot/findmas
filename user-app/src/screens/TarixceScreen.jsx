import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import C from '../utils/colors';

const KAT_IKONLAR = {
  santexnik: 'water-outline',
  elektrik: 'flash-outline',
  qaynaqci: 'flame-outline',
  duluscu: 'construct-outline',
  boyaqci: 'color-palette-outline',
  ustav: 'hammer-outline',
  kondisioner: 'snow-outline',
  temizlik: 'sparkles-outline',
  diger: 'options-outline',
};

const STATUS_CFG = {
  tamamlandi: { text: 'Tamamlandı', color: '#16A34A', bg: '#F0FDF4', ikon: 'checkmark-circle' },
  odendi: { text: 'Ödənildi', color: '#16A34A', bg: '#F0FDF4', ikon: 'checkmark-circle' },
  legv_edildi: { text: 'Ləğv edildi', color: C.error, bg: '#FEF2F2', ikon: 'close-circle' },
  redd_edildi: { text: 'Rədd edildi', color: '#F59E0B', bg: '#FFFBEB', ikon: 'alert-circle' },
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
    } catch (err) { console.warn(err); }
    setYuklenir(false);
  }

  function renderItem({ item }) {
    const st = STATUS_CFG[item.status] || { text: item.status, color: C.textSoft, bg: C.bg, ikon: 'ellipse-outline' };
    const ikon = KAT_IKONLAR[item.kateqoriya] || 'construct-outline';
    const tarix = new Date(item.yaradildi).toLocaleDateString('az-AZ', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
      <View style={s.kart}>
        <View style={s.kartSol}>
          <View style={s.katIkon}>
            <Ionicons name={ikon} size={22} color={C.primary} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.kateqoriya}>{item.kateqoriya?.charAt(0).toUpperCase() + item.kateqoriya?.slice(1)}</Text>
          {item.unvan_metn ? (
            <View style={s.unvanRow}>
              <Ionicons name="location-outline" size={12} color={C.textSoft} />
              <Text style={s.unvan} numberOfLines={1}>{item.unvan_metn}</Text>
            </View>
          ) : null}
          <View style={s.tarixRow}>
            <Ionicons name="calendar-outline" size={12} color={C.textSoft} />
            <Text style={s.tarix}>{tarix}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
            <Ionicons name={st.ikon} size={12} color={st.color} />
            <Text style={[s.statusMetn, { color: st.color }]}>{st.text}</Text>
          </View>
          {item.məbleg ? (
            <Text style={s.mebleg}>{item.məbleg} ₼</Text>
          ) : null}
          {item.reytinq ? (
            <View style={s.reytinqRow}>
              {[1,2,3,4,5].map(n => (
                <Ionicons key={n} name={n <= item.reytinq ? 'star' : 'star-outline'} size={11} color="#F59E0B" />
              ))}
            </View>
          ) : null}
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
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.headerBasliq}>Sifariş tarixçəsi</Text>
            <Text style={s.headerAlt}>{sifarisler.length} sifariş</Text>
          </View>
        }
        ListEmptyComponent={
          yuklenir ? null : (
            <View style={s.bosWrap}>
              <View style={s.bosIkon}>
                <Ionicons name="receipt-outline" size={36} color={C.primary} />
              </View>
              <Text style={s.bosBasliq}>Tarixçə boşdur</Text>
              <Text style={s.bosAlt}>Hələ sifariş verməmisiniz</Text>
            </View>
          )
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
  list: { paddingBottom: 24 },
  header: {
    backgroundColor: C.white, paddingTop: 60, paddingBottom: 24,
    paddingHorizontal: 24, marginBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerBasliq: { fontSize: 24, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  headerAlt: { fontSize: 14, color: C.textSoft, marginTop: 4 },
  kart: {
    backgroundColor: C.white, marginHorizontal: 16, marginBottom: 10,
    borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  kartSol: {},
  katIkon: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  kateqoriya: { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 4 },
  unvanRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  unvan: { fontSize: 12, color: C.textSoft, flex: 1 },
  tarixRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tarix: { fontSize: 12, color: C.textSoft },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusMetn: { fontSize: 11, fontWeight: '600' },
  mebleg: { fontSize: 15, fontWeight: '800', color: C.dark },
  reytinqRow: { flexDirection: 'row', gap: 1 },
  bosWrap: { alignItems: 'center', paddingTop: 80 },
  bosIkon: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  bosBasliq: { fontSize: 18, fontWeight: '700', color: C.dark, marginBottom: 6 },
  bosAlt: { fontSize: 14, color: C.textSoft },
});
