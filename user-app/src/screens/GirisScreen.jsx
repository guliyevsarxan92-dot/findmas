import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/Input';
import Button from '../components/Button';
import { giris } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import C from '../utils/colors';

export default function GirisScreen({ navigation }) {
  const { setIsLoggedIn } = useAuth();
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
      setIsLoggedIn(true);
    } catch (err) {
      setXeta(err.xeta || 'Xəta baş verdi');
    } finally {
      setYuklenir(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Logo / Header */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <Ionicons name="construct" size={36} color={C.white} />
          </View>
          <Text style={s.baslik}>UstaX</Text>
          <Text style={s.alt}>Hesabınıza daxil olun</Text>
        </View>

        {/* Form area */}
        <View style={s.form}>
          {xeta ? (
            <View style={s.xetaBox}>
              <Ionicons name="alert-circle" size={18} color={C.error} />
              <Text style={s.xetaMetn}>{xeta}</Text>
            </View>
          ) : null}

          <Input
            label="Telefon nömrəsi"
            value={form.telefon}
            onChangeText={v => set('telefon', v)}
            placeholder="+994 XX XXX XX XX"
            keyboardType="phone-pad"
            icon={<Ionicons name="call-outline" size={20} color={C.dark} />}
          />
          <Input
            label="Şifrə"
            value={form.sifre}
            onChangeText={v => set('sifre', v)}
            placeholder="••••••••"
            secureTextEntry
            icon={<Ionicons name="lock-closed-outline" size={20} color={C.dark} />}
          />

          <Button
            title="Daxil ol"
            onPress={daxilOl}
            loading={yuklenir}
            style={{ marginTop: 8 }}
            icon={<Ionicons name="arrow-forward" size={20} color={C.white} />}
          />

          <TouchableOpacity style={s.linkWrap} onPress={() => navigation.navigate('Qeydiyyat')}>
            <Text style={s.link}>Hesabınız yoxdur? <Text style={s.linkVurgu}>Qeydiyyat</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, backgroundColor: C.white },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
  logoBox: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  baslik: { fontSize: 32, fontWeight: '800', color: C.dark, letterSpacing: -0.5 },
  alt: { fontSize: 15, color: C.textSoft, marginTop: 6 },
  form: {
    flex: 1, backgroundColor: C.white, paddingHorizontal: 28, paddingTop: 8,
  },
  xetaBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 16 },
  xetaMetn: { color: C.error, fontSize: 14, fontWeight: '500', flex: 1 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14, color: C.textSoft },
  linkVurgu: { color: C.primary, fontWeight: '700' },
});
