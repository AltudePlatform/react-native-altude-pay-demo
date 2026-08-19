/**
 * Jest setup for screen snapshot tests.
 *
 * Phase 0 safeguard: these mocks exist so every screen can be rendered in
 * isolation and structurally snapshotted before any visual work begins.
 * They stub native modules only - no application logic is mocked here.
 */
/* eslint-env jest */

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reanimated', () => require('./reanimatedMock'));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: {
    getString: jest.fn(async () => ''),
    setString: jest.fn(),
  },
}));

jest.mock('react-native-vision-camera', () => {
  const React = require('react');
  const {View} = require('react-native');

  const Camera = Object.assign(
    React.forwardRef((props, ref) => React.createElement(View, {...props, ref})),
    {
      requestCameraPermission: jest.fn(async () => 'granted'),
      getCameraPermissionStatus: jest.fn(() => 'granted'),
    },
  );

  return {
    Camera,
    useCameraDevice: () => ({id: 'back'}),
    useCodeScanner: () => ({}),
  };
});

jest.mock('react-native-qrcode-svg', () => 'QRCode');

/**
 * React Native's Jest preset implements requestAnimationFrame with
 * `setTimeout(() => callback(jest.now()), 0)`. A frame scheduled during
 * teardown then calls `jest.now()` after the environment is gone and throws.
 * Use a plain clock instead - snapshots never depend on the frame timestamp.
 */
global.requestAnimationFrame = callback => setTimeout(() => callback(Date.now()), 0);
global.cancelAnimationFrame = handle => clearTimeout(handle);

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({top: 47, right: 0, bottom: 34, left: 0}),
    useSafeAreaFrame: () => ({x: 0, y: 0, width: 390, height: 844}),
  };
});
