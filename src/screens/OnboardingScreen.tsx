import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, Pressable, FlatList, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';

import {RootStackParamList, UserProfile} from '../types';
import {Button, Field, Icon, Screen, Sheet} from '../components/ui';
import {tokens} from '../theme/tokens';
import {hasAltudeApiKey} from '../config/apiConfig';
import {runtimeConfig} from '../config/runtimeConfig';

type CountryOption = {
  label: string;
  code: string;
};

type ContactMethod = 'phone' | 'email';

const COUNTRY_OPTIONS: CountryOption[] = [
  {label: 'United States', code: '+1'},
  {label: 'Canada', code: '+1'},
  {label: 'United Kingdom', code: '+44'},
  {label: 'United Arab Emirates', code: '+971'},
  {label: 'Saudi Arabia', code: '+966'},
  {label: 'India', code: '+91'},
  {label: 'Pakistan', code: '+92'},
  {label: 'Nigeria', code: '+234'},
  {label: 'Kenya', code: '+254'},
  {label: 'South Africa', code: '+27'},
];

const CONTACT_METHODS: {value: ContactMethod; label: string}[] = [
  {value: 'phone', label: 'Phone number'},
  {value: 'email', label: 'Email'},
];

export default function OnboardingScreen(): React.JSX.Element {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('phone');
  const [countrySheetVisible, setCountrySheetVisible] = useState(false);

  const sanitizedPhone = useMemo(
    () => phoneNumber.replace(/[^0-9]/g, ''),
    [phoneNumber],
  );

  const validate = (): string | null => {
    const trimmedEmail = email.trim();
    const hasPhone = sanitizedPhone.length > 0;
    const hasEmail = trimmedEmail.length > 0;

    if (contactMethod === 'phone' && !countryCode.trim()) {
      return 'Please select a country code.';
    }
    if (contactMethod === 'phone' && !hasPhone) {
      return 'Please enter a contact number.';
    }
    if (contactMethod === 'email' && !hasEmail) {
      return 'Please enter an email address.';
    }
    if (
      contactMethod === 'email' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    ) {
      return 'Please enter a valid email address.';
    }
    if (!runtimeConfig.useMockData && !hasAltudeApiKey()) {
      return 'An Altude API key is required. Add ALTUDE_API_KEY to .env, restart Metro, then try again.';
    }
    return null;
  };

  const handleContinue = () => {
    const error = validate();
    if (error) {
      Alert.alert('Missing information', error);
      return;
    }

    const profile: UserProfile = {
      name: name.trim(),
      countryCode: contactMethod === 'phone' ? countryCode : '',
      phoneNumber: contactMethod === 'phone' ? sanitizedPhone : '',
      email: contactMethod === 'email' ? email.trim().toLowerCase() : '',
      completedAt: new Date().toISOString(),
    };

    navigation.navigate('Preparing', {profile});
  };

  return (
    /*
      Scroll + keyboard avoidance: the root was previously a plain View, so on
      a small device the keyboard covered the Continue button entirely.
    */
    <Screen scroll avoidKeyboard>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>WELCOME</Text>
        <Text style={styles.title}>Set up your payment profile</Text>
        <Text style={styles.subtitle}>
          This information helps personalize your dashboard on this device.
        </Text>
      </View>

      <View style={styles.form}>
        <Field
          label="Name (optional)"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
        />

        <View style={styles.group}>
          <Text style={styles.label}>Preferred contact method</Text>
          <View style={styles.radioRow}>
            {CONTACT_METHODS.map(option => {
              const selected = contactMethod === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setContactMethod(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{selected}}
                  accessibilityLabel={option.label}
                  style={({pressed}) => [
                    styles.radioOption,
                    selected && styles.radioOptionSelected,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.radioOuter, selected && styles.radioOuterOn]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text
                    style={[styles.radioLabel, selected && styles.radioLabelOn]}
                    numberOfLines={1}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {contactMethod === 'phone' ? (
          <View style={styles.group}>
            <Text style={styles.label}>Mobile number</Text>
            <View style={styles.phoneRow}>
              <Pressable
                onPress={() => setCountrySheetVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={`Country code ${countryCode}. Change`}
                style={({pressed}) => [styles.countryBtn, pressed && styles.pressed]}>
                <Text style={styles.countryBtnText}>{countryCode}</Text>
                <Icon
                  name="chevronRight"
                  size={tokens.icon.sm}
                  color={tokens.color.textMuted}
                />
              </Pressable>
              <Field
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
                style={styles.phoneField}
              />
            </View>
          </View>
        ) : (
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        )}

        <Button label="Continue" onPress={handleContinue} style={styles.continue} />
      </View>

      <Sheet
        visible={countrySheetVisible}
        onClose={() => setCountrySheetVisible(false)}
        title="Select country code">
        <FlatList
          data={COUNTRY_OPTIONS}
          keyExtractor={item => `${item.label}-${item.code}`}
          renderItem={({item}) => {
            const selected = item.code === countryCode;
            return (
              <Pressable
                onPress={() => {
                  setCountryCode(item.code);
                  setCountrySheetVisible(false);
                }}
                accessibilityRole="button"
                accessibilityState={{selected}}
                accessibilityLabel={`${item.label} ${item.code}`}
                style={({pressed}) => [styles.countryOption, pressed && styles.pressed]}>
                <Text style={styles.countryLabel}>{item.label}</Text>
                <Text style={styles.countryCode}>{item.code}</Text>
              </Pressable>
            );
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingTop: tokens.spacing.xxxl,
    gap: tokens.spacing.md,
  },
  eyebrow: {
    ...tokens.type.eyebrow,
    color: tokens.color.textMuted,
  },
  title: {
    ...tokens.type.display,
    color: tokens.color.textPrimary,
  },
  subtitle: {
    ...tokens.type.body,
    color: tokens.color.textSecondary,
  },
  form: {
    marginTop: tokens.spacing.huge,
    gap: tokens.spacing.xl,
  },
  group: {
    gap: tokens.spacing.md,
  },
  label: {
    ...tokens.type.label,
    color: tokens.color.textSecondary,
  },
  radioRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    minHeight: tokens.layout.touchTarget + tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: tokens.radius.md,
    borderWidth: tokens.border.strong,
    borderColor: tokens.color.borderHairline,
    backgroundColor: tokens.color.surface,
  },
  radioOptionSelected: {
    borderColor: tokens.color.brand,
    backgroundColor: tokens.color.surfaceElevated,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: tokens.radius.pill,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterOn: {
    borderColor: tokens.color.brand,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.brand,
  },
  radioLabel: {
    ...tokens.type.label,
    color: tokens.color.textSecondary,
    flexShrink: 1,
  },
  radioLabelOn: {
    color: tokens.color.textPrimary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.md,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    minHeight: tokens.layout.touchTarget + tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: tokens.radius.md,
    borderWidth: tokens.border.strong,
    borderColor: tokens.color.borderHairline,
    backgroundColor: tokens.color.surface,
  },
  countryBtnText: {
    ...tokens.type.body,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  phoneField: {
    flex: 1,
  },
  continue: {
    marginTop: tokens.spacing.md,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: tokens.layout.touchTarget + tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
  },
  countryLabel: {
    ...tokens.type.body,
    color: tokens.color.textPrimary,
  },
  countryCode: {
    ...tokens.type.monoValue,
    color: tokens.color.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
