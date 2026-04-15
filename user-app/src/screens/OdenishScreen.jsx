import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import Button from '../components/Button';
import C from '../utils/colors';

const USULLAR = [
  { key: 'nagd', ikon: 'cash-outline', ad: 'Nağd' },
  { key: 'kart', ikon: 'card-outline', ad: 'Kart' },
  { key: 'balans', ikon: 'phone-portrait-outline', ad: 'Balans' },
];

export default function OdenishScreen({ route, navigation }) {
  const { sifaris_id } = route.params;
  const [usul, setUsul] = useState('nagd');
  const [məbleg, setMəbleg] = useState('');
  const [yuklenir, setYuklenir] = useState(false);

  async function odenisEt() {
    const m = parseFloat(məbleg);
    if (!məbleg || isNaN(m) || m <= 0) { Alert.alert('', 'Düzgün məbləğ daxil edin'); return; }
    setYuklenir(true);
    try {
      await api.post(`/sifaris/${sifaris_id}/odenish`, { odenis_usulu: usul, məbleg: m });
      navigation.replace('Reytinq', { sifaris_id });
    } catch (err) {
      Alert.alert('Xəta', err.xeta || 'Ödəniş aparıla bilmədi');
    } finally {
      setYuklenir(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: C.white }} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerIkon}>
            <Ionicons name="wallet" size={32} color={C.white} />
          </View>
          <Text style={s.headerBasliq}>Ödəniş</Text>
          <Text style={s.headerAlt}>Xidmət haqqını ödəyin</Text>
        </View>

        <View style={s.kart}>
          {/* Ödəniş üsulu */}
          <Text style={s.bolmeBasliq}>Ödəniş üsulu</Text>
          <View style={s.usulRow}>
            {USULLAR.map(u => (
              <TouchableOpacity
                key={u.key}
                style={[s.usulKart, usul === u.key && s.usulAktiv]}
                onPress={() => setUsul(u.key)}
                activeOpacity={0.8}
              >
                <View style={[s.usulIkonBox, usul === u.key && s.usulIkonBoxAktiv]}>
                  <Ionicons name={u.ikon} size={22} color={usul === u.key ? C.white : C.textSoft} />
                </View>
                <Text style={[s.usulAd, usul === u.key && { color: C.primary }]}>{u.ad}</Text>
                {usul === u.key && (
                  <View style={s.secilenIaret}>
                    <Ionicons name="checkmark-circle" size={16} color={C.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Məbləğ */}
          <Text style={[s.bolmeBasliq, { marginTop: 24 }]}>Məbləğ</Text>
          <View style={s.inputWrap}>
            <Text style={s.valyuta}>₼</Text>
            <TextInput
              style={s.input}
              value={məbleg}
              onChangeText={setMəbleg}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={C.textMuted}
            />
          </View>

          <Button
            title="Ödəniş et"
            onPress={odenisEt}
            loading={yuklenir}
            style={{ marginTop: 32 }}
            icon={<Ionicons name="checkmark-circle" size={20} color={C.white} />}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: C.white, paddingTop: 60, paddingBottom: 32,
    paddingHorizontal: 28, alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerIkon: {
    width: 60, height: 60, borderRadius: 18, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  headerBasliq: { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  headerAlt: { fontSize: 14, color: C.textSoft, marginTop: 4 },
  kart: {
    flex: 1, backgroundColor: C.white,
    padding: 28, paddingTop: 28,
  },
  bolmeBasliq: { fontSize: 13, fontWeight: '700', color: C.textSoft, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  usulRow: { flexDirection: 'row', gap: 10 },
  usulKart: {
    flex: 1, backgroundColor: C.bg, borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: C.border,
  },
  usulAktiv: { borderColor: C.primary, backgroundColor: C.primaryLight },
  usulIkonBox: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  usulIkonBoxAktiv: { backgroundColor: C.primary },
  usulAd: { fontSize: 13, fontWeight: '600', color: C.dark },
  secilenIaret: { position: 'absolute', top: 8, right: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 16, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 16, height: 64,
  },
  valyuta: { fontSize: 24, fontWeight: '700', color: C.textSoft, marginRight: 8 },
  input: { flex: 1, fontSize: 28, fontWeight: '700', color: C.dark },
});
