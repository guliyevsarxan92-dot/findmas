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

// payload: { telefon, sifre } YA { email, sifre }
export async function giris(telefon, sifre, payload) {
  const body = payload || { telefon, sifre };
  const { data } = await api.post('/usta/giris', body);
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('usta', JSON.stringify(data.usta));
  return data.usta;
}

export async function googleIleGiris(kateqoriya) {
  const gs = getGoogleSignin();
  if (!gs) throw { xeta: 'Google Sign-In yalnız build edilmiş versiyada işləyir' };

  await gs.hasPlayServices();
  const response = await gs.signIn();
  const id_token = response.data?.idToken;
  if (!id_token) throw { xeta: 'Google token alına bilmədi' };

  const { data } = await api.post('/usta/google-giris', { id_token, kateqoriya });
  if (data.kateqoriya_lazim) throw data;

  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('usta', JSON.stringify(data.usta));
  return data;
}

export async function qeydiyyat(form) {
  const { data } = await api.post('/usta/qeydiyyat', form);
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('usta', JSON.stringify(data.usta));
  return data;
}

export async function cixis() {
  try { const gs = getGoogleSignin(); if (gs) await gs.signOut(); } catch {}
  await AsyncStorage.multiRemove(['token', 'usta']);
}

export async function mevcudUsta() {
  const raw = await AsyncStorage.getItem('usta');
  return raw ? JSON.parse(raw) : null;
}
