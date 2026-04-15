import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions,
} from 'react-native';
import MapView from 'react-native-maps';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { WS_URL } from '../services/api';
import C from '../utils/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BAKU = {
  latitude: 40.4093,
  longitude: 49.8671,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function UstaAxtarilirScreen({ route, navigation }) {
  const { sifaris_id } = route.params;
  const [saniye, setSaniye] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;
  const socketRef = useRef(null);

  useEffect(() => {
    // Spinning arc animation — 0→360 in 1500ms, loops forever
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    const interval = setInterval(() => setSaniye(s => s + 1), 1000);
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
      Vibration.vibrate([0, 200, 100, 200]);
      Alert.alert(
        'Usta tapıldı!',
        `${usta.ad} ${usta.soyad} sifarişinizi qəbul etdi.`,
        [{ text: 'Sifarişə bax', onPress: () => navigation.replace('AktivSifaris') }]
      );
    });

    socket.on('usta_tapilmadi', ({ mesaj }) => {
      socket.disconnect();
      Alert.alert(
        'Usta tapılmadı',
        mesaj || 'Yaxınlıqda uyğun usta tapılmadı. Bir az sonra yenidən cəhd edin.',
        [{ text: 'Anladım', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }) }]
      );
    });
  }

  async function legvEt() {
    Alert.alert('Ləğv et', 'Sifarişi ləğv etmək istəyirsiniz?', [
      {
        text: 'Bəli',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/sifaris/${sifaris_id}/legv`);
          } catch {}
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        },
      },
      { text: 'Xeyr', style: 'cancel' },
    ]);
  }

  const deq = Math.floor(saniye / 60);
  const san = saniye % 60;

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={s.container}>
      {/* Full-screen map background */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={BAKU}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      />

      {/* Dim overlay so the center element reads clearly */}
      <View style={s.overlay} />

      {/* Center: spinning arc + label */}
      <View style={s.centerBlock}>
        <Animated.View style={[s.spinRing, { transform: [{ rotate }] }]} />
        <Text style={s.searchLabel}>Usta axtarılır...</Text>
      </View>

      {/* Bottom white card */}
      <View style={s.bottomCard}>
        {/* Handle bar */}
        <View style={s.handle} />

        <Text style={s.timerText}>
          {String(deq).padStart(2, '0')}:{String(san).padStart(2, '0')}
        </Text>
        <Text style={s.timerSub}>gözləmə vaxtı</Text>

        <TouchableOpacity style={s.legvBtn} onPress={legvEt} activeOpacity={0.7}>
          <Text style={s.legvBtnText}>Ləğv et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  // --- Spinning arc ---
  centerBlock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 200, // keep it above the bottom card
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#22C55E',
    borderTopColor: 'transparent',
  },
  searchLabel: {
    marginTop: 20,
    fontSize: 18,
    color: '#D1D5DB',
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // --- Bottom card ---
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 40,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: 3,
  },
  timerSub: {
    fontSize: 13,
    color: C.textSoft,
    marginTop: 4,
    marginBottom: 20,
  },
  legvBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
  },
  legvBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textSoft,
  },
});
