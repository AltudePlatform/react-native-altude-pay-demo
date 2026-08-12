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
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, UserProfile} from '../types';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {tokens} from '../theme/tokens';

type OnboardingScreenProps = {
  onComplete: (profile: UserProfile) => Promise<void> | void;
};

type CountryOption = {
  label: string;
  code: string;
};

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

export default function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps): React.JSX.Element {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sanitizedPhone = useMemo(
    () => phoneNumber.replace(/[^0-9]/g, ''),
    [phoneNumber],
  );

  useEffect(() => {
    console.log('[screen] OnboardingScreen mounted');
  }, []);

  const validate = (): string | null => {
    if (!countryCode.trim()) {return 'Please select a country code.';}
    if (sanitizedPhone.length === 0) {
      return 'Please enter a contact number.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid email address.';
    }
    return null;
  };

  const handleContinue = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Missing information', error);
      return;
    }

    const profile: UserProfile = {
      name: name.trim(),
      countryCode,
      phoneNumber: sanitizedPhone,
      email: email.trim().toLowerCase(),
      completedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onComplete(profile);
      // After parent has completed onboarding work (including wallet creation),
      // navigate to the main dashboard so the user does not see the Create Account flow.
      try {
        navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
      } catch {
        // ignore navigation failure — parent will also remove onboarding screen
      }
    } catch {
      Alert.alert('Error', 'Could not save your profile right now.');
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id="onboardingHeroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
          editable={!isSaving}
        />

        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.phoneRow}>
          <TouchableOpacity
            style={styles.countryBtn}
            onPress={() => setCountryModalVisible(true)}
            disabled={isSaving}>
            <Text style={styles.countryBtnText}>{countryCode}</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.phoneInput]}
            placeholder="Enter mobile number"
            placeholderTextColor={tokens.colors.textMuted}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            editable={!isSaving}
          />
        </View>

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={tokens.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isSaving}
        />

        <TouchableOpacity
          style={[styles.continueBtn, isSaving && styles.continueBtnDisabled]}
          onPress={() => {
            handleContinue().catch(() => {
              Alert.alert('Error', 'Unexpected onboarding error.');
            });
          }}
          disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueBtnText}>Continue</Text>
          )}
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
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 1,
    fontWeight: '800',
    fontSize: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
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
    color: tokens.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: tokens.colors.textPrimary,
    backgroundColor: '#fff',
    fontSize: 15,
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
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryBtnText: {
    color: tokens.colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  phoneInput: {
    flex: 1,
  },
  continueBtn: {
    marginTop: 20,
    backgroundColor: tokens.colors.accent,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    paddingVertical: 15,
  },
  continueBtnDisabled: {
    opacity: 0.7,
  },
  continueBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
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
    color: tokens.colors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
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
    color: tokens.colors.textPrimary,
    fontSize: 15,
  },
  countryCode: {
    color: tokens.colors.accent,
    fontWeight: '700',
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
