/**
 * @format
 */

// Must be the very first import so crypto.getRandomValues is available
// before any @altude/core or @noble/curves usage.
import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import {enableScreens} from 'react-native-screens';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

enableScreens();

AppRegistry.registerComponent(appName, () => App);
