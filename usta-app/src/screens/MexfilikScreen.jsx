import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import C from '../utils/colors';

const ITEMS = [
  { icon: 'eye-off-outline', title: 'Konum məlumatları', desc: 'Yalnız onlayn olduqda konumunuz paylaşılır. Offline olduqda heç bir konum məlumatı göndərilmir.' },
  { icon: 'lock-closed-outline', title: 'Şəxsi məlumatlar', desc: 'Ad, soyad və telefon nömrəniz yalnız aktiv sifariş zamanı müştəriyə göstərilir.' },
  { icon: 'shield-outline', title: 'Sənədləriniz', desc: 'Şəxsiyyət vəsiqəsi və lisenziya yalnız admin tərəfindən görülür, müştərilərə göstərilmir.' },
  { icon: 'chatbubble-ellipses-outline', title: 'Mesajlar', desc: 'Müştəri ilə mesajlaşma yalnız aktiv sifariş müddətində mümkündür.' },
];

export default function MexfilikScreen() {
  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20 }}>
      {ITEMS.map((item, i) => (
        <View key={i} style={s.card}>
          <View style={s.iconBox}>
            <Ionicons name={item.icon} size={22} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.desc}>{item.desc}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.softBg },
  card: {
    flexDirection: 'row', gap: 14, backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: C.primaryLightBg,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 4 },
  desc: { fontSize: 13, color: C.textSoft, lineHeight: 19 },
});
