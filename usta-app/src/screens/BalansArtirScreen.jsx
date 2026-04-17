import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import C from '../utils/colors';

export default function BalansArtirScreen({ navigation }) {
  const [məbleg, setMəbleg] = useState('');
  const [qebzBase64, setQebzBase64] = useState(null);
  const [adminKart, setAdminKart] = useState(null);
  const [yuklenir, setYuklenir] = useState(false);

  useEffect(() => {
    api.get('/usta/balans-kart').then(r => setAdminKart(r.data.kart)).catch(() => {});
  }, []);

  async function qebzSec() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İcazə lazımdır', 'Qalereya icazəsi verin.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setQebzBase64(`data:image/jpeg;base64,${asset.base64}`);
  }

  async function gondər() {
    if (!məbleg || isNaN(Number(məbleg)) || Number(məbleg) <= 0) {
      Alert.alert('Xəta', 'Düzgün məbləğ daxil edin');
      return;
    }
    setYuklenir(true);
    try {
      await api.post('/usta/balans-artir', {
        məbleg: Number(məbleg),
        qebz: qebzBase64,
      });
      Alert.alert(
        'Sorğu göndərildi!',
        'Admin yoxladıqdan sonra balansınız artırılacaq.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Xəta', err.response?.data?.xeta || 'Sorğu göndərilmədi');
    } finally {
      setYuklenir(false);
    }
  }

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

      {/* Admin card info */}
      <View style={s.infoKart}>
        <View style={s.infoIkon}>
          <Ionicons name="card-outline" size={22} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.infoBasliq}>Adminə köçürülə biləcək kart</Text>
          {adminKart ? (
            <Text style={s.adminKart}>{adminKart}</Text>
          ) : (
            <Text style={s.infoAlt}>Yüklənir...</Text>
          )}
        </View>
      </View>

      <Text style={s.aciqlamaMetn}>
        Yuxarıdakı kart nömrəsinə pul köçürün, qəbzi şəkil çəkib göndərin. Admin təsdiqlədikdən sonra balansınız artırılacaq.
      </Text>

      {/* Amount */}
      <Text style={s.label}>Köçürdüyünüz məbləğ (₼)</Text>
      <View style={s.inputWrap}>
        <Ionicons name="cash-outline" size={20} color={C.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={s.input}
          value={məbleg}
          onChangeText={setMəbleg}
          placeholder="50"
          keyboardType="numeric"
          placeholderTextColor={C.textMuted}
        />
        <Text style={s.azn}>₼</Text>
      </View>

      {/* Receipt */}
      <Text style={s.label}>Bank qəbzi (şəkil)</Text>
      <TouchableOpacity style={s.qebzBtn} onPress={qebzSec} activeOpacity={0.8}>
        {qebzBase64 ? (
          <View style={s.qebzSelected}>
            <Ionicons name="checkmark-circle" size={22} color={C.primary} />
            <Text style={[s.qebzBtnMetn, { color: C.primary }]}>Şəkil seçildi</Text>
          </View>
        ) : (
          <View style={s.qebzSelected}>
            <Ionicons name="image-outline" size={22} color={C.textMuted} />
            <Text style={s.qebzBtnMetn}>Qəbz şəklini seçin</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity style={s.gondərBtn} onPress={gondər} disabled={yuklenir} activeOpacity={0.85}>
        {yuklenir ? (
          <ActivityIndicator color={C.white} />
        ) : (
          <>
            <Ionicons name="send-outline" size={18} color={C.white} />
            <Text style={s.gondərMetn}>Sorğu göndər</Text>
          </>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.softBg },

  infoKart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryLightBg,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.primary + '30',
  },
  infoIkon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBasliq: { fontSize: 12, color: C.textSoft, marginBottom: 4 },
  adminKart: { fontSize: 18, fontWeight: '800', color: C.dark, letterSpacing: 1.5 },
  infoAlt: { fontSize: 14, color: C.textMuted },

  aciqlamaMetn: {
    fontSize: 13,
    color: C.textSoft,
    lineHeight: 20,
    marginBottom: 24,
    backgroundColor: C.white,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },

  label: { fontSize: 13, fontWeight: '600', color: C.textSoft, marginBottom: 8 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  input: { flex: 1, fontSize: 16, color: C.dark },
  azn: { fontSize: 16, fontWeight: '700', color: C.primary },

  qebzBtn: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    padding: 18,
    marginBottom: 28,
    alignItems: 'center',
  },
  qebzSelected: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qebzBtnMetn: { fontSize: 15, color: C.textMuted, fontWeight: '500' },

  gondərBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  gondərMetn: { fontSize: 17, fontWeight: '800', color: C.white },
});
