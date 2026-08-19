/**
 * Self-contained Reanimated mock.
 *
 * Reanimated 4's bundled mock pulls in react-native-worklets, which throws
 * without a native runtime under Jest. This stub covers only the surface the
 * app actually uses and keeps snapshots deterministic.
 */
/* eslint-env jest */
const React = require('react');
const {View, Text, ScrollView, Image} = require('react-native');

function createAnimatedComponent(Component) {
  return React.forwardRef((props, ref) =>
    React.createElement(Component, {...props, ref}),
  );
}

const entryExit = () => {
  const builder = {
    duration: () => builder,
    delay: () => builder,
    springify: () => builder,
    withInitialValues: () => builder,
    build: () => ({}),
  };
  return builder;
};

const FadeIn = entryExit();
const FadeOut = entryExit();
FadeIn.duration = () => FadeIn;
FadeIn.delay = () => FadeIn;
FadeOut.duration = () => FadeOut;
FadeOut.delay = () => FadeOut;

const Animated = {
  View: createAnimatedComponent(View),
  Text: createAnimatedComponent(Text),
  ScrollView: createAnimatedComponent(ScrollView),
  Image: createAnimatedComponent(Image),
  createAnimatedComponent,
};

const identity = value => value;

const Easing = {
  linear: identity,
  ease: identity,
  quad: identity,
  cubic: identity,
  bezier: () => identity,
  in: identity,
  out: identity,
  inOut: identity,
};

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  Easing,
  // Reduced motion defaults to false so the animated branch is the one
  // captured in the baseline snapshots.
  useReducedMotion: () => false,
  useSharedValue: initial => ({value: initial}),
  useAnimatedStyle: factory => {
    try {
      return factory() ?? {};
    } catch {
      return {};
    }
  },
  useAnimatedProps: factory => {
    try {
      return factory() ?? {};
    } catch {
      return {};
    }
  },
  useDerivedValue: factory => ({value: factory()}),
  withTiming: toValue => toValue,
  withSpring: toValue => toValue,
  withDelay: (_delay, value) => value,
  withRepeat: value => value,
  withSequence: (...values) => values[values.length - 1],
  cancelAnimation: () => {},
  runOnJS: fn => fn,
  runOnUI: fn => fn,
  interpolate: () => 0,
  Extrapolate: {CLAMP: 'clamp'},
  Extrapolation: {CLAMP: 'clamp'},
  FadeIn,
  FadeOut,
};
