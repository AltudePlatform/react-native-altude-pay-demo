/**
 * Local stroke icon set.
 *
 * Built on react-native-svg, which is already a dependency, so this adds no
 * package and no icon-font licensing exposure. All glyphs share a 24x24 grid
 * and a 1.75 stroke so they stay optically consistent at any size.
 *
 * Before this existed the app's only "icons" were <View> shapes with
 * borderWidth, a bare backspace glyph, and text labels.
 */
import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

import {tokens} from '../../theme/tokens';

export type IconName =
  | 'arrowLeft'
  | 'arrowDownLeft'
  | 'arrowUpRight'
  | 'close'
  | 'check'
  | 'alert'
  | 'copy'
  | 'share'
  | 'external'
  | 'scan'
  | 'backspace'
  | 'refresh'
  | 'chevronRight'
  | 'home'
  | 'send'
  | 'clock';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const PATHS: Record<IconName, string[]> = {
  arrowLeft: ['M15 5 L8 12 L15 19'],
  arrowDownLeft: ['M17 7 L7 17', 'M17 17 L7 17 L7 7'],
  arrowUpRight: ['M7 17 L17 7', 'M7 7 L17 7 L17 17'],
  close: ['M6 6 L18 18', 'M18 6 L6 18'],
  check: ['M5 13 L10 18 L19 6'],
  alert: ['M12 7 L12 13', 'M12 16.5 L12 17'],
  copy: ['M9 9 H19 V19 H9 Z', 'M15 9 V5 H5 V15 H9'],
  share: ['M12 15 L12 4', 'M8 8 L12 4 L16 8', 'M5 14 V19 H19 V14'],
  external: ['M14 5 H19 V10', 'M19 5 L11 13', 'M17 14 V19 H5 V7 H10'],
  scan: [
    'M4 9 V5 H8',
    'M16 5 H20 V9',
    'M20 15 V19 H16',
    'M8 19 H4 V15',
    'M7 12 H17',
  ],
  backspace: ['M8 5 H20 V19 H8 L2 12 Z', 'M12 9.5 L16.5 14.5', 'M16.5 9.5 L12 14.5'],
  refresh: ['M20 12 A8 8 0 1 1 17 6.3', 'M17 3 V7 H13'],
  chevronRight: ['M10 6 L16 12 L10 18'],
  home: ['M4 11 L12 4 L20 11', 'M6 10 V20 H18 V10'],
  send: ['M4 12 L20 5 L13 20 L11 13 Z'],
  clock: ['M12 7 V12 L15 14'],
};

/** Glyphs that need a surrounding circle drawn as well as their paths. */
const CIRCLED: Partial<Record<IconName, number>> = {
  alert: 9,
  clock: 8.5,
};

export function Icon({
  name,
  size = tokens.icon.lg,
  color = tokens.color.textPrimary,
  strokeWidth = 1.75,
}: IconProps): React.JSX.Element {
  const circleRadius = CIRCLED[name];

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {circleRadius ? (
        <Circle
          cx={12}
          cy={12}
          r={circleRadius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
      ) : null}
      {PATHS[name].map(d => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
    </Svg>
  );
}

export default Icon;
