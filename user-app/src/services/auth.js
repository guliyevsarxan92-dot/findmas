import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

let GoogleSignin = null;

function getGoogleSignin() {
  if (!GoogleSignin) {
    try {
      const mod = require('@react-native-google-signin/google-signin');
      GoogleSignin = mod.GoogleSignin;
      GoogleSignin.configure({
        webClientId: '682117254538-5avgsk6jv3mpnsvtuosbctkn2f7sq6ff.apps.googleusercontent.com',
      });
    } catch {
      return null;
    }
  }
  return GoogleSignin;
}

export async function giris(telefon, sifre) {
  const { data } = await api.post('/istifadeci/giris', { telefon, sifre });
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.istifadeci));
  return data.istifadeci;
}

export async function googleIleGiris() {
  const gs = getGoogleSignin();
  if (!gs) throw { xeta: 'Google Sign-In yalnız build edilmiş versiyada işləyir' };

  await gs.hasPlayServices();
  const response = await gs.signIn();
  const id_token = response.data?.idToken;
  if (!id_token) throw { xeta: 'Google token alına bilmədi' };

  const { data } = await api.post('/istifadeci/google-giris', { id_token });
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.istifadeci));
  return data;
}

export async function qeydiyyat(form) {
  const { data } = await api.post('/istifadeci/qeydiyyat', form);
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.istifadeci));
  return data.istifadeci;
}

export async function cixis() {
  try { const gs = getGoogleSignin(); if (gs) await gs.signOut(); } catch {}
  await AsyncStorage.multiRemove(['token', 'user']);
}

export async function mevcudUser() {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}
