import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIGHT = {
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLightBg: '#F0FDF4',
  orange: '#F97316',
  bg: '#FFFFFF',
  softBg: '#F9FAFB',
  card: '#FFFFFF',
  cardAlt: '#F9FAFB',
  dark: '#111827',
  darkSoft: '#374151',
  white: '#FFFFFF',
  text: '#111827',
  textSoft: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderSoft: '#F3F4F6',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  shadow: '#000000',
};

const DARK = {
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLightBg: '#1a2e1a',
  orange: '#F97316',
  bg: '#0f0f0f',
  softBg: '#1a1a1a',
  card: '#1e1e1e',
  cardAlt: '#252525',
  dark: '#f0f0f0',
  darkSoft: '#d1d5db',
  white: '#1e1e1e',
  text: '#f0f0f0',
  textSoft: '#9CA3AF',
  textMuted: '#6B7280',
  border: '#333333',
  borderSoft: '#2a2a2a',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  shadow: '#000000',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme').then(v => {
      if (v === 'dark') setIsDark(true);
    });
  }, []);

  function toggle() {
    const yeni = !isDark;
    setIsDark(yeni);
    AsyncStorage.setItem('theme', yeni ? 'dark' : 'light');
  }

  const colors = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ isDark, toggle, C: colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
