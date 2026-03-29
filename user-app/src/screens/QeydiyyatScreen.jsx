import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import { qeydiyyat } from '../services/auth';
import C from '../utils/colors';

export default function QeydiyyatScreen({ navigation }) {
  const [form, setForm] = useState({ ad: '', soyad: '', telefon: '', sifre: '' });
  const [xeta, setXeta] = useState('');
  const [yuklenir, setYuklenir] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function qeydiyyatEt() {
    if (!form.ad || !form.soyad || !form.telefon || !form.sifre) {
      setXeta('Bütün sahələri doldurun');
      return;
    }
    if (form.sifre.length < 6) { setXeta('Şifrə ən az 6 simvol olmalıdır'); return; }
    setXeta('');
    setYuklenir(true);
    try {
      await qeydiyyat(form);
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
        <Text style={s.baslik}>Qeydiyyat</Text>

        {xeta ? <View style={s.xetaBox}><Text style={s.xetaMetn}>{xeta}</Text></View> : null}

        <Input label="Ad" value={form.ad} onChangeText={v => set('ad', v)} placeholder="Adınız" />
        <Input label="Soyad" value={form.soyad} onChangeText={v => set('soyad', v)} placeholder="Soyadınız" />
        <Input label="Telefon" value={form.telefon} onChangeText={v => set('telefon', v)}
          placeholder="+994501234567" keyboardType="phone-pad" />
        <Input label="Şifrə" value={form.sifre} onChangeText={v => set('sifre', v)}
          placeholder="Ən az 6 simvol" secureTextEntry />

        <Button title="Qeydiyyatdan keç" onPress={qeydiyyatEt} loading={yuklenir} style={{ marginTop: 8 }} />

        <TouchableOpacity style={s.linkWrap} onPress={() => navigation.goBack()}>
          <Text style={s.link}>Artıq hesabınız var? <Text style={{ color: C.primary, fontWeight: '600' }}>Giriş</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, padding: 24, backgroundColor: C.bg },
  baslik: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 24, marginTop: 20 },
  xetaBox: { backgroundColor: '#fee2e2', borderRadius: 10, padding: 12, marginBottom: 16 },
  xetaMetn: { color: C.error, fontSize: 14 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14, color: C.textSoft },
});
