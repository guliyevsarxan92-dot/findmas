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

export default function QazancScreen() {
  const [tarixce, setTarixce] = useState([]);
  const [profil, setProfil] = useState(null);
  const [yuklenir, setYuklenir] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/usta/profil').then(r => setProfil(r.data)),
      api.get('/sifaris/tarixce').then(r => setTarixce(r.data.sifarisler || [])),
    ]).catch(() => {}).finally(() => setYuklenir(false));
  }, []);

  if (yuklenir) return (
    <View style={s.yuklenirWrap}>
      <ActivityIndicator color={C.primary} size="large" />
    </View>
  );

  return (
    <View style={s.wrap}>
      <FlatList
        data={tarixce}
        keyExtractor={i => i.id}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={s.header}>
              <Text style={s.headerBasliq}>Qazanc</Text>
              <Text style={s.headerAlt}>Ümumi məlumat</Text>
            </View>

            {/* Total earnings hero */}
            <View style={s.heroCard}>
              <View style={s.heroIconBox}>
                <Ionicons name="wallet-outline" size={28} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.heroLabel}>Ümumi qazanc</Text>
                <Text style={s.heroAmount}>{profil?.umuml_qazanc || 0} ₼</Text>
              </View>
            </View>

            {/* Stat cards */}
            <View style={s.statGrid}>
              <View style={s.statKart}>
                <View style={[s.statIkon, { backgroundColor: C.primaryLightBg }]}>
                  <Ionicons name="checkmark-done-outline" size={20} color={C.primary} />
                </View>
                <Text style={s.statRəqəm}>{profil?.tamamlanan_sifaris || 0}</Text>
                <Text style={s.statAd}>Sifarişlər</Text>
              </View>
              <View style={s.statKart}>
                <View style={[s.statIkon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="star-outline" size={20} color={C.warning} />
                </View>
                <Text style={s.statRəqəm}>{profil?.orta_reytinq || '—'}</Text>
                <Text style={s.statAd}>Reytinq</Text>
              </View>
              <View style={s.statKart}>
                <View style={[s.statIkon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="trending-up-outline" size={20} color="#6366F1" />
                </View>
                <Text style={s.statRəqəm}>98%</Text>
                <Text style={s.statAd}>Qəbul</Text>
              </View>
            </View>

            <Text style={s.tarixceBasliq}>Son sifarişlər</Text>
          </>
        }
        renderItem={({ item }) => {
          const ikon = KAT_IKONLAR[item.kateqoriya] || 'construct-outline';
          const tarix = new Date(item.yaradildi).toLocaleDateString('az-AZ', { day: '2-digit', month: 'long' });
          return (
            <View style={s.kart}>
              <View style={s.katIkon}>
                <Ionicons name={ikon} size={20} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.kartKat}>
                  {item.kateqoriya?.charAt(0).toUpperCase() + item.kateqoriya?.slice(1)}
                </Text>
                <View style={s.kartAlt}>
                  <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
                  <Text style={s.kartTarix}>{tarix}</Text>
                </View>
                {item.reytinq ? (
                  <View style={s.reytinqRow}>
                    {[1,2,3,4,5].map(n => (
                      <Ionicons key={n} name={n <= item.reytinq ? 'star' : 'star-outline'} size={11} color={C.warning} />
                    ))}
                  </View>
                ) : null}
              </View>
              {item.məbleg ? (
                <View style={s.məblegBox}>
                  <Text style={s.məbleg}>+{(item.məbleg - (item.komisyon || 0)).toFixed(2)} ₼</Text>
                  {item.komisyon ? (
                    <Text style={s.komisyon}>-{item.komisyon} ₼ komis.</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        }}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.bosWrap}>
            <View style={s.bosIkon}>
              <Ionicons name="wallet-outline" size={32} color={C.primary} />
            </View>
            <Text style={s.bosMetn}>Hələ tamamlanan sifariş yoxdur</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.softBg },
  yuklenirWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },

  header: {
    backgroundColor: C.white,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerBasliq: { fontSize: 26, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  headerAlt: { fontSize: 14, color: C.textSoft, marginTop: 4 },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  heroIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  heroAmount: { fontSize: 30, fontWeight: '800', color: C.white, letterSpacing: -0.5 },

  statGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  statKart: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIkon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRəqəm: { fontSize: 18, fontWeight: '800', color: C.dark },
  statAd: { fontSize: 11, color: C.textSoft, textAlign: 'center' },

  tarixceBasliq: {
    fontSize: 16,
    fontWeight: '700',
    color: C.dark,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 6,
  },

  list: { paddingBottom: 24 },

  kart: {
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  katIkon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.primaryLightBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kartKat: { fontSize: 14, fontWeight: '700', color: C.dark },
  kartAlt: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  kartTarix: { fontSize: 12, color: C.textSoft },
  reytinqRow: { flexDirection: 'row', gap: 1, marginTop: 4 },

  məblegBox: {
    backgroundColor: C.primaryLightBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'flex-end',
  },
  məbleg: { fontSize: 15, fontWeight: '800', color: C.primary },
  komisyon: { fontSize: 11, color: C.textMuted, marginTop: 1 },

  bosWrap: { alignItems: 'center', paddingTop: 60 },
  bosIkon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: C.primaryLightBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bosMetn: { fontSize: 15, color: C.textSoft },
});
