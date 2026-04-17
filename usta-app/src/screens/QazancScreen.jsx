import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import C_STATIC from '../utils/colors';

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

const DOVRELER = [
  { key: 'gunluk', label: 'Günlük' },
  { key: 'heftelik', label: 'Həftəlik' },
  { key: 'aylik', label: 'Aylıq' },
];

export default function QazancScreen() {
  const { C } = useTheme();
  const [tarixce, setTarixce] = useState([]);
  const [profil, setProfil] = useState(null);
  const [qazanc, setQazanc] = useState(null);
  const [yuklenir, setYuklenir] = useState(true);
  const [aktivDovre, setAktivDovre] = useState('heftelik');

  useFocusEffect(
    useCallback(() => {
      setYuklenir(true);
      Promise.all([
        api.get('/usta/profil').then(r => setProfil(r.data)),
        api.get('/sifaris/tarixce').then(r => setTarixce(r.data.sifarisler || [])),
        api.get('/usta/qazanc').then(r => setQazanc(r.data)),
      ]).catch(() => {}).finally(() => setYuklenir(false));
    }, [])
  );

  if (yuklenir) return (
    <View style={s.yuklenirWrap}>
      <ActivityIndicator color={C.primary} size="large" />
    </View>
  );

  const aktiv = qazanc?.[aktivDovre] || { qazanc: 0, xidmet_haqqi: 0, komisyon: 0, say: 0 };

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
              <Text style={s.headerAlt}>Xidmət haqqından hesablanır</Text>
            </View>

            {/* Period tabs */}
            <View style={s.tabRow}>
              {DOVRELER.map(d => (
                <TouchableOpacity
                  key={d.key}
                  style={[s.tab, aktivDovre === d.key && s.tabAktiv]}
                  onPress={() => setAktivDovre(d.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.tabText, aktivDovre === d.key && s.tabTextAktiv]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Earnings hero card */}
            <View style={s.heroCard}>
              <View style={s.heroTop}>
                <View style={s.heroIconBox}>
                  <Ionicons name="wallet-outline" size={26} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.heroLabel}>Xalis qazanc</Text>
                  <Text style={s.heroAmount}>{aktiv.qazanc.toFixed(2)} ₼</Text>
                </View>
              </View>
              <View style={s.heroStats}>
                <View style={s.heroStat}>
                  <Text style={s.heroStatLabel}>Xidmət haqqı</Text>
                  <Text style={s.heroStatVal}>{aktiv.xidmet_haqqi.toFixed(2)} ₼</Text>
                </View>
                <View style={s.heroStatSep} />
                <View style={s.heroStat}>
                  <Text style={s.heroStatLabel}>Komisyon (10%)</Text>
                  <Text style={[s.heroStatVal, { color: C.error }]}>-{aktiv.komisyon.toFixed(2)} ₼</Text>
                </View>
                <View style={s.heroStatSep} />
                <View style={s.heroStat}>
                  <Text style={s.heroStatLabel}>Sifarişlər</Text>
                  <Text style={s.heroStatVal}>{aktiv.say}</Text>
                </View>
              </View>
            </View>

            {/* Stat cards */}
            <View style={s.statGrid}>
              <View style={s.statKart}>
                <View style={[s.statIkon, { backgroundColor: C.primaryLightBg }]}>
                  <Ionicons name="checkmark-done-outline" size={20} color={C.primary} />
                </View>
                <Text style={s.statRəqəm}>{profil?.tamamlanan_sifaris || 0}</Text>
                <Text style={s.statAd}>Ümumi sifariş</Text>
              </View>
              <View style={s.statKart}>
                <View style={[s.statIkon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="star-outline" size={20} color={C.warning} />
                </View>
                <Text style={s.statRəqəm}>{profil?.orta_reytinq || '—'}</Text>
                <Text style={s.statAd}>Reytinq</Text>
              </View>
              <View style={s.statKart}>
                <View style={[s.statIkon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="cash-outline" size={20} color={C.primary} />
                </View>
                <Text style={s.statRəqəm}>{parseFloat(profil?.umuml_qazanc || 0).toFixed(0)} ₼</Text>
                <Text style={s.statAd}>Ümumi</Text>
              </View>
            </View>

            <Text style={s.tarixceBasliq}>Son sifarişlər</Text>
          </>
        }
        renderItem={({ item }) => {
          const ikon = KAT_IKONLAR[item.kateqoriya] || 'construct-outline';
          const tarix = new Date(item.yaradildi).toLocaleDateString('az-AZ', { day: '2-digit', month: 'long' });
          const haqqi = parseFloat(item.xidmet_haqqi || item.məbleg || 0);
          const komis = parseFloat(item.komisyon || 0);
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
              {haqqi > 0 ? (
                <View style={s.məblegBox}>
                  <Text style={s.məbleg}>+{(haqqi - komis).toFixed(2)} ₼</Text>
                  {komis > 0 ? (
                    <Text style={s.komisyon}>-{komis.toFixed(2)} ₼</Text>
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
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerBasliq: { fontSize: 26, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  headerAlt: { fontSize: 13, color: C.textSoft, marginTop: 4 },

  // Period tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  tabAktiv: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: C.textSoft },
  tabTextAktiv: { color: C.white, fontWeight: '700' },

  // Hero card
  heroCard: {
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  heroIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: C.primaryLightBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: { fontSize: 12, color: C.textSoft, marginBottom: 2 },
  heroAmount: { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5 },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.softBg,
    borderRadius: 12,
    padding: 12,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { fontSize: 10, color: C.textMuted, marginBottom: 2 },
  heroStatVal: { fontSize: 14, fontWeight: '700', color: C.dark },
  heroStatSep: { width: 1, height: 28, backgroundColor: C.border },

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
