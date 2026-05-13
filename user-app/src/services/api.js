import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl ?? 'https://findmas-backend-production.up.railway.app/api';
export const WS_URL = Constants.expoConfig?.extra?.wsUrl ?? 'https://findmas-backend-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const data = err.response?.data;
    if (data?.sessiya_bitdi) {
      await AsyncStorage.multiRemove(['token', 'user']);
      const { Alert } = require('react-native');
      Alert.alert('Sessiya bitdi', 'Başqa cihazdan daxil olunub. Yenidən daxil olun.');
    }
    return Promise.reject(data || { xeta: 'Şəbəkə xətası' });
  }
);

export default api;
