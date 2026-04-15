import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// payload: { telefon, sifre } YA { email, sifre }
export async function giris(telefon, sifre, payload) {
  const body = payload || { telefon, sifre };
  const { data } = await api.post('/usta/giris', body);
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('usta', JSON.stringify(data.usta));
  return data.usta;
}

export async function qeydiyyat(form) {
  const { data } = await api.post('/usta/qeydiyyat', form);
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('usta', JSON.stringify(data.usta));
  return data; // mesaj + usta hər ikisi qaytarılır
}

export async function cixis() {
  await AsyncStorage.multiRemove(['token', 'usta']);
}

export async function mevcudUsta() {
  const raw = await AsyncStorage.getItem('usta');
  return raw ? JSON.parse(raw) : null;
}
