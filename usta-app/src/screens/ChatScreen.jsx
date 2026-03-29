import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { WS_URL } from '../services/api';
import C from '../utils/colors';


export default function ChatScreen({ route }) {
  const { sifaris_id } = route.params;
  const [mesajlar, setMesajlar] = useState([]);
  const [metn, setMetn] = useState('');
  const listRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    yukle();
    qosul();
    return () => socketRef.current?.disconnect();
  }, []);

  async function yukle() {
    try {
      const { data } = await api.get(`/mesaj/${sifaris_id}`);
      setMesajlar(data);
    } catch {}
  }

  async function qosul() {
    const token = await AsyncStorage.getItem('token');
    const socket = io(WS_URL, { auth: { token } });
    socketRef.current = socket;
    socket.on('yeni_mesaj', ({ mesaj }) => {
      setMesajlar(m => [...m, mesaj]);
    });
  }

  async function gonder() {
    if (!metn.trim()) return;
    const kopi = metn;
    setMetn('');
    try {
      const { data } = await api.post(`/mesaj/${sifaris_id}`, { metn: kopi });
      setMesajlar(m => [...m, data]);
      setTimeout(() => listRef.current?.scrollToEnd(), 100);
    } catch {}
  }

  function renderMesaj({ item }) {
    const ozumunkudur = item.gonderən_nov === 'usta';
    return (
      <View style={[s.mesajWrap, ozumunkudur ? s.sagda : s.solda]}>
        <View style={[s.balon, ozumunkudur ? s.ozBalon : s.onunBalon]}>
          <Text style={[s.metn, ozumunkudur && { color: '#fff' }]}>{item.metn}</Text>
        </View>
        <Text style={s.saat}>
          {new Date(item.yaradildi).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={mesajlar}
        keyExtractor={i => i.id}
        renderItem={renderMesaj}
        contentContainerStyle={s.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
      />
      <View style={s.input}>
        <TextInput style={s.textInput} value={metn} onChangeText={setMetn}
          placeholder="Mesaj yazın..." placeholderTextColor={C.textSoft} multiline />
        <TouchableOpacity style={s.gonderBtn} onPress={gonder}>
          <Text style={{ fontSize: 20 }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, gap: 8 },
  mesajWrap: { maxWidth: '75%' },
  sagda: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  solda: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  balon: { borderRadius: 18, padding: 12 },
  ozBalon: { backgroundColor: C.primary, borderBottomRightRadius: 4 },
  onunBalon: { backgroundColor: C.white, borderBottomLeftRadius: 4 },
  metn: { fontSize: 15, color: C.text, lineHeight: 21 },
  saat: { fontSize: 11, color: C.textSoft, marginTop: 3 },
  input: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, alignItems: 'flex-end' },
  textInput: { flex: 1, backgroundColor: C.bg, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: C.text, maxHeight: 100 },
  gonderBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
});
