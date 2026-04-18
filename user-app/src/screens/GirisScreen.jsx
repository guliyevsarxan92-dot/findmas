import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/Input';
import Button from '../components/Button';
import { giris, googleIleGiris } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import C from '../utils/colors';

export default function GirisScreen({ navigation }) {
  const { setIsLoggedIn } = useAuth();
  const [telefon, setTelefon] = useState('');
  const [sifre, setSifre] = useState('');
  const [xeta, setXeta] = useState('');
  const [yuklenir, setYuklenir] = useState(false);
  const [googleYuklenir, setGoogleYuklenir] = useState(false);

  function telefonDeyis(v) {
    const temiz = v.replace(/[^0-9]/g, '');
    if (temiz.length <= 9) setTelefon(temiz);
  }

  async function daxilOl() {
    if (!telefon || !sifre) { setXeta('Bütün sahələri doldurun'); return; }
    if (telefon.length < 9) { setXeta('Nömrə 9 rəqəm olmalıdır'); return; }
    setXeta('');
    setYuklenir(true);
    try {
      await giris('+994' + telefon, sifre);
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
          <Image source={require('../../assets/findmas-logo.png')} style={s.logo} resizeMode="contain" />
        </View>

        {/* Form area */}
        <View style={s.form}>
          {xeta ? (
            <View style={s.xetaBox}>
              <Ionicons name="alert-circle" size={18} color={C.error} />
              <Text style={s.xetaMetn}>{xeta}</Text>
            </View>
          ) : null}

          <Text style={s.label}>Telefon nömrəsi</Text>
          <View style={s.phoneRow}>
            <View style={s.prefixBox}>
              <Text style={s.prefixText}>+994</Text>
            </View>
            <View style={s.phoneInputBox}>
              <TextInput
                style={s.textInput}
                value={telefon}
                onChangeText={telefonDeyis}
                placeholder="XX XXX XX XX"
                placeholderTextColor={C.textMuted}
                keyboardType="phone-pad"
                maxLength={9}
              />
            </View>
          </View>

          <Input
            label="Şifrə"
            value={sifre}
            onChangeText={setSifre}
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

          <View style={s.ayirici}>
            <View style={s.xett} />
            <Text style={s.ayiriciMetn}>və ya</Text>
            <View style={s.xett} />
          </View>

          <TouchableOpacity
            style={s.googleBtn}
            onPress={async () => {
              setXeta('');
              setGoogleYuklenir(true);
              try {
                await googleIleGiris();
                setIsLoggedIn(true);
              } catch (err) {
                if (err?.code !== 'SIGN_IN_CANCELLED') {
                  setXeta(err.xeta || 'Google ilə giriş alınmadı');
                }
              } finally {
                setGoogleYuklenir(false);
              }
            }}
            disabled={googleYuklenir}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={s.googleMetn}>{googleYuklenir ? 'Gözləyin...' : 'Google ilə daxil ol'}</Text>
          </TouchableOpacity>

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
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  logo: { width: 180, height: 180 },
  form: {
    flex: 1, backgroundColor: C.white, paddingHorizontal: 28, paddingTop: 8,
  },
  xetaBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 16 },
  xetaMetn: { color: C.error, fontSize: 14, fontWeight: '500', flex: 1 },
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
  ayirici: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  xett: { flex: 1, height: 1, backgroundColor: C.border },
  ayiriciMetn: { marginHorizontal: 14, fontSize: 13, color: C.textMuted, fontWeight: '500' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 52, borderRadius: 14, backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.border,
  },
  googleMetn: { fontSize: 15, fontWeight: '600', color: C.dark },
  linkWrap: { marginTop: 20, alignItems: 'center', paddingBottom: 30 },
  link: { fontSize: 14, color: C.textSoft },
  linkVurgu: { color: C.primary, fontWeight: '700' },
});
