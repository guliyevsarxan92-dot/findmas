import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cixis } from '../services/auth';
import C from '../utils/colors';

export default function ProfilScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('user').then(r => r && setUser(JSON.parse(r)));
  }, []);

  async function cixisEt() {
    Alert.alert('Çıxış', 'Hesabdan çıxmaq istəyirsiniz?', [
      {
        text: 'Bəli', onPress: async () => {
          await cixis();
          navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
      },
      { text: 'Xeyr' },
    ]);
  }

  if (!user) return null;

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarMetn}>{user.ad?.[0]}{user.soyad?.[0]}</Text>
        </View>
        <Text style={s.ad}>{user.ad} {user.soyad}</Text>
        <Text style={s.telefon}>{user.telefon}</Text>
      </View>

      <View style={s.menyu}>
        <TouchableOpacity style={s.menItem}>
          <Text style={s.menMetn}>👤 Məlumatlarımı redaktə et</Text>
          <Text style={s.ox}>›</Text>
        </TouchableOpacity>
        <View style={s.xett} />
        <TouchableOpacity style={s.menItem}>
          <Text style={s.menMetn}>🔔 Bildirişlər</Text>
          <Text style={s.ox}>›</Text>
        </TouchableOpacity>
        <View style={s.xett} />
        <TouchableOpacity style={s.menItem}>
          <Text style={s.menMetn}>❓ Yardım</Text>
          <Text style={s.ox}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.cixisBtn} onPress={cixisEt}>
        <Text style={s.cixisMetn}>Çıxış</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  header: { alignItems: 'center', padding: 32, paddingBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarMetn: { fontSize: 28, fontWeight: '800', color: '#fff' },
  ad: { fontSize: 20, fontWeight: '800', color: C.text },
  telefon: { fontSize: 14, color: C.textSoft, marginTop: 4 },
  menyu: { backgroundColor: C.white, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  menItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menMetn: { fontSize: 15, color: C.text },
  ox: { fontSize: 20, color: C.textSoft },
  xett: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  cixisBtn: {
    margin: 16, marginTop: 24, backgroundColor: '#fee2e2',
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  cixisMetn: { color: C.error, fontSize: 16, fontWeight: '600' },
});
