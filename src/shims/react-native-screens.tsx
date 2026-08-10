import React from 'react';
import {View, type ViewProps} from 'react-native';

type AnyProps = ViewProps & {
  children?: React.ReactNode;
};

const BasicView = React.forwardRef<View, AnyProps>(({children, ...rest}, ref) => {
  return (
    <View {...rest} ref={ref}>
      {children}
    </View>
  );
});

export const Screen = React.forwardRef<View, AnyProps>((props, ref) => {
  return <BasicView {...props} ref={ref} />;
});

export const InnerScreen = Screen;
export const ScreenContext = React.createContext<any>(null);

export const ScreenContainer = React.forwardRef<View, AnyProps>((props, ref) => {
  return <BasicView {...props} ref={ref} />;
});

export const ScreenStack = React.forwardRef<View, AnyProps>((props, ref) => {
  return <BasicView {...props} ref={ref} />;
});

export const ScreenStackItem = React.forwardRef<View, AnyProps>((props, ref) => {
  return <BasicView {...props} ref={ref} />;
});

export const ScreenFooter = React.forwardRef<View, AnyProps>((props, ref) => {
  return <BasicView {...props} ref={ref} />;
});

export const ScreenContentWrapper = React.forwardRef<View, AnyProps>((props, ref) => {
  return <BasicView {...props} ref={ref} />;
});

export const ScreenStackHeaderConfig = ({children}: {children?: React.ReactNode}) => <>{children}</>;
export const ScreenStackHeaderSubview = ({children}: {children?: React.ReactNode}) => <>{children}</>;
export const ScreenStackHeaderLeftView = ({children}: {children?: React.ReactNode}) => <>{children}</>;
export const ScreenStackHeaderRightView = ({children}: {children?: React.ReactNode}) => <>{children}</>;
export const ScreenStackHeaderCenterView = ({children}: {children?: React.ReactNode}) => <>{children}</>;
export const ScreenStackHeaderBackButtonImage = ({children}: {children?: React.ReactNode}) => <>{children}</>;
export const ScreenStackHeaderSearchBarView = ({children}: {children?: React.ReactNode}) => <>{children}</>;

export const SearchBar = BasicView;
export const FullWindowOverlay = BasicView;

export const Tabs = {
  Host: BasicView,
  Screen: BasicView,
};

export const compatibilityFlags = {};
export const featureFlags = {};

export function enableScreens() {
  return;
}

export function enableFreeze() {
  return;
}

export function freezeEnabled() {
  return false;
}

export function screensEnabled() {
  return false;
}

export function isSearchBarAvailableForCurrentPlatform() {
  return false;
}

export function executeNativeBackPress() {
  return false;
}

export function useTransitionProgress() {
  return {
    progress: 1,
    closing: 0,
    goingForward: 1,
  };
}

export default {
  Screen,
  InnerScreen,
  ScreenContext,
  ScreenContainer,
  ScreenStack,
  ScreenStackItem,
  ScreenFooter,
  ScreenContentWrapper,
  ScreenStackHeaderConfig,
  ScreenStackHeaderSubview,
  ScreenStackHeaderLeftView,
  ScreenStackHeaderRightView,
  ScreenStackHeaderCenterView,
  ScreenStackHeaderBackButtonImage,
  ScreenStackHeaderSearchBarView,
  SearchBar,
  FullWindowOverlay,
  Tabs,
  compatibilityFlags,
  featureFlags,
  enableScreens,
  enableFreeze,
  freezeEnabled,
  screensEnabled,
  isSearchBarAvailableForCurrentPlatform,
  executeNativeBackPress,
  useTransitionProgress,
};
