import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import C from '../utils/colors';

export default function Button({ title, onPress, loading, variant = 'primary', style, icon }) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isDark = variant === 'dark';

  const bg = isPrimary ? C.primary : isDark ? C.dark : C.white;
  const color = isPrimary || isDark ? C.white : C.primary;
  const border = isOutline ? { borderWidth: 1.5, borderColor: C.primary } : {};

  return (
    <TouchableOpacity
      style={[
        s.btn,
        { backgroundColor: bg },
        border,
        isPrimary && {
          shadowColor: C.primary,
          shadowOpacity: 0.3,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        },
        style,
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.82}
    >
      {loading
        ? <ActivityIndicator color={color} size="small" />
        : <View style={s.inner}>
            {icon && <View style={s.iconWrap}>{icon}</View>}
            <Text style={[s.text, { color }]}>{title}</Text>
          </View>
      }
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { marginRight: 2 },
  text: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
