import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image,
  Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cixis } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import C from '../utils/colors';

export default function ProfilScreen() {
  const { setIsLoggedIn } = useAuth();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ sifaris: 0, xerc: 0 });
  const [fotoYuklenir, setFotoYuklenir] = useState(false);

  const [redakteAcildi, setRedakteAcildi] = useState(false);
  const [bildirisAcildi, setBildirisAcildi] = useState(false);
  const [yardimAcildi, setYardimAcildi] = useState(false);
  const [mexfilikAcildi, setMexfilikAcildi] = useState(false);

  const [redakteForm, setRedakteForm] = useState({ ad: '', soyad: '', email: '' });
  const [redakteYuklenir, setRedakteYuklenir] = useState(false);
  const [bildirisler, setBildirisler] = useState({ sifaris: true, mesaj: true, kampaniya: false });

  useEffect(() => {
    AsyncStorage.getItem('user').then(r => {
      if (r) {
        const u = JSON.parse(r);
        setUser(u);
        setRedakteForm({ ad: u.ad || '', soyad: u.soyad || '', email: u.email || '' });
      }
    });
    AsyncStorage.getItem('bildirisler').then(r => r && setBildirisler(JSON.parse(r)));
    api.get('/sifaris/tarixce?sehife=1').then(({ data }) => {
      const list = data.sifarisler || [];
      const tamamlanan = list.filter(s => s.status === 'odendi');
      const xerc = tamamlanan.reduce((sum, s) => sum + parseFloat(s.məbleg || 0), 0);
      setStats({ sifaris: tamamlanan.length, xerc: xerc.toFixed(2) });
    }).catch(() => {});
  }, []);

  async function fotoSec() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İcazə lazımdır', 'Foto seçmək üçün qalereya icazəsi verin.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
    setFotoYuklenir(true);
    try {
      await api.put('/istifadeci/profil-foto', { foto: base64Uri });
      const yeniUser = { ...user, foto: base64Uri };
      setUser(yeniUser);
      await AsyncStorage.setItem('user', JSON.stringify(yeniUser));
    } catch {
      Alert.alert('Xəta', 'Foto yüklənmədi');
    } finally {
      setFotoYuklenir(false);
    }
  }

  async function redakteYadda() {
    if (!redakteForm.ad.trim() || !redakteForm.soyad.trim()) {
      Alert.alert('', 'Ad və soyad boş ola bilməz');
      return;
    }
    setRedakteYuklenir(true);
    try {
      await api.put('/istifadeci/profil', redakteForm);
      const yeniUser = { ...user, ...redakteForm };
      setUser(yeniUser);
      await AsyncStorage.setItem('user', JSON.stringify(yeniUser));
      setRedakteAcildi(false);
      Alert.alert('', 'Məlumatlar yeniləndi');
    } catch (err) {
      Alert.alert('Xəta', err?.xeta || 'Yenilənmədi');
    } finally {
      setRedakteYuklenir(false);
    }
  }

  async function bildirisSecimYadda() {
    await AsyncStorage.setItem('bildirisler', JSON.stringify(bildirisler));
    setBildirisAcildi(false);
    Alert.alert('', 'Yadda saxlanıldı');
  }

  async function cixisEt() {
    Alert.alert('Çıxış', 'Hesabdan çıxmaq istəyirsiniz?', [
      {
        text: 'Bəli', onPress: async () => {
          await cixis();
          setIsLoggedIn(false);
        },
      },
      { text: 'Xeyr' },
    ]);
  }

  function qiymetlendir() {
    Alert.alert('Təşəkkürlər!', 'Store-da qiymətləndirmə tezliklə əlçatan olacaq.');
  }

  if (!user) return null;

  const basSehri = (user.ad?.[0] || '') + (user.soyad?.[0] || '');

  const MENU = [
    { ikon: 'person-outline', ad: 'Məlumatlarımı redaktə et', rang: C.primary, onPress: () => setRedakteAcildi(true) },
    { ikon: 'notifications-outline', ad: 'Bildirişlər', rang: '#6366F1', onPress: () => setBildirisAcildi(true) },
    { ikon: 'shield-checkmark-outline', ad: 'Məxfilik', rang: '#16A34A', onPress: () => setMexfilikAcildi(true) },
    { ikon: 'help-circle-outline', ad: 'Yardım & Dəstək', rang: '#F59E0B', onPress: () => setYardimAcildi(true) },
    { ikon: 'star-outline', ad: 'Tətbiqi qiymətləndir', rang: '#EC4899', onPress: qiymetlendir },
  ];

  return (
    <ScrollView style={s.wrap} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.avatarWrap} onPress={fotoSec} activeOpacity={0.85}>
          <View style={s.avatar}>
            {user.foto ? (
              <Image source={{ uri: user.foto }} style={s.avatarImg} />
            ) : (
              <Text style={s.avatarMetn}>{basSehri.toUpperCase()}</Text>
            )}
          </View>
          <View style={s.avatarKamera}>
            <Ionicons name={fotoYuklenir ? 'hourglass-outline' : 'camera-outline'} size={12} color={C.white} />
          </View>
        </TouchableOpacity>
        <Text style={s.ad}>{user.ad} {user.soyad}</Text>
        <View style={s.telefonRow}>
          <Ionicons name="call-outline" size={14} color={C.textSoft} />
          <Text style={s.telefon}>{user.telefon}</Text>
        </View>

        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statRəqəm}>{stats.sifaris}</Text>
            <Text style={s.statAd}>Sifariş</Text>
          </View>
          <View style={s.statAyirici} />
          <View style={s.statItem}>
            <Text style={s.statRəqəm}>{stats.xerc}₼</Text>
            <Text style={s.statAd}>Xərclər</Text>
          </View>
        </View>
      </View>

      <View style={s.menyuKart}>
        {MENU.map((item, i) => (
          <View key={item.ad}>
            <TouchableOpacity style={s.menItem} activeOpacity={0.7} onPress={item.onPress}>
              <View style={[s.menIkonBox, { backgroundColor: item.rang + '15' }]}>
                <Ionicons name={item.ikon} size={20} color={item.rang} />
              </View>
              <Text style={s.menAd}>{item.ad}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </TouchableOpacity>
            {i < MENU.length - 1 && <View style={s.xett} />}
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.cixisBtn} onPress={cixisEt} activeOpacity={0.8}>
        <View style={s.cixisIkon}>
          <Ionicons name="log-out-outline" size={20} color={C.error} />
        </View>
        <Text style={s.cixisMetn}>Hesabdan çıx</Text>
      </TouchableOpacity>

      <Text style={s.versiya}>UstaX v1.0.0</Text>

      {/* REDAKTƏ MODAL */}
      <Modal visible={redakteAcildi} animationType="slide" transparent onRequestClose={() => setRedakteAcildi(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Məlumatları redaktə et</Text>
              <TouchableOpacity onPress={() => setRedakteAcildi(false)}>
                <Ionicons name="close" size={24} color={C.dark} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalLabel}>Ad</Text>
            <TextInput
              style={s.modalInput}
              value={redakteForm.ad}
              onChangeText={v => setRedakteForm(f => ({ ...f, ad: v }))}
              placeholder="Adınız"
            />
            <Text style={s.modalLabel}>Soyad</Text>
            <TextInput
              style={s.modalInput}
              value={redakteForm.soyad}
              onChangeText={v => setRedakteForm(f => ({ ...f, soyad: v }))}
              placeholder="Soyadınız"
            />
            <Text style={s.modalLabel}>Email</Text>
            <TextInput
              style={s.modalInput}
              value={redakteForm.email}
              onChangeText={v => setRedakteForm(f => ({ ...f, email: v }))}
              placeholder="mail@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[s.modalBtn, redakteYuklenir && { opacity: 0.7 }]}
              onPress={redakteYadda}
              disabled={redakteYuklenir}
            >
              {redakteYuklenir
                ? <ActivityIndicator color={C.white} />
                : <Text style={s.modalBtnText}>Yadda saxla</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* BİLDİRİŞ MODAL */}
      <Modal visible={bildirisAcildi} animationType="slide" transparent onRequestClose={() => setBildirisAcildi(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Bildirişlər</Text>
              <TouchableOpacity onPress={() => setBildirisAcildi(false)}>
                <Ionicons name="close" size={24} color={C.dark} />
              </TouchableOpacity>
            </View>
            {[
              { key: 'sifaris', ad: 'Sifariş yenilikləri' },
              { key: 'mesaj', ad: 'Mesaj bildirişləri' },
              { key: 'kampaniya', ad: 'Kampaniya və xəbərlər' },
            ].map(b => (
              <TouchableOpacity
                key={b.key}
                style={s.switchRow}
                onPress={() => setBildirisler(p => ({ ...p, [b.key]: !p[b.key] }))}
              >
                <Text style={s.switchLabel}>{b.ad}</Text>
                <View style={[s.switch, bildirisler[b.key] && s.switchOn]}>
                  <View style={[s.switchKnob, bildirisler[b.key] && s.switchKnobOn]} />
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.modalBtn} onPress={bildirisSecimYadda}>
              <Text style={s.modalBtnText}>Yadda saxla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MƏXFİLİK MODAL */}
      <Modal visible={mexfilikAcildi} animationType="slide" transparent onRequestClose={() => setMexfilikAcildi(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Məxfilik</Text>
              <TouchableOpacity onPress={() => setMexfilikAcildi(false)}>
                <Ionicons name="close" size={24} color={C.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={s.infoText}>
                Şəxsi məlumatlarınız (ad, soyad, telefon, email) yalnız xidmət göstərilməsi
                məqsədi ilə istifadə olunur. Konum məlumatınız sifariş zamanı yaxın ustaların
                axtarılması üçün istifadə edilir və daimi saxlanılmır.{'\n\n'}
                Məlumatlarınızı üçüncü tərəflərə ötürmürük. Hesabınızı istənilən vaxt silə
                bilərsiniz — dəstək xidməti ilə əlaqə saxlayın.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* YARDIM MODAL */}
      <Modal visible={yardimAcildi} animationType="slide" transparent onRequestClose={() => setYardimAcildi(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Yardım & Dəstək</Text>
              <TouchableOpacity onPress={() => setYardimAcildi(false)}>
                <Ionicons name="close" size={24} color={C.dark} />
              </TouchableOpacity>
            </View>
            <View style={s.yardimItem}>
              <Ionicons name="call-outline" size={22} color={C.primary} />
              <View>
                <Text style={s.yardimLabel}>Dəstək xətti</Text>
                <Text style={s.yardimValue}>+994 50 000 00 00</Text>
              </View>
            </View>
            <View style={s.yardimItem}>
              <Ionicons name="mail-outline" size={22} color={C.primary} />
              <View>
                <Text style={s.yardimLabel}>Email</Text>
                <Text style={s.yardimValue}>destek@findmas.az</Text>
              </View>
            </View>
            <View style={s.yardimItem}>
              <Ionicons name="time-outline" size={22} color={C.primary} />
              <View>
                <Text style={s.yardimLabel}>İş saatları</Text>
                <Text style={s.yardimValue}>Hər gün 09:00 – 22:00</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.white, paddingTop: 60, paddingBottom: 28,
    paddingHorizontal: 24, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: C.primaryLight,
  },
  avatarMetn: { fontSize: 30, fontWeight: '800', color: C.white },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  avatarKamera: {
    position: 'absolute', bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12, backgroundColor: C.dark,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.white,
  },
  ad: { fontSize: 22, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  telefonRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 24 },
  telefon: { fontSize: 14, color: C.textSoft },
  statsRow: {
    flexDirection: 'row', backgroundColor: C.bg,
    borderRadius: 18, paddingVertical: 16, paddingHorizontal: 24, width: '100%',
    borderWidth: 1, borderColor: C.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statRəqəm: { fontSize: 18, fontWeight: '800', color: C.dark },
  statAd: { fontSize: 12, color: C.textSoft, marginTop: 2 },
  statAyirici: { width: 1, backgroundColor: C.border },
  menyuKart: {
    backgroundColor: C.white, margin: 16, borderRadius: 20, overflow: 'hidden',
  },
  menItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menIkonBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menAd: { flex: 1, fontSize: 15, fontWeight: '500', color: C.dark },
  xett: { height: 1, backgroundColor: C.border, marginLeft: 68 },
  cixisBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.white, marginHorizontal: 16, borderRadius: 20, padding: 16,
  },
  cixisIkon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  cixisMetn: { fontSize: 15, fontWeight: '600', color: C.error },
  versiya: { textAlign: 'center', color: C.textMuted, fontSize: 12, marginTop: 20, marginBottom: 32 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 22, paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.dark },
  modalLabel: { fontSize: 13, color: C.textSoft, marginBottom: 6, marginTop: 10 },
  modalInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.dark,
    backgroundColor: C.bg,
  },
  modalBtn: {
    backgroundColor: C.primary, borderRadius: 14, padding: 14,
    alignItems: 'center', marginTop: 20,
  },
  modalBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  switchLabel: { fontSize: 15, color: C.dark },
  switch: {
    width: 44, height: 26, borderRadius: 13, backgroundColor: C.border,
    padding: 2, justifyContent: 'center',
  },
  switchOn: { backgroundColor: C.primary },
  switchKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.white },
  switchKnobOn: { alignSelf: 'flex-end' },
  infoText: { fontSize: 14, color: C.textSoft, lineHeight: 22 },
  yardimItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  yardimLabel: { fontSize: 12, color: C.textMuted },
  yardimValue: { fontSize: 15, color: C.dark, fontWeight: '600', marginTop: 2 },
});
