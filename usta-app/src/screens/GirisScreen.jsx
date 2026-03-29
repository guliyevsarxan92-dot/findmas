import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import { giris } from '../services/auth';
import C from '../utils/colors';

export default function GirisScreen({ navigation }) {
  const [form, setForm] = useState({ telefon: '', sifre: '' });
  const [xeta, setXeta] = useState('');
  const [yuklenir, setYuklenir] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function daxilOl() {
    if (!form.telefon || !form.sifre) { setXeta('Bütün sahələri doldurun'); return; }
    setXeta('');
    setYuklenir(true);
    try {
      await giris(form.telefon, form.sifre);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err) {
      setXeta(err.xeta || 'Xəta baş verdi');
    } finally {
      setYuklenir(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.logo}>🔧</Text>
          <Text style={s.baslik}>Usta Paneli</Text>
          <Text style={s.alt}>Hesabınıza daxil olun</Text>
        </View>

        {xeta ? <View style={s.xetaBox}><Text style={s.xetaMetn}>{xeta}</Text></View> : null}

        <Input label="Telefon" value={form.telefon} onChangeText={v => set('telefon', v)}
          placeholder="+994501234567" keyboardType="phone-pad" />
        <Input label="Şifrə" value={form.sifre} onChangeText={v => set('sifre', v)}
          placeholder="••••••••" secureTextEntry />

        <Button title="Daxil ol" onPress={daxilOl} loading={yuklenir} style={{ marginTop: 8 }} />

        <TouchableOpacity style={s.linkWrap} onPress={() => navigation.navigate('Qeydiyyat')}>
          <Text style={s.link}>Hesabınız yoxdur? <Text style={{ color: C.primary, fontWeight: '600' }}>Qeydiyyat</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: C.bg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 36 },
  logo: { fontSize: 52, marginBottom: 8 },
  baslik: { fontSize: 28, fontWeight: '800', color: C.text },
  alt: { fontSize: 15, color: C.textSoft, marginTop: 4 },
  xetaBox: { backgroundColor: '#fee2e2', borderRadius: 10, padding: 12, marginBottom: 16 },
  xetaMetn: { color: C.error, fontSize: 14 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14, color: C.textSoft },
});
