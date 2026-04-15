import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    const saat = new Date(item.yaradildi).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={[s.mesajWrap, ozumunkudur ? s.sagda : s.solda]}>
        {!ozumunkudur && (
          <View style={s.avatar}>
            <Ionicons name="person" size={14} color={C.textSoft} />
          </View>
        )}
        <View style={{ maxWidth: '75%' }}>
          <View style={[s.balon, ozumunkudur ? s.ozBalon : s.onunBalon]}>
            <Text style={[s.metn, ozumunkudur && { color: C.white }]}>{item.metn}</Text>
          </View>
          <Text style={[s.saat, ozumunkudur ? { textAlign: 'right' } : {}]}>{saat}</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={mesajlar}
        keyExtractor={i => i.id}
        renderItem={renderMesaj}
        contentContainerStyle={s.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={s.bosWrap}>
            <View style={s.bosIkon}>
              <Ionicons name="chatbubbles-outline" size={36} color={C.primary} />
            </View>
            <Text style={s.bosMetn}>Hələ mesaj yoxdur.{'\n'}Müştəri ilə əlaqə saxlayın.</Text>
          </View>
        }
      />
      <View style={s.inputBar}>
        <TextInput
          style={s.textInput}
          value={metn}
          onChangeText={setMetn}
          placeholder="Mesaj yazın..."
          placeholderTextColor={C.textMuted}
          multiline
        />
        <TouchableOpacity
          style={[s.gonderBtn, !metn.trim() && s.gonderBtnDisabled]}
          onPress={gonder}
          disabled={!metn.trim()}
          activeOpacity={0.85}
        >
          <Ionicons name="send" size={18} color={C.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.softBg },
  list: { padding: 16, gap: 4, paddingBottom: 8 },

  mesajWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 3 },
  sagda: { justifyContent: 'flex-end' },
  solda: { alignSelf: 'flex-start' },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  balon: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  ozBalon: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  onunBalon: {
    backgroundColor: C.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },

  metn: { fontSize: 15, color: C.dark, lineHeight: 21 },
  saat: { fontSize: 11, color: C.textMuted, marginTop: 4, marginHorizontal: 4 },

  bosWrap: { flex: 1, alignItems: 'center', paddingTop: 80 },
  bosIkon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: C.primaryLightBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bosMetn: { fontSize: 15, color: C.textSoft, textAlign: 'center', lineHeight: 22 },

  inputBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: C.softBg,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: C.dark,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: C.border,
  },
  gonderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  gonderBtnDisabled: { backgroundColor: C.border, shadowOpacity: 0 },
});
