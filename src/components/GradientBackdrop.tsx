import React from 'react';
import {StyleSheet} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';

import {tokens} from '../theme/tokens';

export function GradientBackdrop(): React.JSX.Element {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="altudeBackdrop" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={tokens.gradient.heroFrom} />
          <Stop offset="55%" stopColor={tokens.gradient.heroMid} />
          <Stop offset="100%" stopColor={tokens.gradient.heroTo} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#altudeBackdrop)" />
    </Svg>
  );
}
