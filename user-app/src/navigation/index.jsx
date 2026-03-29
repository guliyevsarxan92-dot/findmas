import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
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
        options={{ title: 'Usta Çağır', tabBarLabel: 'Ana', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Tarixce" component={TarixceScreen}
        options={{ title: 'Tarixçə', tabBarLabel: 'Tarixçə', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📋</Text> }}
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
            <Stack.Screen name="SifarisVer" component={SifarisVerScreen}
              options={{ headerShown: true, title: 'Sifariş ver', headerBackTitle: '' }} />
            <Stack.Screen name="UstaAxtarilir" component={UstaAxtarilirScreen} />
            <Stack.Screen name="AktivSifaris" component={AktivSifarisScreen}
              options={{ headerShown: true, title: 'Aktiv sifariş', headerBackVisible: false }} />
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
