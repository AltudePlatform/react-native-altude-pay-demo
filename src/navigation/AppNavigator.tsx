import React from 'react';
import {Text, StyleSheet, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';

import {MainTabParamList, RootStackParamList, UserProfile} from '../types';
import HomeScreen from '../screens/HomeScreen';
import SendScreen from '../screens/SendScreen';
import HistoryScreen from '../screens/HistoryScreen';
import QRScreen from '../screens/QRScreen';
import ScanScreen from '../screens/ScanScreen';
import PayAddressScreen from '../screens/PayAddressScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import {tokens} from '../theme/tokens';

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

type AppNavigatorProps = {
  onboardingComplete: boolean;
  onOnboardingComplete: (profile: UserProfile) => Promise<void>;
};

function tabIcon(shape: 'circle' | 'diamond') {
  return ({focused}: {focused: boolean}) => (
    <View style={[styles.iconBase, focused ? styles.iconFocused : styles.iconMuted]}>
      {shape === 'circle' ? <View style={styles.iconCircle} /> : null}
      {shape === 'diamond' ? <View style={styles.iconDiamond} /> : null}
    </View>
  );
}

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.accent,
        tabBarInactiveTintColor: tokens.colors.textMuted,
        tabBarStyle: {
          backgroundColor: tokens.colors.tabBg,
          borderTopColor: tokens.colors.border,
          height: 66,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: 'Dashboard', tabBarIcon: tabIcon('circle')}}
      />
      <Tab.Screen
        name="Send"
        component={SendScreen}
        options={{title: 'Pay', tabBarIcon: tabIcon('diamond')}}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({
  onboardingComplete,
  onOnboardingComplete,
}: AppNavigatorProps): React.JSX.Element {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{headerShown: false}}>
        {!onboardingComplete ? (
          <RootStack.Screen name="Onboarding">
            {() => <OnboardingScreen onComplete={onOnboardingComplete} />}
          </RootStack.Screen>
        ) : null}
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="PayAddress" component={PayAddressScreen} />
        <RootStack.Screen name="History" component={HistoryScreen} />
        <RootStack.Screen name="QR" component={QRScreen} />
        <RootStack.Screen name="Scan" component={ScanScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconBase: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFocused: {
    opacity: 1,
  },
  iconMuted: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: tokens.colors.accent,
  },
  iconDiamond: {
    width: 11,
    height: 11,
    borderWidth: 2,
    borderColor: tokens.colors.accent,
    transform: [{rotate: '45deg'}],
  },
});
