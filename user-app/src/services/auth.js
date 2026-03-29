import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export async function giris(telefon, sifre) {
  const { data } = await api.post('/istifadeci/giris', { telefon, sifre });
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.istifadeci));
  return data.istifadeci;
}

export async function qeydiyyat(form) {
  const { data } = await api.post('/istifadeci/qeydiyyat', form);
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.istifadeci));
  return data.istifadeci;
}

export async function cixis() {
  await AsyncStorage.multiRemove(['token', 'user']);
}

export async function mevcudUser() {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}
