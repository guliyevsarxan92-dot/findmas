import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import C from '../utils/colors';

export default function BildirisScreen() {
  const [yeniSifaris, setYeniSifaris] = useState(true);
  const [mesaj, setMesaj] = useState(true);
  const [status, setStatus] = useState(true);
  const [balans, setBalans] = useState(true);

  const items = [
    { label: 'Yeni sifariş bildirişləri', icon: 'flash-outline', value: yeniSifaris, set: setYeniSifaris },
    { label: 'Mesaj bildirişləri', icon: 'chatbubble-outline', value: mesaj, set: setMesaj },
    { label: 'Sifariş status dəyişikliyi', icon: 'swap-horizontal-outline', value: status, set: setStatus },
    { label: 'Balans bildirişləri', icon: 'wallet-outline', value: balans, set: setBalans },
  ];

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20 }}>
      <View style={s.card}>
        {items.map((item, i) => (
          <View key={item.label}>
            <View style={s.row}>
              <View style={s.left}>
                <Ionicons name={item.icon} size={20} color={C.primary} />
                <Text style={s.label}>{item.label}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.set}
                trackColor={{ false: '#e2e8f0', true: C.primary + '60' }}
                thumbColor={item.value ? C.primary : '#94a3b8'}
              />
            </View>
            {i < items.length - 1 && <View style={s.sep} />}
          </View>
        ))}
      </View>
      <Text style={s.alt}>Push bildirişlər üçün telefon parametrlərindən icazə verin.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.softBg },
  card: {
    backgroundColor: C.white, borderRadius: 18, padding: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  label: { fontSize: 15, fontWeight: '500', color: C.dark },
  sep: { height: 1, backgroundColor: C.border, marginLeft: 48 },
  alt: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 20 },
});
