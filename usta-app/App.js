import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navigation from './src/navigation';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => setIsLoggedIn(!!t));
  }, []);

  if (isLoggedIn === null) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Navigation isLoggedIn={isLoggedIn} />
    </>
  );
}
