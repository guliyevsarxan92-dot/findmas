import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/Input';
import Button from '../components/Button';
import { qeydiyyat } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import C from '../utils/colors';

export default function QeydiyyatScreen({ navigation }) {
  const { setIsLoggedIn } = useAuth();
  const [form, setForm] = useState({ ad: '', soyad: '', telefon: '', sifre: '' });
  const [xeta, setXeta] = useState('');
  const [yuklenir, setYuklenir] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function qeydiyyatEt() {
    if (!form.ad || !form.soyad || !form.telefon || !form.sifre) { setXeta('Bütün sahələri doldurun'); return; }
    if (form.sifre.length < 6) { setXeta('Şifrə ən az 6 simvol olmalıdır'); return; }
    setXeta('');
    setYuklenir(true);
    try {
      await qeydiyyat(form);
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
          <View style={s.logoBox}>
            <Ionicons name="construct" size={28} color={C.white} />
          </View>
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

          <Input label="Telefon" value={form.telefon} onChangeText={v => set('telefon', v)}
            placeholder="+994 XX XXX XX XX" keyboardType="phone-pad"
            icon={<Ionicons name="call-outline" size={20} color={C.dark} />} />
          <Input label="Şifrə" value={form.sifre} onChangeText={v => set('sifre', v)}
            placeholder="Ən az 6 simvol" secureTextEntry
            icon={<Ionicons name="lock-closed-outline" size={20} color={C.dark} />} />

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
  header: { padding: 28, paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  geriBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: C.border,
  },
  logoBox: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  baslik: { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5 },
  alt: { fontSize: 15, color: C.textSoft, marginTop: 6 },
  form: { paddingHorizontal: 28, paddingBottom: 120 },
  xetaBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 16 },
  xetaMetn: { color: C.error, fontSize: 14, fontWeight: '500', flex: 1 },
  ciftRow: { flexDirection: 'row', gap: 12 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14, color: C.textSoft },
  linkVurgu: { color: C.primary, fontWeight: '700' },
});
