import { View, TextInput, Text, StyleSheet } from 'react-native';
import C from '../utils/colors';

export default function Input({ label, error, ...props }) {
  return (
    <View style={s.wrap}>
      {label && <Text style={s.label}>{label}</Text>}
      <TextInput
        style={[s.input, error && { borderColor: C.error }]}
        placeholderTextColor={C.textSoft}
        {...props}
      />
      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: C.textSoft, marginBottom: 6 },
  input: {
    height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, fontSize: 15, color: C.text, backgroundColor: C.white,
  },
  error: { fontSize: 12, color: C.error, marginTop: 4 },
});
