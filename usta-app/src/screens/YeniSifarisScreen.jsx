import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import api from '../services/api';
import C from '../utils/colors';

export default function YeniSifarisScreen({ route, navigation }) {
  const { sifaris } = route.params;
  const [qalan, setQalan] = useState(30);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 30 saniyə geri sayac
    const interval = setInterval(() => {
      setQalan(q => {
        if (q <= 1) {
          clearInterval(interval);
          navigation.goBack();
          return 0;
        }
        return q - 1;
      });
    }, 1000);

    // Progress bar animasiyası
    Animated.timing(progress, {
      toValue: 0,
      duration: 30000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(interval);
  }, []);

  async function qebulEt() {
    try {
      await api.post(`/sifaris/${sifaris.id}/qebul`);
      navigation.replace('AktivSifaris');
    } catch (err) {
      alert(err.xeta || 'Sifariş artıq götürülüb');
      navigation.goBack();
    }
  }

  function reddEt() {
    navigation.goBack();
  }

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.wrap}>
      {/* Timer */}
      <View style={s.timerWrap}>
        <View style={s.timerBar}>
          <Animated.View style={[s.timerDolgu, { width: progressWidth }]} />
        </View>
        <Text style={s.timerMetn}>{qalan} saniyə</Text>
      </View>

      <Text style={s.bashliq}>Yeni Sifariş!</Text>

      {/* Məsafə */}
      {sifaris.məsafe && (
        <View style={s.məsafeBadge}>
          <Text style={s.məsafeMetn}>📍 {sifaris.məsafe.toFixed(1)} km</Text>
        </View>
      )}

      {/* Detallar */}
      <View style={s.detalKart}>
        <View style={s.detalSatir}>
          <Text style={s.detalLabel}>Kateqoriya</Text>
          <Text style={s.detalDeger}>{sifaris.kateqoriya}</Text>
        </View>
        <View style={s.xett} />
        <View style={s.detalSatir}>
          <Text style={s.detalLabel}>Problem</Text>
          <Text style={[s.detalDeger, { flex: 1, textAlign: 'right' }]} numberOfLines={3}>
            {sifaris.problem_tesvirr}
          </Text>
        </View>
        <View style={s.xett} />
        <View style={s.detalSatir}>
          <Text style={s.detalLabel}>Ünvan</Text>
          <Text style={[s.detalDeger, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
            {sifaris.unvan_metn}
          </Text>
        </View>
      </View>

      {/* Düymələr */}
      <View style={s.duymeler}>
        <TouchableOpacity style={s.reddBtn} onPress={reddEt}>
          <Text style={s.reddMetn}>Rədd et</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.qebulBtn} onPress={qebulEt}>
          <Text style={s.qebulMetn}>✓ Qəbul et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, padding: 20 },
  timerWrap: { marginBottom: 24 },
  timerBar: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  timerDolgu: { height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  timerMetn: { textAlign: 'right', fontSize: 13, color: C.textSoft },
  bashliq: { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 12 },
  məsafeBadge: { backgroundColor: C.primary + '15', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 20 },
  məsafeMetn: { color: C.primary, fontWeight: '700', fontSize: 14 },
  detalKart: { backgroundColor: C.white, borderRadius: 16, padding: 16, gap: 12, marginBottom: 'auto' },
  detalSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  detalLabel: { fontSize: 13, color: C.textSoft, fontWeight: '500' },
  detalDeger: { fontSize: 14, color: C.text, fontWeight: '600' },
  xett: { height: 1, backgroundColor: C.border },
  duymeler: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 },
  reddBtn: { flex: 1, height: 54, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  reddMetn: { fontSize: 16, fontWeight: '600', color: C.textSoft },
  qebulBtn: { flex: 2, height: 54, borderRadius: 14, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center' },
  qebulMetn: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
