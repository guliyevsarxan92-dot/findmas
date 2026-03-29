import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import { qeydiyyat } from '../services/auth';
import C from '../utils/colors';

const KATEQORIYALAR = [
  { key: 'santexnik', ad: '🔧 Santexnik' },
  { key: 'elektrik', ad: '⚡ Elektrik' },
  { key: 'qaynaqci', ad: '🔥 Qaynaqçı' },
  { key: 'duluscu', ad: '🏗️ Dulusçu' },
  { key: 'boyaqci', ad: '🎨 Boyaqçı' },
  { key: 'ustav', ad: '🪚 Ustav' },
  { key: 'kondisioner', ad: '❄️ Kondisioner' },
  { key: 'temizlik', ad: '🧹 Təmizlik' },
  { key: 'diger', ad: '🛠️ Digər' },
];

export default function QeydiyyatScreen({ navigation }) {
  const [addim, setAddim] = useState(1); // 2 addım: 1-məlumat, 2-kateqoriya
  const [form, setForm] = useState({ ad: '', soyad: '', telefon: '', sifre: '', kateqoriya: '' });
  const [xeta, setXeta] = useState('');
  const [yuklenir, setYuklenir] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function novbeti() {
    if (!form.ad || !form.soyad || !form.telefon || !form.sifre) {
      setXeta('Bütün sahələri doldurun'); return;
    }
    if (form.sifre.length < 6) { setXeta('Şifrə ən az 6 simvol'); return; }
    setXeta('');
    setAddim(2);
  }

  async function qeydiyyatEt() {
    if (!form.kateqoriya) { setXeta('Kateqoriya seçin'); return; }
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
        {/* Addım göstəricisi */}
        <View style={s.addimRow}>
          <View style={[s.addimDaire, addim >= 1 && s.addimAktiv]}><Text style={s.addimMetn}>1</Text></View>
          <View style={[s.addimXett, addim >= 2 && { backgroundColor: C.primary }]} />
          <View style={[s.addimDaire, addim >= 2 && s.addimAktiv]}><Text style={s.addimMetn}>2</Text></View>
        </View>

        <Text style={s.baslik}>{addim === 1 ? 'Məlumatlar' : 'İxtisasınız'}</Text>

        {xeta ? <View style={s.xetaBox}><Text style={s.xetaMetn}>{xeta}</Text></View> : null}

        {addim === 1 ? (
          <>
            <Input label="Ad" value={form.ad} onChangeText={v => set('ad', v)} placeholder="Adınız" />
            <Input label="Soyad" value={form.soyad} onChangeText={v => set('soyad', v)} placeholder="Soyadınız" />
            <Input label="Telefon" value={form.telefon} onChangeText={v => set('telefon', v)}
              placeholder="+994501234567" keyboardType="phone-pad" />
            <Input label="Şifrə" value={form.sifre} onChangeText={v => set('sifre', v)}
              placeholder="Ən az 6 simvol" secureTextEntry />
            <Button title="Növbəti →" onPress={novbeti} style={{ marginTop: 8 }} />
          </>
        ) : (
          <>
            <View style={s.katGrid}>
              {KATEQORIYALAR.map(k => (
                <TouchableOpacity
                  key={k.key}
                  style={[s.katKart, form.kateqoriya === k.key && s.katAktiv]}
                  onPress={() => set('kateqoriya', k.key)}
                >
                  <Text style={s.katMetn}>{k.ad}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Qeydiyyatı tamamla" onPress={qeydiyyatEt} loading={yuklenir} style={{ marginTop: 16 }} />
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setAddim(1)}>
              <Text style={{ color: C.textSoft }}>← Geri</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={s.linkWrap} onPress={() => navigation.goBack()}>
          <Text style={s.link}>Artıq hesabınız var? <Text style={{ color: C.primary, fontWeight: '600' }}>Giriş</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, padding: 24, backgroundColor: C.bg },
  addimRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, marginTop: 12 },
  addimDaire: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  addimAktiv: { backgroundColor: C.primary },
  addimMetn: { color: '#fff', fontWeight: '700', fontSize: 14 },
  addimXett: { flex: 1, height: 2, backgroundColor: C.border, marginHorizontal: 8 },
  baslik: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 20 },
  xetaBox: { backgroundColor: '#fee2e2', borderRadius: 10, padding: 12, marginBottom: 16 },
  xetaMetn: { color: C.error, fontSize: 14 },
  katGrid: { gap: 10 },
  katKart: {
    backgroundColor: C.white, borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: C.border,
  },
  katAktiv: { borderColor: C.primary, backgroundColor: C.primary + '08' },
  katMetn: { fontSize: 15, fontWeight: '500', color: C.text },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14, color: C.textSoft },
});
