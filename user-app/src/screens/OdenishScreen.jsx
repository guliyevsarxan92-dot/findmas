import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import api from '../services/api';
import Button from '../components/Button';
import C from '../utils/colors';

const USULLAR = [
  { key: 'nagd', ikon: '💵', ad: 'Nağd' },
  { key: 'kart', ikon: '💳', ad: 'Kart' },
  { key: 'balans', ikon: '📱', ad: 'Balans' },
];

export default function OdenishScreen({ route, navigation }) {
  const { sifaris_id } = route.params;
  const [usul, setUsul] = useState('nagd');
  const [məbleg, setMəbleg] = useState('');
  const [yuklenir, setYuklenir] = useState(false);

  async function odenisEt() {
    if (!məbleg || isNaN(məbleg)) { Alert.alert('', 'Məbləği daxil edin'); return; }
    setYuklenir(true);
    try {
      await api.post(`/sifaris/${sifaris_id}/odenish`, { odenis_usulu: usul, məbleg: parseFloat(məbleg) });
      navigation.replace('Reytinq', { sifaris_id });
    } catch (err) {
      Alert.alert('Xəta', err.xeta || 'Ödəniş aparıla bilmədi');
    } finally {
      setYuklenir(false);
    }
  }

  return (
    <View style={s.wrap}>
      <Text style={s.baslik}>Ödəniş</Text>

      <Text style={s.label}>Ödəniş üsulu</Text>
      <View style={s.usulRow}>
        {USULLAR.map(u => (
          <TouchableOpacity
            key={u.key}
            style={[s.usulKart, usul === u.key && s.usulAktiv]}
            onPress={() => setUsul(u.key)}
          >
            <Text style={{ fontSize: 28 }}>{u.ikon}</Text>
            <Text style={[s.usulAd, usul === u.key && { color: C.primary }]}>{u.ad}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Məbləğ (₼)</Text>
      <TextInput
        style={s.input}
        value={məbleg}
        onChangeText={setMəbleg}
        placeholder="0.00"
        keyboardType="decimal-pad"
        placeholderTextColor={C.textSoft}
      />

      <Button title="Ödəniş et" onPress={odenisEt} loading={yuklenir} style={{ marginTop: 'auto', marginBottom: 32 }} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, padding: 24 },
  baslik: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: C.textSoft, marginBottom: 12 },
  usulRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  usulKart: {
    flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: C.border,
  },
  usulAktiv: { borderColor: C.primary, backgroundColor: C.primary + '08' },
  usulAd: { fontSize: 14, fontWeight: '600', color: C.text },
  input: {
    backgroundColor: C.white, borderRadius: 14, padding: 16,
    fontSize: 20, fontWeight: '700', color: C.text,
    borderWidth: 1.5, borderColor: C.border,
  },
});
