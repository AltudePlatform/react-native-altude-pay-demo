import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {RootStackParamList, MainTabParamList} from '../types';
import {useAuthStore} from '../store/authStore';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SendScreen from '../screens/SendScreen';
import HistoryScreen from '../screens/HistoryScreen';
import QRScreen from '../screens/QRScreen';
import ScanScreen from '../screens/ScanScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({
  name,
  focused,
}: {
  name: string;
  focused: boolean;
}): React.JSX.Element {
  // Simple text-based icons (SVG icons can be swapped in)
  const icons: Record<string, string> = {
    Home: '🏠',
    Send: '💸',
    History: '📋',
    QR: '📷',
  };
  return (
    <>{/* Emoji placeholder – swap with SVG icon components */}</>
  );
}

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '#9945FF',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2d2d44',
        },
        tabBarLabelStyle: {fontSize: 12},
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: 'Wallet', tabBarIcon: () => null}}
      />
      <Tab.Screen
        name="Send"
        component={SendScreen}
        options={{title: 'Send', tabBarIcon: () => null}}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{title: 'History', tabBarIcon: () => null}}
      />
      <Tab.Screen
        name="QR"
        component={QRScreen}
        options={{title: 'QR', tabBarIcon: () => null}}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator(): React.JSX.Element {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
        {/* ScanScreen accessible from anywhere */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
