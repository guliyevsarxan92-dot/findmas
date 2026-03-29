import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import api from '../services/api';
import Button from '../components/Button';
import C from '../utils/colors';

export default function ReytinqScreen({ route, navigation }) {
  const { sifaris_id } = route.params;
  const [reytinq, setReytinq] = useState(0);
  const [yorum, setYorum] = useState('');
  const [yuklenir, setYuklenir] = useState(false);

  async function gonder() {
    if (!reytinq) { return; }
    setYuklenir(true);
    try {
      await api.post(`/sifaris/${sifaris_id}/reytinq`, { reytinq, reytinq_yorum: yorum });
    } catch {}
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }

  function kec() {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }

  return (
    <View style={s.wrap}>
      <Text style={s.ikon}>🎉</Text>
      <Text style={s.baslik}>İş tamamlandı!</Text>
      <Text style={s.alt}>Ustanı qiymətləndirin</Text>

      <View style={s.ulduzRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => setReytinq(n)}>
            <Text style={[s.ulduz, n <= reytinq && s.ulduzAktiv]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={s.yorumInput}
        value={yorum}
        onChangeText={setYorum}
        placeholder="Şərh yazın (istəyə bağlı)..."
        placeholderTextColor={C.textSoft}
        multiline
        numberOfLines={3}
      />

      <Button title="Göndər" onPress={gonder} loading={yuklenir} style={{ marginTop: 24 }} />
      <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={kec}>
        <Text style={{ color: C.textSoft, fontSize: 14 }}>Keç</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, padding: 24, alignItems: 'center', justifyContent: 'center' },
  ikon: { fontSize: 72, marginBottom: 16 },
  baslik: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 8 },
  alt: { fontSize: 16, color: C.textSoft, marginBottom: 32 },
  ulduzRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  ulduz: { fontSize: 44, color: C.border },
  ulduzAktiv: { color: '#f59e0b' },
  yorumInput: {
    width: '100%', backgroundColor: C.white, borderRadius: 14, padding: 14,
    fontSize: 15, color: C.text, borderWidth: 1.5, borderColor: C.border,
    textAlignVertical: 'top',
  },
});
