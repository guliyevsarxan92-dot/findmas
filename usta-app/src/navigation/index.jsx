import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import C from '../utils/colors';

import GirisScreen from '../screens/GirisScreen';
import QeydiyyatScreen from '../screens/QeydiyyatScreen';
import AnaScreen from '../screens/AnaScreen';
import YeniSifarisScreen from '../screens/YeniSifarisScreen';
import AktivSifarisScreen from '../screens/AktivSifarisScreen';
import ChatScreen from '../screens/ChatScreen';
import QazancScreen from '../screens/QazancScreen';
import ProfilScreen from '../screens/ProfilScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.white, elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        tabBarStyle: { borderTopColor: C.border, paddingBottom: 4 },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textSoft,
      }}
    >
      <Tab.Screen
        name="Ana" component={AnaScreen}
        options={{ title: 'Usta Paneli', tabBarLabel: 'Ana', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Qazanc" component={QazancScreen}
        options={{ title: 'Qazancım', tabBarLabel: 'Qazanc', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>💰</Text> }}
      />
      <Tab.Screen
        name="Profil" component={ProfilScreen}
        options={{ title: 'Profil', tabBarLabel: 'Profil', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text> }}
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
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="YeniSifaris" component={YeniSifarisScreen}
              options={{ presentation: 'modal' }} />
            <Stack.Screen name="AktivSifaris" component={AktivSifarisScreen}
              options={{ headerShown: true, title: 'Aktiv sifariş', headerBackTitle: '' }} />
            <Stack.Screen name="Chat" component={ChatScreen}
              options={{ headerShown: true, title: 'Müştəri ilə çat', headerBackTitle: '' }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
