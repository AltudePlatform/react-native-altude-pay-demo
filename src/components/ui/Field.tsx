/**
 * Text field.
 *
 * Replaces four divergent TextInput styles. Adds a real focus state (the app
 * previously had none anywhere), inline validation so errors don't have to be
 * raised as OS alerts on submit, and correct accessibility wiring.
 */
import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ViewStyle,
} from 'react-native';

import {tokens} from '../../theme/tokens';

type FieldProps = {
  label?: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  /** Inline error. Renders the error border and an announced message. */
  error?: string | null;
  /** Confirmation shown when the value is valid. */
  hint?: string | null;
  /** Render the value in the mono face - use for addresses and signatures. */
  mono?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: KeyboardTypeOptions;
  /** Right-hand affordance, e.g. a Paste control. */
  accessory?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  mono = false,
  multiline = false,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  keyboardType,
  accessory,
  style,
  testID,
}: FieldProps): React.JSX.Element {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.root, style]}>
      {label || accessory ? (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {accessory}
        </View>
      ) : null}

      <TextInput
        testID={testID}
        style={[
          styles.input,
          mono && styles.inputMono,
          multiline && styles.inputMultiline,
          focused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={tokens.color.disabledText}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        accessibilityLabel={label}
        selectionColor={tokens.color.brand}
      />

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: tokens.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: tokens.spacing.xxl,
  },
  label: {
    ...tokens.type.label,
    color: tokens.color.textSecondary,
  },
  input: {
    ...tokens.type.body,
    color: tokens.color.textPrimary,
    backgroundColor: tokens.color.surface,
    borderWidth: tokens.border.strong,
    borderColor: tokens.color.borderHairline,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
    minHeight: tokens.layout.touchTarget + tokens.spacing.md,
  },
  inputMono: {
    ...tokens.type.mono,
    color: tokens.color.textPrimary,
    lineHeight: 20,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: tokens.color.brand,
  },
  inputError: {
    borderColor: tokens.color.error,
  },
  error: {
    ...tokens.type.caption,
    color: tokens.color.error,
  },
  hint: {
    ...tokens.type.caption,
    color: tokens.color.textMuted,
  },
});

export default Field;
