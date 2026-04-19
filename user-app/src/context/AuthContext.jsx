import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = yüklənir

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => setIsLoggedIn(!!t));
  }, []);

  const tokenYoxla = useCallback(() => {
    AsyncStorage.getItem('token').then(t => {
      if (!t && isLoggedIn) setIsLoggedIn(false);
    });
  }, [isLoggedIn]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tokenYoxla();
    });
    return () => sub.remove();
  }, [tokenYoxla]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
