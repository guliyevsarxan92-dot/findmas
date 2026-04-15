import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Input from '../components/Input';
import Button from '../components/Button';
import { qeydiyyat } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import C from '../utils/colors';

const KATEQORIYALAR = [
  { key: 'santexnik', ikon: 'pipe-wrench', lib: 'mci', ad: 'Santexnik', rang: '#0EA5E9' },
  { key: 'elektrik', ikon: 'flash-outline', lib: 'ion', ad: 'Elektrik', rang: '#6366F1' },
  { key: 'qaynaqci', ikon: 'flame-outline', lib: 'ion', ad: 'Qaynaqçı', rang: '#EF4444' },
  { key: 'duluscu', ikon: 'construct-outline', lib: 'ion', ad: 'Tikinti', rang: '#F59E0B' },
  { key: 'boyaqci', ikon: 'color-palette-outline', lib: 'ion', ad: 'Boyaqçı', rang: '#EC4899' },
  { key: 'ustav', ikon: 'hammer-outline', lib: 'ion', ad: 'Ustav', rang: '#8B5CF6' },
  { key: 'kondisioner', ikon: 'snow-outline', lib: 'ion', ad: 'Kondisioner', rang: '#0EA5E9' },
  { key: 'temizlik', ikon: 'sparkles-outline', lib: 'ion', ad: 'Təmizlik', rang: '#10B981' },
  { key: 'diger', ikon: 'options-outline', lib: 'ion', ad: 'Digər', rang: '#94a3b8' },
];

function KatIkon({ ikon, lib, color, size = 20 }) {
  if (lib === 'mci') return <MaterialCommunityIcons name={ikon} size={size} color={color} />;
  return <Ionicons name={ikon} size={size} color={color} />;
}

export default function QeydiyyatScreen({ navigation }) {
  const { setIsLoggedIn } = useAuth();
  const [addim, setAddim] = useState(1);
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
      const data = await qeydiyyat(form);
      Alert.alert(
        'Qeydiyyat tamamlandı',
        data.mesaj || 'Hesabınız yaradıldı.',
        [{ text: 'Anladım', onPress: () => setIsLoggedIn(true) }]
      );
    } catch (err) {
      setXeta(err.xeta || 'Xəta baş verdi');
    } finally {
      setYuklenir(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ backgroundColor: C.bg }}
        contentContainerStyle={s.wrap}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.geriBtn}
            onPress={() => addim === 1 ? navigation.goBack() : setAddim(1)}
          >
            <Ionicons name="arrow-back" size={22} color={C.dark} />
          </TouchableOpacity>

          {/* Step progress */}
          <View style={s.addimRow}>
            <View style={[s.addimDaire, s.addimAktiv]}>
              {addim > 1
                ? <Ionicons name="checkmark" size={16} color={C.white} />
                : <Text style={s.addimMetn}>1</Text>}
            </View>
            <View style={[s.addimXett, addim >= 2 && { backgroundColor: C.primary }]} />
            <View style={[s.addimDaire, addim >= 2 ? s.addimAktiv : s.addimInaktiv]}>
              <Text style={[s.addimMetn, addim < 2 && { color: C.textMuted }]}>2</Text>
            </View>
          </View>

          <Text style={s.baslik}>{addim === 1 ? 'Şəxsi məlumatlar' : 'İxtisasınız'}</Text>
          <Text style={s.alt}>
            {addim === 1 ? 'Hesab məlumatlarınızı daxil edin' : 'Hansı sahədə işləyirsiniz?'}
          </Text>
        </View>

        {/* Form area */}
        <View style={s.kart}>
          {xeta ? (
            <View style={s.xetaBox}>
              <Ionicons name="alert-circle" size={18} color={C.error} />
              <Text style={s.xetaMetn}>{xeta}</Text>
            </View>
          ) : null}

          {addim === 1 ? (
            <>
              <View style={s.ciftRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Ad"
                    value={form.ad}
                    onChangeText={v => set('ad', v)}
                    placeholder="Adınız"
                    icon={<Ionicons name="person-outline" size={20} color={C.textMuted} />}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Soyad"
                    value={form.soyad}
                    onChangeText={v => set('soyad', v)}
                    placeholder="Soyadınız"
                  />
                </View>
              </View>
              <Input
                label="Telefon"
                value={form.telefon}
                onChangeText={v => set('telefon', v)}
                placeholder="+994 XX XXX XX XX"
                keyboardType="phone-pad"
                icon={<Ionicons name="call-outline" size={20} color={C.textMuted} />}
              />
              <Input
                label="Şifrə"
                value={form.sifre}
                onChangeText={v => set('sifre', v)}
                placeholder="Ən az 6 simvol"
                secureTextEntry
                icon={<Ionicons name="lock-closed-outline" size={20} color={C.textMuted} />}
              />
              <Button
                title="Növbəti"
                onPress={novbeti}
                style={{ marginTop: 8 }}
                icon={<Ionicons name="arrow-forward" size={20} color={C.white} />}
              />
            </>
          ) : (
            <>
              <View style={s.katGrid}>
                {KATEQORIYALAR.map(k => (
                  <TouchableOpacity
                    key={k.key}
                    style={[s.katKart, form.kateqoriya === k.key && s.katAktiv]}
                    onPress={() => set('kateqoriya', k.key)}
                    activeOpacity={0.75}
                  >
                    <View style={[
                      s.katIkonBox,
                      { backgroundColor: k.rang + (form.kateqoriya === k.key ? '25' : '15') },
                    ]}>
                      <KatIkon ikon={k.ikon} lib={k.lib} color={k.rang} size={20} />
                    </View>
                    <Text style={[
                      s.katAd,
                      form.kateqoriya === k.key && { color: C.dark, fontWeight: '700' },
                    ]}>
                      {k.ad}
                    </Text>
                    {form.kateqoriya === k.key && (
                      <Ionicons name="checkmark-circle" size={18} color={k.rang} style={s.katSecildi} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <Button
                title="Qeydiyyatı tamamla"
                onPress={qeydiyyatEt}
                loading={yuklenir}
                style={{ marginTop: 16 }}
                icon={<Ionicons name="checkmark-circle-outline" size={20} color={C.white} />}
              />
            </>
          )}

          <TouchableOpacity style={s.linkWrap} onPress={() => navigation.goBack()}>
            <Text style={s.link}>
              Artıq hesabınız var? <Text style={s.linkVurgu}>Giriş</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, backgroundColor: C.bg },

  header: {
    padding: 28,
    paddingTop: 60,
    paddingBottom: 32,
    backgroundColor: C.bg,
  },
  geriBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.softBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.border,
  },

  addimRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  addimDaire: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addimAktiv: { backgroundColor: C.primary },
  addimInaktiv: { backgroundColor: C.softBg, borderWidth: 1.5, borderColor: C.border },
  addimMetn: { color: C.white, fontWeight: '700', fontSize: 14 },
  addimXett: {
    flex: 1,
    height: 2,
    backgroundColor: C.border,
    marginHorizontal: 10,
  },

  baslik: { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5 },
  alt: { fontSize: 14, color: C.textSoft, marginTop: 6 },

  kart: {
    flex: 1,
    backgroundColor: C.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingTop: 32,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },

  xetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  xetaMetn: { color: C.error, fontSize: 14, fontWeight: '500', flex: 1 },

  ciftRow: { flexDirection: 'row', gap: 12 },

  katGrid: { gap: 10 },
  katKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.softBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  katAktiv: { borderColor: C.primary, backgroundColor: C.primaryLightBg },
  katIkonBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  katAd: { fontSize: 15, fontWeight: '500', color: C.textSoft, flex: 1 },
  katSecildi: { marginLeft: 'auto' },

  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14, color: C.textSoft },
  linkVurgu: { color: C.primary, fontWeight: '700' },
});
