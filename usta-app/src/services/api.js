import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.52.196:3000/api';
export const WS_URL = Constants.expoConfig?.extra?.wsUrl || 'http://192.168.52.196:3000';

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
  (err) => Promise.reject(err.response?.data || { xeta: 'Şəbəkə xətası' })
);

export default api;
