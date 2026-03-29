import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert } from 'react-native';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { WS_URL } from '../services/api';
import C from '../utils/colors';


export default function UstaAxtarilirScreen({ route, navigation }) {
  const { sifaris_id } = route.params;
  const [saniye, setSaniye] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const socketRef = useRef(null);

  useEffect(() => {
    // Animasiya
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    // Keçən vaxt sayacı
    const interval = setInterval(() => setSaniye(s => s + 1), 1000);

    // WebSocket — usta qəbul etdimi deyə gözlə
    qosul();

    return () => {
      clearInterval(interval);
      socketRef.current?.disconnect();
    };
  }, []);

  async function qosul() {
    const token = await AsyncStorage.getItem('token');
    const socket = io(WS_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('sifaris_qebul', ({ usta }) => {
      socket.disconnect();
      navigation.replace('AktivSifaris', { usta });
    });
  }

  async function legvEt() {
    Alert.alert('Ləğv et', 'Sifarişi ləğv etmək istəyirsiniz?', [
      {
        text: 'Bəli', onPress: async () => {
          try {
            await api.post(`/sifaris/${sifaris_id}/status`, { yeni_status: 'legv_edildi' });
          } catch {}
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        },
      },
      { text: 'Xeyr' },
    ]);
  }

  const dəq = Math.floor(saniye / 60);
  const san = saniye % 60;

  return (
    <View style={s.wrap}>
      <Animated.View style={[s.daire, { transform: [{ scale: pulse }] }]}>
        <Text style={s.ikon}>🔍</Text>
      </Animated.View>

      <Text style={s.basliq}>Usta axtarılır...</Text>
      <Text style={s.alt}>Yaxınlıqdakı ustalar bildirilir</Text>

      <View style={s.saatBox}>
        <Text style={s.saat}>
          {String(dəq).padStart(2, '0')}:{String(san).padStart(2, '0')}
        </Text>
        <Text style={s.saatAlt}>gözləmə vaxtı</Text>
      </View>

      <TouchableOpacity style={s.legvBtn} onPress={legvEt}>
        <Text style={s.legvMetn}>Ləğv et</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  daire: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: C.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  ikon: { fontSize: 56 },
  basliq: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 8 },
  alt: { fontSize: 15, color: C.textSoft, textAlign: 'center', lineHeight: 22 },
  saatBox: { marginTop: 40, alignItems: 'center' },
  saat: { fontSize: 40, fontWeight: '800', color: C.primary },
  saatAlt: { fontSize: 13, color: C.textSoft, marginTop: 4 },
  legvBtn: { marginTop: 48, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 32 },
  legvMetn: { fontSize: 15, color: C.textSoft, fontWeight: '500' },
});
