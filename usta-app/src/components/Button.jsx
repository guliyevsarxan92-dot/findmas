import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import C from '../utils/colors';

export default function Button({ title, onPress, loading, variant = 'primary', style }) {
  const bg = variant === 'primary' ? C.primary : variant === 'outline' ? C.white : '#e2e8f0';
  const color = variant === 'primary' ? '#fff' : variant === 'outline' ? C.primary : C.text;
  const border = variant === 'outline' ? { borderWidth: 1.5, borderColor: C.primary } : {};

  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: bg }, border, style]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={color} />
        : <Text style={[s.text, { color }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  text: { fontSize: 16, fontWeight: '600' },
});
