import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import C from '../utils/colors';

const FAQ = [
  { s: 'Sifariş necə qəbul edirəm?', c: 'Onlayn olduqda yaxınlıqdakı müştəri sifarişləri sizə göndərilir. Bildirişi açıb "Qəbul et" basın.' },
  { s: 'Balansımı necə artırıram?', c: 'Profil → Balansı artır → Admin kartına köçürmə edib qəbzi göndərin.' },
  { s: 'Niyə sifariş gəlmir?', c: 'Onlayn olduğunuzdan əmin olun. Yaxınlıqda müştəri olmaya bilər. Radiusunuz 20km-dən başlayır.' },
  { s: 'Bloklanmışam, nə edim?', c: 'Blok müddəti profildə göstərilir. Sualınız varsa dəstək xəttinə yazın.' },
];

export default function YardimScreen() {
  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={s.basliq}>Tez-tez verilən suallar</Text>

      {FAQ.map((item, i) => (
        <View key={i} style={s.card}>
          <Text style={s.sual}>{item.s}</Text>
          <Text style={s.cavab}>{item.c}</Text>
        </View>
      ))}

      <Text style={[s.basliq, { marginTop: 24 }]}>Bizimlə əlaqə</Text>

      <TouchableOpacity style={s.elaqeBtn} onPress={() => Linking.openURL('tel:+994515888884')} activeOpacity={0.8}>
        <Ionicons name="call-outline" size={20} color={C.primary} />
        <Text style={s.elaqeMetn}>+994 51 588 88 84</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.elaqeBtn} onPress={() => Linking.openURL('mailto:destek@findmas.az')} activeOpacity={0.8}>
        <Ionicons name="mail-outline" size={20} color={C.primary} />
        <Text style={s.elaqeMetn}>destek@findmas.az</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.softBg },
  basliq: { fontSize: 18, fontWeight: '800', color: C.dark, marginBottom: 14 },
  card: {
    backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sual: { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 6 },
  cavab: { fontSize: 14, color: C.textSoft, lineHeight: 20 },
  elaqeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.white, borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  elaqeMetn: { fontSize: 15, fontWeight: '600', color: C.dark },
});
