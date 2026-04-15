import { View, TextInput, Text, StyleSheet } from 'react-native';
import C from '../utils/colors';

export default function Input({ label, error, icon, ...props }) {
  return (
    <View style={s.wrap}>
      {label && <Text style={s.label}>{label}</Text>}
      <View style={[s.inputWrap, error && { borderColor: C.error }, props.multiline && { height: 110, alignItems: 'flex-start' }]}>
        {icon && <View style={s.icon}>{icon}</View>}
        <TextInput
          style={[s.input, icon && { paddingLeft: 0 }, props.multiline && { paddingTop: 12, textAlignVertical: 'top' }]}
          placeholderTextColor={C.textMuted}
          {...props}
        />
      </View>
      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: C.textSoft, marginBottom: 8, letterSpacing: 0.2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 16, backgroundColor: C.white,
  },
  icon: { opacity: 0.45 },
  input: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
  error: { fontSize: 12, color: C.error, marginTop: 5, fontWeight: '500' },
});
