import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

import GirisScreen from '../screens/GirisScreen';
import QeydiyyatScreen from '../screens/QeydiyyatScreen';
import AnaScreen from '../screens/AnaScreen';
import YeniSifarisScreen from '../screens/YeniSifarisScreen';
import AktivSifarisScreen from '../screens/AktivSifarisScreen';
import ChatScreen from '../screens/ChatScreen';
import QazancScreen from '../screens/QazancScreen';
import ProfilScreen from '../screens/ProfilScreen';
import BalansArtirScreen from '../screens/BalansArtirScreen';
import SenedlerScreen from '../screens/SenedlerScreen';
import BildirisScreen from '../screens/BildirisScreen';
import MexfilikScreen from '../screens/MexfilikScreen';
import YardimScreen from '../screens/YardimScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { C } = useTheme();
  const TAB_BAR = {
    tabBarStyle: {
      backgroundColor: C.white,
      borderTopColor: C.border,
      borderTopWidth: 1,
      height: 56 + insets.bottom,
      paddingBottom: insets.bottom || 8,
      paddingTop: 8,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 8,
    },
    tabBarActiveTintColor: C.primary,
    tabBarInactiveTintColor: C.textMuted,
    headerShown: false,
  };
  return (
    <Tab.Navigator screenOptions={TAB_BAR}>
      <Tab.Screen
        name="Ana"
        component={AnaScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Qazanc"
        component={QazancScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Giris" component={GirisScreen} />
      <Stack.Screen name="Qeydiyyat" component={QeydiyyatScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation({ isLoggedIn }) {
  const { isDark, C } = useTheme();
  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: C.primary,
          background: C.softBg,
          card: C.white,
          text: C.dark,
          border: C.border,
          notification: C.primary,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium:  { fontFamily: 'System', fontWeight: '500' },
          bold:    { fontFamily: 'System', fontWeight: '700' },
          heavy:   { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="YeniSifaris"
              component={YeniSifarisScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="AktivSifaris"
              component={AktivSifarisScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BalansArtir"
              component={BalansArtirScreen}
              options={{ headerShown: true, title: 'Balansı Artır', headerBackTitle: '', headerStyle: { backgroundColor: C.white }, headerTintColor: C.dark, headerTitleStyle: { fontWeight: '700' } }}
            />
            <Stack.Screen
              name="Senedler"
              component={SenedlerScreen}
              options={{ headerShown: true, title: 'Sənədlər', headerBackTitle: '', headerStyle: { backgroundColor: C.white }, headerTintColor: C.dark, headerTitleStyle: { fontWeight: '700' } }}
            />
            <Stack.Screen
              name="Bildiris"
              component={BildirisScreen}
              options={{ headerShown: true, title: 'Bildiriş parametrləri', headerBackTitle: '', headerStyle: { backgroundColor: C.white }, headerTintColor: C.dark, headerTitleStyle: { fontWeight: '700' } }}
            />
            <Stack.Screen
              name="Mexfilik"
              component={MexfilikScreen}
              options={{ headerShown: true, title: 'Məxfilik', headerBackTitle: '', headerStyle: { backgroundColor: C.white }, headerTintColor: C.dark, headerTitleStyle: { fontWeight: '700' } }}
            />
            <Stack.Screen
              name="Yardim"
              component={YardimScreen}
              options={{ headerShown: true, title: 'Yardım & Dəstək', headerBackTitle: '', headerStyle: { backgroundColor: C.white }, headerTintColor: C.dark, headerTitleStyle: { fontWeight: '700' } }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                headerShown: true,
                title: 'Müştəri ilə çat',
                headerBackTitle: '',
                headerStyle: { backgroundColor: C.white },
                headerTintColor: C.dark,
                headerTitleStyle: { fontWeight: '700', color: C.dark },
                headerShadowVisible: true,
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
