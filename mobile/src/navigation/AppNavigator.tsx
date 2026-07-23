import React from 'react';
import {Text} from 'react-native';
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

// Tab icon emojis – swap with react-native-svg icons for production
const TAB_ICONS: Record<string, string> = {
  Wallet: '🏠',
  Send: '💸',
  History: '📋',
  QR: '📷',
};

function tabIcon(title: string) {
  return ({focused}: {focused: boolean}) => (
    <Text style={{fontSize: 16, opacity: focused ? 1 : 0.5}}>
      {TAB_ICONS[title] ?? '○'}
    </Text>
  );
}

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#9945FF',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2d2d44',
        },
        tabBarLabelStyle: {fontSize: 12},
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: 'Wallet', tabBarIcon: tabIcon('Wallet')}}
      />
      <Tab.Screen
        name="Send"
        component={SendScreen}
        options={{title: 'Send', tabBarIcon: tabIcon('Send')}}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{title: 'History', tabBarIcon: tabIcon('History')}}
      />
      <Tab.Screen
        name="QR"
        component={QRScreen}
        options={{title: 'QR', tabBarIcon: tabIcon('QR')}}
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
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
