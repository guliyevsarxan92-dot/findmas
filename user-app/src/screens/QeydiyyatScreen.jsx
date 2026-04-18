import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/Input';
import Button from '../components/Button';
import { qeydiyyat } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import C from '../utils/colors';

export default function QeydiyyatScreen({ navigation }) {
  const { setIsLoggedIn } = useAuth();
  const [form, setForm] = useState({ ad: '', soyad: '', telefon: '', sifre: '' });
  const [sertlerQebul, setSertlerQebul] = useState(false);
  const [sifreGoster, setSifreGoster] = useState(false);
  const [xeta, setXeta] = useState('');
  const [yuklenir, setYuklenir] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function telefonDeyis(v) {
    const temiz = v.replace(/[^0-9]/g, '');
    if (temiz.length <= 9) set('telefon', temiz);
  }

  async function qeydiyyatEt() {
    if (!form.ad || !form.soyad || !form.telefon || !form.sifre) { setXeta('Bütün sahələri doldurun'); return; }
    if (form.telefon.length < 9) { setXeta('Nömrə 9 rəqəm olmalıdır'); return; }
    if (form.sifre.length < 6) { setXeta('Şifrə ən az 6 simvol olmalıdır'); return; }
    if (!sertlerQebul) { setXeta('Xidmət şərtlərini qəbul etməlisiniz'); return; }
    setXeta('');
    setYuklenir(true);
    try {
      await qeydiyyat({ ...form, telefon: '+994' + form.telefon });
      setIsLoggedIn(true);
    } catch (err) {
      setXeta(err.xeta || 'Xəta baş verdi');
    } finally {
      setYuklenir(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={{ backgroundColor: C.white }}
        contentContainerStyle={s.wrap}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.geriBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={C.dark} />
          </TouchableOpacity>
          <Text style={s.baslik}>Qeydiyyat</Text>
          <Text style={s.alt}>Yeni hesab yaradın</Text>
        </View>

        <View style={s.form}>
          {xeta ? (
            <View style={s.xetaBox}>
              <Ionicons name="alert-circle" size={18} color={C.error} />
              <Text style={s.xetaMetn}>{xeta}</Text>
            </View>
          ) : null}

          <View style={s.ciftRow}>
            <View style={{ flex: 1 }}>
              <Input label="Ad" value={form.ad} onChangeText={v => set('ad', v)} placeholder="Adınız"
                icon={<Ionicons name="person-outline" size={20} color={C.dark} />} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Soyad" value={form.soyad} onChangeText={v => set('soyad', v)} placeholder="Soyadınız" />
            </View>
          </View>

          <Text style={s.label}>Telefon nömrəsi</Text>
          <View style={s.phoneRow}>
            <View style={s.prefixBox}>
              <Text style={s.prefixText}>+994</Text>
            </View>
            <View style={s.phoneInputBox}>
              <TextInput
                style={s.textInput}
                value={form.telefon}
                onChangeText={telefonDeyis}
                placeholder="XX XXX XX XX"
                placeholderTextColor={C.textMuted}
                keyboardType="phone-pad"
                maxLength={9}
              />
            </View>
          </View>

          <Text style={s.label}>Şifrə</Text>
          <View style={s.sifreRow}>
            <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={s.sifreInput}
              value={form.sifre}
              onChangeText={v => set('sifre', v)}
              placeholder="Ən az 6 simvol"
              placeholderTextColor={C.textMuted}
              secureTextEntry={!sifreGoster}
            />
            <TouchableOpacity onPress={() => setSifreGoster(v => !v)} activeOpacity={0.7}>
              <Ionicons name={sifreGoster ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Xidmət şərtləri */}
          <TouchableOpacity style={s.sertlerRow} onPress={() => setSertlerQebul(v => !v)} activeOpacity={0.7}>
            <View style={[s.checkbox, sertlerQebul && s.checkboxAktiv]}>
              {sertlerQebul && <Ionicons name="checkmark" size={14} color={C.white} />}
            </View>
            <Text style={s.sertlerMetn}>
              <Text style={s.sertlerLink}>Xidmət şərtləri</Text> və{' '}
              <Text style={s.sertlerLink}>Məxfilik siyasəti</Text>ni qəbul edirəm
            </Text>
          </TouchableOpacity>

          <Button title="Hesab yarat" onPress={qeydiyyatEt} loading={yuklenir} style={{ marginTop: 8 }}
            icon={<Ionicons name="checkmark-circle-outline" size={20} color={C.white} />} />

          <TouchableOpacity style={s.linkWrap} onPress={() => navigation.goBack()}>
            <Text style={s.link}>Artıq hesabınız var? <Text style={s.linkVurgu}>Giriş</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, backgroundColor: C.white },
  header: { padding: 28, paddingTop: 60, paddingBottom: 24 },
  geriBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
  },
  baslik: { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5 },
  alt: { fontSize: 15, color: C.textSoft, marginTop: 6 },
  form: { paddingHorizontal: 28, paddingBottom: 120 },
  xetaBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 16 },
  xetaMetn: { color: C.error, fontSize: 14, fontWeight: '500', flex: 1 },
  ciftRow: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: C.dark, marginBottom: 6 },
  phoneRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  prefixBox: {
    height: 52, borderRadius: 14, backgroundColor: C.primary + '10',
    borderWidth: 1.5, borderColor: C.primary + '30',
    paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center',
  },
  prefixText: { fontSize: 15, fontWeight: '700', color: C.primary },
  phoneInputBox: {
    flex: 1, height: 52, borderRadius: 14, backgroundColor: '#F9FAFB',
    borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 16, justifyContent: 'center',
  },
  textInput: { fontSize: 15, fontWeight: '500', color: C.dark },
  sifreRow: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 14, backgroundColor: '#F9FAFB',
    borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 16, marginBottom: 16,
  },
  sifreInput: { flex: 1, fontSize: 15, fontWeight: '500', color: C.dark },
  sertlerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxAktiv: { backgroundColor: C.primary, borderColor: C.primary },
  sertlerMetn: { flex: 1, fontSize: 13, color: C.textSoft, lineHeight: 18 },
  sertlerLink: { color: C.primary, fontWeight: '600' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14, color: C.textSoft },
  linkVurgu: { color: C.primary, fontWeight: '700' },
});
