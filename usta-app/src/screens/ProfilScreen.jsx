import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cixis } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import C from '../utils/colors';

const MENU = [
  { ikon: 'wallet-outline', ad: 'Balansı artır', rang: '#10B981', nav: 'BalansArtir' },
  { ikon: 'document-text-outline', ad: 'Sənədlərimi yenilə', rang: C.primary },
  { ikon: 'notifications-outline', ad: 'Bildiriş parametrləri', rang: '#6366F1' },
  { ikon: 'shield-checkmark-outline', ad: 'Məxfilik', rang: '#10B981' },
  { ikon: 'help-circle-outline', ad: 'Yardım & Dəstək', rang: '#F59E0B' },
];

export default function ProfilScreen({ navigation }) {
  const { setIsLoggedIn } = useAuth();
  const [usta, setUsta] = useState(null);
  const [fotoYuklenir, setFotoYuklenir] = useState(false);

  async function ustaNuYukle() {
    try {
      const { data } = await api.get('/usta/profil');
      setUsta(data);
      await AsyncStorage.setItem('usta', JSON.stringify(data));
    } catch {
      const raw = await AsyncStorage.getItem('usta');
      if (raw) setUsta(JSON.parse(raw));
    }
  }

  useFocusEffect(useCallback(() => { ustaNuYukle(); }, []));

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
      style={s.wrap}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={s.header}>
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

        <Text style={s.ad}>{usta.ad} {usta.soyad}</Text>
        <View style={s.katRow}>
          <Ionicons name="construct-outline" size={14} color={C.textMuted} />
          <Text style={s.kateqoriya}>
            {usta.kateqoriya?.charAt(0).toUpperCase() + usta.kateqoriya?.slice(1)}
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
      <View style={s.statsCard}>
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
      <View style={s.telefonKart}>
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
      <View style={s.menyuKart}>
        {MENU.map((item, i) => (
          <View key={item.ad}>
            <TouchableOpacity style={s.menItem} activeOpacity={0.7}
              onPress={() => item.nav && navigation.navigate(item.nav)}>
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

      {/* Logout */}
      <TouchableOpacity style={s.cixisBtn} onPress={cixisEt} activeOpacity={0.8}>
        <View style={s.cixisIkon}>
          <Ionicons name="log-out-outline" size={20} color={C.error} />
        </View>
        <Text style={s.cixisMetn}>Hesabdan çıx</Text>
        <Ionicons name="chevron-forward" size={18} color={C.error + '80'} />
      </TouchableOpacity>

      <Text style={s.versiya}>UstaX — Usta Paneli v1.0.0</Text>
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
});
