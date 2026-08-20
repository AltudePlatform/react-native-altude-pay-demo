import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, UserProfile} from '../types';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
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

export default function OnboardingScreen(): React.JSX.Element {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('phone');
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  const sanitizedPhone = useMemo(
    () => phoneNumber.replace(/[^0-9]/g, ''),
    [phoneNumber],
  );

  useEffect(() => {
    console.log('[screen] OnboardingScreen mounted');
  }, []);

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
    if (contactMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
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
    <View style={styles.page}>
      <View style={styles.hero}>
        <Svg style={StyleSheet.absoluteFill} width="110%" height="110%">
          <Defs>
            <LinearGradient id="onboardingHeroGradient" x1="0%" y1="0%" x2="100%" y2="110%">
              <Stop offset="0%" stopColor="#3f8cff" />
              <Stop offset="55%" stopColor="#4f7ef4" />
              <Stop offset="100%" stopColor="#6d5ce8" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#onboardingHeroGradient)" />
        </Svg>

        <View style={styles.heroGlowTop} />
        <View style={styles.heroGlowBottom} />

        <Text style={styles.kicker}>WELCOME</Text>
        <Text style={styles.title}>Set up your payment profile</Text>
        <Text style={styles.subtitle}>
          This information helps personalize your dashboard on this device.
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Name (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={tokens.colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Preferred contact method</Text>
        <View style={styles.radioRow}>
          {([
            {value: 'phone' as const, label: 'Phone number'},
            {value: 'email' as const, label: 'Email'},
          ]).map(option => (
            <TouchableOpacity
              key={option.value}
              style={styles.radioOption}
              onPress={() => setContactMethod(option.value)}
              accessibilityRole="radio"
              accessibilityState={{selected: contactMethod === option.value}}>
              <View style={styles.radioOuter}>
                {contactMethod === option.value ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.radioLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {contactMethod === 'phone' ? (
          <>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={styles.countryBtn}
                onPress={() => setCountryModalVisible(true)}>
                <Text style={styles.countryBtnText}>{countryCode}</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="Enter mobile number"
                placeholderTextColor={tokens.colors.textMuted}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={tokens.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </>
        )}

        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={countryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Country Code</Text>
            <FlatList
              data={COUNTRY_OPTIONS}
              keyExtractor={item => `${item.label}-${item.code}`}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.countryOption}
                  onPress={() => {
                    setCountryCode(item.code);
                    setCountryModalVisible(false);
                  }}>
                  <Text style={styles.countryLabel}>{item.label}</Text>
                  <Text style={styles.countryCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setCountryModalVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: tokens.colors.page,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  hero: {
    minHeight: 188,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  heroGlowTop: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    right: -56,
    top: -58,
  },
  heroGlowBottom: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    left: -34,
    bottom: -46,
  },
  kicker: {
    ...tokens.type.eyebrow,
    color: tokens.onAccent.secondary,
  },
  title: {
    ...tokens.type.display,
    color: tokens.onAccent.primary,
    marginTop: 8,
  },
  subtitle: {
    ...tokens.type.body,
    color: tokens.onAccent.secondary,
    marginTop: 10,
    maxWidth: '90%',
  },
  formCard: {
    marginTop: 0,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  label: {
    ...tokens.type.label,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    ...tokens.type.body,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: tokens.colors.textPrimary,
    backgroundColor: tokens.colors.card,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryBtn: {
    minWidth: 86,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryBtnText: {
    ...tokens.type.body,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
  },
  radioRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: tokens.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.colors.accent,
  },
  radioLabel: {
    ...tokens.type.label,
    color: tokens.colors.textPrimary,
  },
  continueBtn: {
    marginTop: 20,
    backgroundColor: tokens.colors.accent,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    paddingVertical: 15,
  },
  continueBtnText: {
    ...tokens.type.action,
    color: tokens.onAccent.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(22, 18, 13, 0.42)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '65%',
    backgroundColor: tokens.colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: tokens.spacing.lg,
  },
  modalTitle: {
    ...tokens.type.title,
    fontSize: 20,
    lineHeight: 26,
    color: tokens.colors.textPrimary,
    marginBottom: 12,
  },
  countryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    paddingVertical: 14,
  },
  countryLabel: {
    ...tokens.type.body,
    color: tokens.colors.textPrimary,
  },
  countryCode: {
    ...tokens.type.body,
    fontWeight: '700',
    color: tokens.colors.textMuted,
  },
  closeBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  closeBtnText: {
    color: tokens.colors.textMuted,
    fontWeight: '700',
  },
});
