import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  TextInput, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { giris, googleIleGiris } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import C from '../utils/colors';

export default function GirisScreen({ navigation }) {
  const { setIsLoggedIn } = useAuth();
  const [loginNov, setLoginNov] = useState('telefon');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreGoster, setSifreGoster] = useState(false);
  const [xeta, setXeta] = useState('');
  const [yuklenir, setYuklenir] = useState(false);
  const [googleYuklenir, setGoogleYuklenir] = useState(false);

  function telefonDeyis(v) {
    const temiz = v.replace(/[^0-9]/g, '');
    if (temiz.length <= 9) setTelefon(temiz);
  }

  async function daxilOl() {
    const girisDeyer = loginNov === 'telefon' ? telefon.trim() : email.trim();
    if (!girisDeyer || !sifre.trim()) {
      setXeta('Bütün sahələri doldurun');
      return;
    }
    if (loginNov === 'telefon' && telefon.length < 9) {
      setXeta('Nömrə 9 rəqəm olmalıdır');
      return;
    }
    setXeta('');
    setYuklenir(true);
    try {
      const payload = loginNov === 'telefon'
        ? { telefon: '+994' + telefon, sifre }
        : { email: girisDeyer, sifre };
      const usta = await giris(null, null, payload);
      if (!usta.tesdiqlendi) {
        Alert.alert(
          'Hesab gözləyir',
          'Hesabınız hələ admin tərəfindən təsdiqlənməyib. Onlayn ola bilməzsiniz.',
          [{ text: 'Anladım', onPress: () => setIsLoggedIn(true) }]
        );
      } else {
        setIsLoggedIn(true);
      }
    } catch (err) {
      setXeta(err.xeta || 'Xəta baş verdi');
    } finally {
      setYuklenir(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ---- HERO ---- */}
        <View style={s.hero}>
          <Image source={require('../../assets/findmas-logo.png')} style={s.logo} resizeMode="contain" />
          <Text style={s.subtitle}>Usta panelinə daxil ol</Text>
        </View>

        {/* ---- FORM CARD ---- */}
        <View style={s.card}>

          {xeta ? (
            <View style={s.xetaBox}>
              <Ionicons name="alert-circle" size={18} color={C.error} />
              <Text style={s.xetaMetn}>{xeta}</Text>
            </View>
          ) : null}

          {/* Login method toggle */}
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleBtn, loginNov === 'telefon' && s.toggleBtnActive]}
              onPress={() => setLoginNov('telefon')}
              activeOpacity={0.8}
            >
              <Ionicons name="call-outline" size={14} color={loginNov === 'telefon' ? C.white : C.textSoft} />
              <Text style={[s.toggleText, loginNov === 'telefon' && s.toggleTextActive]}>Telefon</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, loginNov === 'email' && s.toggleBtnActive]}
              onPress={() => setLoginNov('email')}
              activeOpacity={0.8}
            >
              <Ionicons name="mail-outline" size={14} color={loginNov === 'email' ? C.white : C.textSoft} />
              <Text style={[s.toggleText, loginNov === 'email' && s.toggleTextActive]}>E-mail</Text>
            </TouchableOpacity>
          </View>

          {/* Phone / Email field */}
          {loginNov === 'telefon' ? (
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
                  returnKeyType="next"
                />
              </View>
            </View>
          ) : (
            <View style={[s.inputBox, { marginBottom: 12 }]}>
              <Ionicons name="mail-outline" size={18} color={C.textMuted} style={s.inputIcon} />
              <TextInput
                style={s.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail ünvanı"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
          )}

          {/* Password field */}
          <View style={s.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={s.inputIcon} />
            <TextInput
              style={[s.textInput, { flex: 1 }]}
              value={sifre}
              onChangeText={setSifre}
              placeholder="Şifrə"
              placeholderTextColor={C.textMuted}
              secureTextEntry={!sifreGoster}
              returnKeyType="done"
              onSubmitEditing={daxilOl}
            />
            <TouchableOpacity onPress={() => setSifreGoster(v => !v)} activeOpacity={0.7}>
              <Ionicons name={sifreGoster ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <Button title="Daxil ol" onPress={daxilOl} loading={yuklenir} style={s.submitBtn} />

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
                const result = await googleIleGiris();
                if (!result.usta.tesdiqlendi) {
                  Alert.alert(
                    'Hesab gözləyir',
                    'Hesabınız hələ admin tərəfindən təsdiqlənməyib.',
                    [{ text: 'Anladım', onPress: () => setIsLoggedIn(true) }]
                  );
                } else {
                  setIsLoggedIn(true);
                }
              } catch (err) {
                if (err?.kateqoriya_lazim) {
                  navigation.navigate('Qeydiyyat', { google: true });
                } else if (err?.code !== 'SIGN_IN_CANCELLED') {
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

          <TouchableOpacity
            style={s.linkWrap}
            onPress={() => navigation.navigate('Qeydiyyat')}
            activeOpacity={0.7}
          >
            <Text style={s.linkText}>
              Hesabınız yoxdur?{' '}
              <Text style={s.linkBold}>Qeydiyyat</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  scroll: { flexGrow: 1, backgroundColor: C.white },

  hero: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: C.white,
  },
  logo: { width: 180, height: 180 },
  subtitle: {
    fontSize: 15,
    color: C.textSoft,
    marginTop: 4,
    fontWeight: '500',
  },

  card: {
    flex: 1,
    backgroundColor: C.white,
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 40,
  },

  xetaBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    marginBottom: 18, borderWidth: 1, borderColor: '#FECACA',
  },
  xetaMetn: { flex: 1, color: C.error, fontSize: 14, fontWeight: '500' },

  toggleRow: {
    flexDirection: 'row', gap: 8,
    backgroundColor: C.softBg, borderRadius: 14, padding: 4, marginBottom: 18,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 11,
  },
  toggleBtnActive: { backgroundColor: C.primary },
  toggleText: { fontSize: 14, fontWeight: '600', color: C.textSoft },
  toggleTextActive: { color: C.white },

  phoneRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  prefixBox: {
    height: 54, borderRadius: 14, backgroundColor: C.primary + '10',
    borderWidth: 1.5, borderColor: C.primary + '30',
    paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center',
  },
  prefixText: { fontSize: 15, fontWeight: '700', color: C.primary },
  phoneInputBox: {
    flex: 1, height: 54, borderRadius: 14, backgroundColor: C.softBg,
    borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 16, justifyContent: 'center',
  },

  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, borderRadius: 14, backgroundColor: C.softBg,
    borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 16, marginBottom: 24,
  },
  inputIcon: { marginRight: 10 },
  textInput: { fontSize: 15, fontWeight: '500', color: C.dark, flex: 1 },

  submitBtn: { height: 56, borderRadius: 14 },
  ayirici: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  xett: { flex: 1, height: 1, backgroundColor: C.border },
  ayiriciMetn: { marginHorizontal: 14, fontSize: 13, color: C.textMuted, fontWeight: '500' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 52, borderRadius: 14, backgroundColor: C.white,
    borderWidth: 1.5, borderColor: C.border,
  },
  googleMetn: { fontSize: 15, fontWeight: '600', color: C.dark },
  linkWrap: { marginTop: 22, alignItems: 'center', paddingBottom: 30 },
  linkText: { fontSize: 14, color: C.textSoft },
  linkBold: { color: C.primary, fontWeight: '700' },
});
