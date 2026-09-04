import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';

import {MainTabParamList, RootStackParamList} from '../types';
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
import {TabBar} from '../components/ui/TabBar';
import {navigationTheme} from '../theme/navigationTheme';
import {tokens} from '../theme/tokens';

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

type AppNavigatorProps = {
  onboardingComplete: boolean;
  onOnboardingComplete: () => Promise<void>;
  onLogout: () => Promise<void>;
};

function MainTabs({onLogout}: {onLogout: () => Promise<void>}): React.JSX.Element {
  return (
    <Tab.Navigator
      /*
        Must stay an arrow that returns an element. React Navigation invokes
        `tabBar` as a plain function, so passing TabBar directly would call a
        hook-using component outside React's render phase ("invalid hook
        call"). TabBar is defined at module scope, so this is not actually an
        unstable nested component.
      */
      // eslint-disable-next-line react/no-unstable-nested-components
      tabBar={props => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {backgroundColor: tokens.color.canvas},
      }}>
      <Tab.Screen name="Home" options={{title: 'Home'}}>
        {() => <HomeScreen onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Send" component={SendScreen} options={{title: 'Pay'}} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({
  onboardingComplete,
  onOnboardingComplete,
  onLogout,
}: AppNavigatorProps): React.JSX.Element {
  return (
    <NavigationContainer
      theme={navigationTheme}
      key={onboardingComplete ? 'authenticated' : 'onboarding'}>
      <RootStack.Navigator
        initialRouteName={onboardingComplete ? 'MainTabs' : 'Onboarding'}
        screenOptions={{
          headerShown: false,
          cardStyle: {backgroundColor: tokens.color.canvas},
        }}>
        {!onboardingComplete ? (
          <RootStack.Screen name="Onboarding">
            {() => (
              <OnboardingScreen
                onContinueWithDynamic={onOnboardingComplete}
              />
            )}
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
