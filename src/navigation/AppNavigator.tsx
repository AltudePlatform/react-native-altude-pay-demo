import React from 'react';
import {StyleSheet, View} from 'react-native';
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
import PaymentStatusScreen from '../screens/PaymentStatusScreen';
import PreparingAccountScreen from '../screens/PreparingAccountScreen';
import ReceiptScreen from '../screens/ReceiptScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import {tokens} from '../theme/tokens';

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

type AppNavigatorProps = {
  onboardingComplete: boolean;
  onOnboardingComplete: (profile: UserProfile) => Promise<void>;
  onLogout: () => Promise<void>;
};

function tabIcon(shape: 'circle' | 'diamond') {
  return ({focused}: {focused: boolean}) => (
    <View style={[styles.iconBase, focused ? styles.iconFocused : styles.iconMuted]}>
      {shape === 'circle' ? <View style={styles.iconCircle} /> : null}
      {shape === 'diamond' ? <View style={styles.iconDiamond} /> : null}
    </View>
  );
}

function MainTabs({onLogout}: {onLogout: () => Promise<void>}): React.JSX.Element {
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
          fontSize: tokens.type.caption.fontSize,
          fontWeight: '700',
        },
      }}>
      <Tab.Screen
        name="Home"
        options={{title: 'Home', tabBarIcon: tabIcon('circle')}}>
        {() => <HomeScreen onLogout={onLogout} />}
      </Tab.Screen>
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
  onLogout,
}: AppNavigatorProps): React.JSX.Element {
  return (
    <NavigationContainer key={onboardingComplete ? 'authenticated' : 'onboarding'}>
      <RootStack.Navigator
        initialRouteName={onboardingComplete ? 'MainTabs' : 'Onboarding'}
        screenOptions={{headerShown: false}}>
        {!onboardingComplete ? (
          <RootStack.Screen name="Onboarding">
            {() => <OnboardingScreen />}
          </RootStack.Screen>
        ) : null}
        <RootStack.Screen name="MainTabs">
          {() => <MainTabs onLogout={onLogout} />}
        </RootStack.Screen>
        <RootStack.Screen name="Preparing" options={{gestureEnabled: false}}>
          {({route}) => (
            <PreparingAccountScreen
              profile={route.params.profile}
              onPrepare={onOnboardingComplete}
            />
          )}
        </RootStack.Screen>
        <RootStack.Screen name="PayAddress" component={PayAddressScreen} />
        <RootStack.Screen
          name="PaymentStatus"
          component={PaymentStatusScreen}
          options={{gestureEnabled: false}}
        />
        <RootStack.Screen name="History" component={HistoryScreen} />
        <RootStack.Screen name="Receipt" component={ReceiptScreen} />
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
