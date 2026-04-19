import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import C from '../utils/colors';

import GirisScreen from '../screens/GirisScreen';
import QeydiyyatScreen from '../screens/QeydiyyatScreen';
import AnaScreen from '../screens/AnaScreen';
import SifarisVerScreen from '../screens/SifarisVerScreen';
import UstaAxtarilirScreen from '../screens/UstaAxtarilirScreen';
import AktivSifarisScreen from '../screens/AktivSifarisScreen';
import ChatScreen from '../screens/ChatScreen';
import OdenishScreen from '../screens/OdenishScreen';
import ReytinqScreen from '../screens/ReytinqScreen';
import TarixceScreen from '../screens/TarixceScreen';
import ProfilScreen from '../screens/ProfilScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
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
    tabBarShowLabel: true,
    headerShown: false,
  };
  return (
    <Tab.Navigator screenOptions={TAB_BAR}>
      <Tab.Screen
        name="Ana"
        component={AnaScreen}
        options={{
          tabBarLabel: 'Ana səhifə',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tarixce"
        component={TarixceScreen}
        options={{
          tabBarLabel: 'Tarixçə',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          tabBarLabel: 'Profil',
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
  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: C.primary,
          background: C.bg,
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
            <Stack.Screen name="SifarisVer" component={SifarisVerScreen}
              options={{ headerShown: false }} />
            <Stack.Screen name="UstaAxtarilir" component={UstaAxtarilirScreen}
              options={{ headerShown: false }} />
            <Stack.Screen name="AktivSifaris" component={AktivSifarisScreen}
              options={{ headerShown: false }} />
            <Stack.Screen name="Chat" component={ChatScreen}
              options={{ headerShown: true, title: 'Çat', headerBackTitle: '' }} />
            <Stack.Screen name="Odenish" component={OdenishScreen}
              options={{ headerShown: true, title: 'Ödəniş', headerBackTitle: '' }} />
            <Stack.Screen name="Reytinq" component={ReytinqScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
