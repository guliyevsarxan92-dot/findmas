import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import Button from '../components/Button';
import C from '../utils/colors';

export default function ReytinqScreen({ route, navigation }) {
  const { sifaris_id } = route.params;
  const [reytinq, setReytinq] = useState(0);
  const [yorum, setYorum] = useState('');
  const [yuklenir, setYuklenir] = useState(false);

  async function gonder() {
    if (!reytinq) {
      Alert.alert('', 'Zəhmət olmasa reytinq seçin');
      return;
    }
    setYuklenir(true);
    try {
      await api.post(`/sifaris/${sifaris_id}/reytinq`, { reytinq, reytinq_yorum: yorum });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch {
      Alert.alert('Xəta', 'Reytinq göndərilə bilmədi. Yenidən cəhd edin.');
    } finally {
      setYuklenir(false);
    }
  }

  function kec() {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }

  const yorumlar = [
    'Əla işdi!',
    'Çox peşəkardır',
    'Vaxtında gəldi',
    'Tövsiyə edirəm',
  ];

  return (
    <View style={s.wrap}>
      {/* Uğur ikonu */}
      <View style={s.uğurBox}>
        <View style={s.konfeti1} />
        <View style={s.konfeti2} />
        <View style={s.konfeti3} />
        <View style={s.daire}>
          <Ionicons name="checkmark" size={48} color={C.white} />
        </View>
      </View>

      <Text style={s.baslik}>İş tamamlandı!</Text>
      <Text style={s.alt}>Xidmət necə idi? Ustanı qiymətləndirin.</Text>

      {/* Ulduzlar */}
      <View style={s.ulduzRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => setReytinq(n)} activeOpacity={0.75}>
            <Ionicons
              name={n <= reytinq ? 'star' : 'star-outline'}
              size={42}
              color={n <= reytinq ? '#F59E0B' : C.border}
            />
          </TouchableOpacity>
        ))}
      </View>

      {reytinq > 0 && (
        <Text style={s.reytinqMetn}>
          {reytinq === 5 ? 'Əla!' : reytinq === 4 ? 'Yaxşı' : reytinq === 3 ? 'Orta' : reytinq === 2 ? 'Pis' : 'Çox pis'}
        </Text>
      )}

      {/* Sürətli şərhlər */}
      {reytinq >= 4 && (
        <View style={s.suretkiRow}>
          {yorumlar.map(y => (
            <TouchableOpacity
              key={y}
              style={[s.surYorum, yorum === y && s.surYorumAktiv]}
              onPress={() => setYorum(yorum === y ? '' : y)}
            >
              <Text style={[s.surMetn, yorum === y && { color: C.primary }]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Yorum input */}
      <TextInput
        style={s.yorumInput}
        value={yorum}
        onChangeText={setYorum}
        placeholder="Şərh yazın (istəyə bağlı)..."
        placeholderTextColor={C.textMuted}
        multiline
        numberOfLines={3}
      />

      <Button
        title="Göndər"
        onPress={gonder}
        loading={yuklenir}
        style={{ marginTop: 16 }}
        icon={<Ionicons name="send" size={18} color={C.white} />}
      />

      <TouchableOpacity style={s.kecBtn} onPress={kec}>
        <Text style={s.kecMetn}>Sonra qiymətləndir</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1, backgroundColor: C.white, padding: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  uğurBox: { position: 'relative', marginBottom: 28, alignItems: 'center', justifyContent: 'center', width: 120, height: 120 },
  daire: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  konfeti1: { position: 'absolute', top: 0, right: 10, width: 12, height: 12, borderRadius: 3, backgroundColor: C.primary, transform: [{ rotate: '30deg' }] },
  konfeti2: { position: 'absolute', top: 10, left: 0, width: 10, height: 10, borderRadius: 3, backgroundColor: '#F59E0B', transform: [{ rotate: '-20deg' }] },
  konfeti3: { position: 'absolute', bottom: 5, right: 0, width: 8, height: 8, borderRadius: 2, backgroundColor: '#EF4444', transform: [{ rotate: '45deg' }] },
  baslik: { fontSize: 26, fontWeight: '800', color: C.dark, marginBottom: 8 },
  alt: { fontSize: 15, color: C.textSoft, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  ulduzRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  reytinqMetn: { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 16 },
  suretkiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20, width: '100%' },
  surYorum: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg,
  },
  surYorumAktiv: { borderColor: C.primary, backgroundColor: C.primaryLight },
  surMetn: { fontSize: 13, fontWeight: '600', color: C.textSoft },
  yorumInput: {
    width: '100%', backgroundColor: C.bg, borderRadius: 16, padding: 14,
    fontSize: 15, color: C.dark, borderWidth: 1.5, borderColor: C.border,
    textAlignVertical: 'top', minHeight: 80,
  },
  kecBtn: { marginTop: 14 },
  kecMetn: { fontSize: 14, color: C.textSoft },
});
