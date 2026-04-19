import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Input from '../components/Input';
import Button from '../components/Button';
import { qeydiyyat } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import C from '../utils/colors';

function KatIkon({ ikon, lib, color, size = 20 }) {
  if (lib === 'mci') return <MaterialCommunityIcons name={ikon} size={size} color={color} />;
  return <Ionicons name={ikon} size={size} color={color} />;
}

export default function QeydiyyatScreen({ navigation }) {
  const { setIsLoggedIn } = useAuth();
  const [addim, setAddim] = useState(1);
  const [form, setForm] = useState({ ad: '', soyad: '', telefon: '', email: '', sifre: '', kateqoriyalar: [] });
  const [xidmetler, setXidmetler] = useState([]);
  const [sertlerQebul, setSertlerQebul] = useState(false);
  const [sifreGoster, setSifreGoster] = useState(false);
  const [xeta, setXeta] = useState('');
  const [yuklenir, setYuklenir] = useState(false);

  useEffect(() => {
    api.get('/xidmetler').then(({ data }) => setXidmetler(data.xidmetler || data || [])).catch(() => {});
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function telefonDeyis(v) {
    const temiz = v.replace(/[^0-9]/g, '');
    if (temiz.length <= 9) set('telefon', temiz);
  }

  function katToggle(key) {
    setForm(f => {
      const arr = f.kateqoriyalar || [];
      if (arr.includes(key)) return { ...f, kateqoriyalar: arr.filter(k => k !== key) };
      if (arr.length >= 2) { Alert.alert('', 'Ən çox 2 xidmət seçə bilərsiniz'); return f; }
      return { ...f, kateqoriyalar: [...arr, key] };
    });
  }

  function novbeti() {
    if (!form.ad || !form.soyad || !form.telefon || !form.email || !form.sifre) {
      setXeta('Bütün sahələri doldurun'); return;
    }
    if (form.telefon.length < 9) { setXeta('Nömrə 9 rəqəm olmalıdır'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setXeta('Düzgün email daxil edin'); return; }
    if (form.sifre.length < 6) { setXeta('Şifrə ən az 6 simvol'); return; }
    setXeta('');
    setAddim(2);
  }

  async function qeydiyyatEt() {
    if (form.kateqoriyalar.length === 0) { setXeta('Ən azı 1 xidmət seçin'); return; }
    if (!sertlerQebul) { setXeta('Xidmət şərtlərini qəbul etməlisiniz'); return; }
    setXeta('');
    setYuklenir(true);
    try {
      const data = await qeydiyyat({ ...form, telefon: '+994' + form.telefon });
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
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

          <Text style={s.baslik}>{addim === 1 ? 'Şəxsi məlumatlar' : 'Xidmətləriniz'}</Text>
          <Text style={s.alt}>
            {addim === 1 ? 'Hesab məlumatlarınızı daxil edin' : 'Ən çox 2 xidmət seçə bilərsiniz'}
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

              <Input
                label="E-mail"
                value={form.email}
                onChangeText={v => set('email', v)}
                placeholder="example@mail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Ionicons name="mail-outline" size={20} color={C.textMuted} />}
              />

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
              <Button
                title="Növbəti"
                onPress={novbeti}
                style={{ marginTop: 8 }}
                icon={<Ionicons name="arrow-forward" size={20} color={C.white} />}
              />
            </>
          ) : (
            <>
              <Text style={s.secimSay}>{form.kateqoriyalar.length}/2 seçildi</Text>
              <View style={s.katGrid}>
                {xidmetler.map(k => {
                  const secildi = form.kateqoriyalar.includes(k.key);
                  return (
                    <TouchableOpacity
                      key={k.key}
                      style={[s.katKart, secildi && s.katAktiv]}
                      onPress={() => katToggle(k.key)}
                      activeOpacity={0.75}
                    >
                      <View style={[
                        s.katIkonBox,
                        { backgroundColor: (k.rang || '#6366F1') + (secildi ? '25' : '15') },
                      ]}>
                        <KatIkon ikon={k.ikon || 'construct-outline'} lib={k.ikon_lib === 'MaterialCommunityIcons' ? 'mci' : 'ion'} color={k.rang || '#6366F1'} size={20} />
                      </View>
                      <Text style={[
                        s.katAd,
                        secildi && { color: C.dark, fontWeight: '700' },
                      ]}>
                        {k.ad}
                      </Text>
                      {secildi && (
                        <Ionicons name="checkmark-circle" size={18} color={k.rang || C.primary} style={s.katSecildi} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={s.sertlerRow} onPress={() => setSertlerQebul(v => !v)} activeOpacity={0.7}>
                <View style={[s.checkbox, sertlerQebul && s.checkboxAktiv]}>
                  {sertlerQebul && <Ionicons name="checkmark" size={14} color={C.white} />}
                </View>
                <Text style={s.sertlerMetn}>
                  <Text style={s.sertlerLink}>Xidmət şərtləri</Text> və{' '}
                  <Text style={s.sertlerLink}>Məxfilik siyasəti</Text>ni qəbul edirəm
                </Text>
              </TouchableOpacity>

              <Button
                title="Qeydiyyatı tamamla"
                onPress={qeydiyyatEt}
                loading={yuklenir}
                style={{ marginTop: 8 }}
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
    padding: 28, paddingTop: 60, paddingBottom: 32, backgroundColor: C.bg,
  },
  geriBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: C.softBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    borderWidth: 1, borderColor: C.border,
  },
  addimRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  addimDaire: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  addimAktiv: { backgroundColor: C.primary },
  addimInaktiv: { backgroundColor: C.softBg, borderWidth: 1.5, borderColor: C.border },
  addimMetn: { color: C.white, fontWeight: '700', fontSize: 14 },
  addimXett: { flex: 1, height: 2, backgroundColor: C.border, marginHorizontal: 10 },
  baslik: { fontSize: 28, fontWeight: '800', color: C.dark, letterSpacing: -0.5 },
  alt: { fontSize: 14, color: C.textSoft, marginTop: 6 },

  kart: {
    flex: 1, backgroundColor: C.white,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 28, paddingTop: 32,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 }, elevation: 8,
  },
  xetaBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#FECACA',
  },
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
    flex: 1, height: 52, borderRadius: 14, backgroundColor: C.softBg,
    borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 16, justifyContent: 'center',
  },
  textInput: { fontSize: 15, fontWeight: '500', color: C.dark },
  sifreRow: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 14, backgroundColor: C.softBg,
    borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 16, marginBottom: 16,
  },
  sifreInput: { flex: 1, fontSize: 15, fontWeight: '500', color: C.dark },

  secimSay: { fontSize: 13, fontWeight: '600', color: C.primary, marginBottom: 10, textAlign: 'right' },
  katGrid: { gap: 10 },
  katKart: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.softBg, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: C.border,
  },
  katAktiv: { borderColor: C.primary, backgroundColor: C.primaryLightBg },
  katIkonBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  katAd: { fontSize: 15, fontWeight: '500', color: C.textSoft, flex: 1 },
  katSecildi: { marginLeft: 'auto' },

  sertlerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 4 },
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
