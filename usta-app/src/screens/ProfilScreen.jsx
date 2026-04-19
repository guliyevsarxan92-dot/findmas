import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image,
  Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cixis } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import C from '../utils/colors';

const STATIC_MENU = [
  { ikon: 'wallet-outline', ad: 'Balansı artır', rang: '#10B981', nav: 'BalansArtir' },
  { ikon: 'document-text-outline', ad: 'Sənədlərimi yenilə', rang: C.primary, nav: 'Senedler' },
  { ikon: 'notifications-outline', ad: 'Bildiriş parametrləri', rang: '#6366F1', nav: 'Bildiris' },
  { ikon: 'shield-checkmark-outline', ad: 'Məxfilik', rang: '#10B981', nav: 'Mexfilik' },
  { ikon: 'help-circle-outline', ad: 'Yardım & Dəstək', rang: '#F59E0B', nav: 'Yardim' },
];

export default function ProfilScreen({ navigation }) {
  const { setIsLoggedIn } = useAuth();
  const { isDark, toggle, C: TC } = useTheme();
  const [usta, setUsta] = useState(null);
  const [fotoYuklenir, setFotoYuklenir] = useState(false);
  const [redakteAcildi, setRedakteAcildi] = useState(false);
  const [redakteForm, setRedakteForm] = useState({ ad: '', soyad: '', email: '', kateqoriyalar: [], aktiv_kateqoriyalar: [] });
  const [redakteYuklenir, setRedakteYuklenir] = useState(false);
  const [xidmetler, setXidmetler] = useState([]);

  async function ustaNuYukle() {
    try {
      const { data } = await api.get('/usta/profil');
      setUsta(data);
      setRedakteForm({
        ad: data.ad || '', soyad: data.soyad || '', email: data.email || '',
        kateqoriyalar: data.kateqoriyalar || (data.kateqoriya ? [data.kateqoriya] : []),
        aktiv_kateqoriyalar: data.aktiv_kateqoriyalar || (data.kateqoriya ? [data.kateqoriya] : []),
      });
      await AsyncStorage.setItem('usta', JSON.stringify(data));
    } catch {
      const raw = await AsyncStorage.getItem('usta');
      if (raw) {
        const u = JSON.parse(raw);
        setUsta(u);
        setRedakteForm({
          ad: u.ad || '', soyad: u.soyad || '', email: u.email || '',
          kateqoriyalar: u.kateqoriyalar || (u.kateqoriya ? [u.kateqoriya] : []),
          aktiv_kateqoriyalar: u.aktiv_kateqoriyalar || (u.kateqoriya ? [u.kateqoriya] : []),
        });
      }
    }
  }

  useFocusEffect(useCallback(() => {
    ustaNuYukle();
    api.get('/xidmetler').then(({ data }) => setXidmetler(data || [])).catch(() => {});
  }, []));

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
      await api.put('/usta/profil-foto', { foto: base64Uri });
      const yeniUsta = { ...usta, foto: base64Uri };
      setUsta(yeniUsta);
      await AsyncStorage.setItem('usta', JSON.stringify(yeniUsta));
    } catch {
      Alert.alert('Xəta', 'Foto yüklənmədi');
    } finally {
      setFotoYuklenir(false);
    }
  }

  function katToggle(key) {
    setRedakteForm(f => {
      const arr = f.kateqoriyalar || [];
      if (arr.includes(key)) {
        const yeni = arr.filter(k => k !== key);
        return { ...f, kateqoriyalar: yeni, aktiv_kateqoriyalar: (f.aktiv_kateqoriyalar || []).filter(k => k !== key) };
      }
      if (arr.length >= 2) { Alert.alert('', 'Ən çox 2 xidmət seçə bilərsiniz'); return f; }
      return { ...f, kateqoriyalar: [...arr, key], aktiv_kateqoriyalar: [...(f.aktiv_kateqoriyalar || []), key] };
    });
  }

  function aktivToggle(key) {
    setRedakteForm(f => {
      const arr = f.aktiv_kateqoriyalar || [];
      if (arr.includes(key)) {
        return { ...f, aktiv_kateqoriyalar: arr.filter(k => k !== key) };
      }
      return { ...f, aktiv_kateqoriyalar: [...arr, key] };
    });
  }

  async function redakteYadda() {
    if (!redakteForm.ad.trim() || !redakteForm.soyad.trim()) {
      Alert.alert('', 'Ad və soyad boş ola bilməz');
      return;
    }
    if (!redakteForm.kateqoriyalar || redakteForm.kateqoriyalar.length === 0) {
      Alert.alert('', 'Ən azı 1 xidmət seçin');
      return;
    }
    setRedakteYuklenir(true);
    try {
      const { data } = await api.put('/usta/profil', redakteForm);
      setUsta(data);
      await AsyncStorage.setItem('usta', JSON.stringify(data));
      setRedakteAcildi(false);
      Alert.alert('', 'Məlumatlar yeniləndi');
    } catch (err) {
      Alert.alert('Xəta', err?.xeta || 'Yenilənmədi');
    } finally {
      setRedakteYuklenir(false);
    }
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

  if (!usta) return null;

  const basSehri = ((usta.ad?.[0] || '') + (usta.soyad?.[0] || '')).toUpperCase();

  return (
    <ScrollView
      style={[s.wrap, { backgroundColor: C.softBg }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={[s.header, { backgroundColor: C.white, borderBottomColor: C.border }]}>
        <View style={s.headerOverlay} />

        <TouchableOpacity style={s.avatarWrap} onPress={fotoSec} activeOpacity={0.85}>
          <View style={s.avatar}>
            {usta.foto ? (
              <Image source={{ uri: usta.foto }} style={s.avatarImg} />
            ) : (
              <Text style={s.avatarMetn}>{basSehri}</Text>
            )}
          </View>
          <View style={s.avatarKamera}>
            <Ionicons name={fotoYuklenir ? 'hourglass-outline' : 'camera-outline'} size={13} color={C.white} />
          </View>
          <View style={[s.avatarBadge, usta.tesdiqlendi ? s.badgeGreen : s.badgeYellow]}>
            <Ionicons name={usta.tesdiqlendi ? 'checkmark' : 'time-outline'} size={11} color={C.white} />
          </View>
        </TouchableOpacity>

        <Text style={[s.ad, { color: C.dark }]}>{usta.ad} {usta.soyad}</Text>
        <View style={s.katRow}>
          <Ionicons name="construct-outline" size={14} color={C.textMuted} />
          <Text style={s.kateqoriya}>
            {(usta.kateqoriyalar || [usta.kateqoriya]).filter(Boolean).map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(', ')}
          </Text>
        </View>

        <View style={[s.tesdiqBadge, usta.tesdiqlendi ? s.tesdiqGreen : s.tesdiqYellow]}>
          <Ionicons
            name={usta.tesdiqlendi ? 'checkmark-circle-outline' : 'time-outline'}
            size={13}
            color={usta.tesdiqlendi ? C.primary : C.warning}
          />
          <Text style={[s.tesdiqMetn, usta.tesdiqlendi ? { color: C.primaryDark } : { color: '#92400E' }]}>
            {usta.tesdiqlendi ? 'Hesab təsdiqlənib' : 'Hesab gözləyir'}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={[s.statsCard, { backgroundColor: C.white }]}>
        <View style={s.statItem}>
          <Text style={s.statRəqəm}>{usta.tamamlanan_sifaris || 0}</Text>
          <Text style={s.statAd}>Sifariş</Text>
        </View>
        <View style={s.statAyirici} />
        <View style={s.statItem}>
          <Text style={s.statRəqəm}>{usta.orta_reytinq || '—'}</Text>
          <Text style={s.statAd}>Reytinq</Text>
        </View>
        <View style={s.statAyirici} />
        <View style={s.statItem}>
          <Text style={[s.statRəqəm, { color: C.primary }]}>{usta.xal || 0}</Text>
          <Text style={s.statAd}>Xal</Text>
        </View>
      </View>

      {/* Balance card */}
      <TouchableOpacity style={s.balansKart} onPress={() => navigation.navigate('BalansArtir')} activeOpacity={0.85}>
        <View style={s.balansLeft}>
          <View style={s.balansIkon}>
            <Ionicons name="wallet-outline" size={22} color={C.white} />
          </View>
          <View>
            <Text style={s.balansAlt}>Cari balans</Text>
            <Text style={s.balansRəqəm}>{Number(usta.balans ?? 0).toFixed(2)} ₼</Text>
          </View>
        </View>
        <View style={s.balansArtirBtn}>
          <Ionicons name="add" size={18} color={C.primary} />
          <Text style={s.balansArtirMetn}>Artır</Text>
        </View>
      </TouchableOpacity>

      {/* Phone */}
      <View style={[s.telefonKart, { backgroundColor: C.white }]}>
        <View style={s.telefonIkon}>
          <Ionicons name="call-outline" size={18} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.telefonAlt}>Telefon nömrəsi</Text>
          <Text style={s.telefonMetn}>{usta.telefon}</Text>
        </View>
        <View style={s.verifiedPill}>
          <Ionicons name="shield-checkmark-outline" size={13} color={C.primary} />
          <Text style={s.verifiedText}>Təsdiqlənib</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={[s.menyuKart, { backgroundColor: C.white }]}>
        {[
          { ikon: 'person-outline', ad: 'Məlumatlarımı redaktə et', rang: C.primary, onPress: () => setRedakteAcildi(true) },
          ...STATIC_MENU.map(m => ({ ...m, onPress: () => navigation.navigate(m.nav) })),
        ].map((item, i, arr) => (
          <View key={item.ad}>
            <TouchableOpacity style={s.menItem} activeOpacity={0.7} onPress={item.onPress}>
              <View style={[s.menIkonBox, { backgroundColor: item.rang + '15' }]}>
                <Ionicons name={item.ikon} size={20} color={item.rang} />
              </View>
              <Text style={s.menAd}>{item.ad}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </TouchableOpacity>
            {i < arr.length - 1 && <View style={s.xett} />}
          </View>
        ))}
      </View>

      {/* Dark mode toggle */}
      <TouchableOpacity
        style={[s.menyuKart, { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, marginBottom: 0 }]}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <View style={[s.menIkonBox, { backgroundColor: isDark ? '#312e81' + '25' : '#6366F1' + '15' }]}>
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={isDark ? '#FDE68A' : '#6366F1'} />
        </View>
        <Text style={[s.menAd, { color: C.dark }]}>{isDark ? 'Gündüz rejimi' : 'Gecə rejimi'}</Text>
        <View style={[
          { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
          isDark ? { backgroundColor: C.primary } : { backgroundColor: C.border },
        ]}>
          <View style={[
            { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
            isDark ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
          ]} />
        </View>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={s.cixisBtn} onPress={cixisEt} activeOpacity={0.8}>
        <View style={s.cixisIkon}>
          <Ionicons name="log-out-outline" size={20} color={C.error} />
        </View>
        <Text style={s.cixisMetn}>Hesabdan çıx</Text>
        <Ionicons name="chevron-forward" size={18} color={C.error + '80'} />
      </TouchableOpacity>

      <Text style={s.versiya}>Findmas — Usta Paneli v1.0.0</Text>

      {/* REDAKTƏ MODAL */}
      <Modal visible={redakteAcildi} animationType="slide" transparent onRequestClose={() => setRedakteAcildi(false)}>
        <KeyboardAvoidingView behavior="padding" style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Məlumatları redaktə et</Text>
              <TouchableOpacity onPress={() => setRedakteAcildi(false)}>
                <Ionicons name="close" size={24} color={C.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
              {/* Xidmətlər */}
              <Text style={s.modalLabel}>Xidmətlər (ən çox 2)</Text>
              {xidmetler.map(x => {
                const secildi = (redakteForm.kateqoriyalar || []).includes(x.key);
                const aktiv = (redakteForm.aktiv_kateqoriyalar || []).includes(x.key);
                return (
                  <View key={x.key} style={[s.xidmetRow, secildi && s.xidmetRowSecildi]}>
                    <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => katToggle(x.key)} activeOpacity={0.7}>
                      <View style={[s.xidmetCheck, secildi && { backgroundColor: x.rang || C.primary, borderColor: x.rang || C.primary }]}>
                        {secildi && <Ionicons name="checkmark" size={13} color={C.white} />}
                      </View>
                      <Text style={[s.xidmetAd, secildi && { color: C.dark, fontWeight: '600' }]}>{x.ad}</Text>
                    </TouchableOpacity>
                    {secildi && (
                      <TouchableOpacity onPress={() => aktivToggle(x.key)} activeOpacity={0.7} style={[s.aktivBtn, aktiv && s.aktivBtnOn]}>
                        <Text style={[s.aktivBtnText, aktiv && s.aktivBtnTextOn]}>{aktiv ? 'Aktiv' : 'Deaktiv'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              <View style={{ height: 1, backgroundColor: C.border, marginVertical: 14 }} />

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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.softBg },

  header: {
    backgroundColor: C.white,
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 120,
    backgroundColor: C.primaryLightBg,
    borderBottomWidth: 1,
    borderBottomColor: C.primary + '20',
  },

  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: C.white,
    shadowColor: C.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  avatarMetn: { fontSize: 30, fontWeight: '800', color: C.white },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarKamera: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.white,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: C.white,
  },
  badgeGreen: { backgroundColor: '#10B981' },
  badgeYellow: { backgroundColor: C.warning },

  ad: { fontSize: 22, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  katRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    marginBottom: 12,
  },
  kateqoriya: { fontSize: 13, color: C.textSoft },

  tesdiqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  tesdiqGreen: {
    backgroundColor: C.primaryLightBg,
    borderColor: C.primary + '40',
  },
  tesdiqYellow: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  tesdiqMetn: { fontSize: 13, fontWeight: '600' },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statRəqəm: { fontSize: 20, fontWeight: '800', color: C.dark },
  statAd: { fontSize: 12, color: C.textSoft, marginTop: 3 },
  statAyirici: { width: 1, backgroundColor: C.border, marginVertical: 4 },

  balansKart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.dark,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  balansLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  balansIkon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balansAlt: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  balansRəqəm: { fontSize: 22, fontWeight: '800', color: C.white },
  balansArtirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  balansArtirMetn: { fontSize: 14, fontWeight: '700', color: C.primary },

  telefonKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  telefonIkon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: C.primaryLightBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telefonAlt: { fontSize: 11, color: C.textMuted, marginBottom: 2 },
  telefonMetn: { fontSize: 15, fontWeight: '700', color: C.dark },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.primaryLightBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: { fontSize: 11, fontWeight: '600', color: C.primary },

  menyuKart: {
    backgroundColor: C.white,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  menItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menIkonBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menAd: { flex: 1, fontSize: 15, fontWeight: '500', color: C.dark },
  xett: { height: 1, backgroundColor: C.border, marginLeft: 70 },

  cixisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.white,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  cixisIkon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cixisMetn: { flex: 1, fontSize: 15, fontWeight: '600', color: C.error },

  versiya: {
    textAlign: 'center',
    color: C.textMuted,
    fontSize: 12,
    marginTop: 18,
    marginBottom: 10,
  },

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
    backgroundColor: C.softBg,
  },
  modalBtn: {
    backgroundColor: C.primary, borderRadius: 14, padding: 14,
    alignItems: 'center', marginTop: 20,
  },
  modalBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },

  xidmetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  xidmetRowSecildi: { backgroundColor: C.primaryLightBg, borderRadius: 10, paddingHorizontal: 10, marginBottom: 2 },
  xidmetCheck: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  xidmetAd: { fontSize: 14, color: C.textSoft, fontWeight: '500' },
  aktivBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    backgroundColor: C.softBg, borderWidth: 1, borderColor: C.border,
  },
  aktivBtnOn: { backgroundColor: C.primary + '15', borderColor: C.primary },
  aktivBtnText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  aktivBtnTextOn: { color: C.primary },
});
