import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';

import {RootStackParamList} from '../types';
import {tokens} from '../theme/tokens';

type NavProp = StackNavigationProp<RootStackParamList>;

export default function SendScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const [amount, setAmount] = useState('0');

  React.useEffect(() => {
    console.log('[screen] SendScreen mounted');
  }, []);

  const handleKeypadTap = useCallback((value: string) => {
    setAmount(current => {
      if (value === 'back') {
        const next = current.slice(0, -1);
        return next.length === 0 ? '0' : next;
      }

      if (value === '.') {
        if (current.includes('.')) {
          return current;
        }
        return `${current}.`;
      }

      if (current === '0') {
        return value;
      }

      const [, decimals = ''] = current.split('.');
      if (current.includes('.') && decimals.length >= 6) {
        return current;
      }

      return `${current}${value}`;
    });
  }, []);

  const handlePay = useCallback(() => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Validation Error', 'Enter an amount greater than 0.');
      return;
    }

    navigation.navigate('PayAddress', {amount});
  }, [amount, navigation]);

  const amountDisplay = amount === '0' ? '$0' : `$${amount}`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id="sendHeroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#3f8cff" />
                <Stop offset="55%" stopColor="#4f7ef4" />
                <Stop offset="100%" stopColor="#6d5ce8" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#sendHeroGradient)" />
          </Svg>

          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />

          <Text style={styles.kicker}>AMOUNT</Text>
          <Text style={styles.amount}>{amountDisplay}</Text>
          <Text style={styles.tokenLabel}>How much do you want to pay?</Text>
        </View>

        <View style={styles.keypadWrap}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'].map(key => (
            <TouchableOpacity key={key} style={styles.key} onPress={() => handleKeypadTap(key)}>
              <Text style={styles.keyText}>{key === 'back' ? '⌫' : key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
          <Text style={styles.payBtnText}>Pay</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.page,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    borderRadius: tokens.radius.lg,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowTop: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 999,
    top: -58,
    right: -34,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroGlowBottom: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 999,
    bottom: -44,
    left: -20,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  kicker: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 11,
  },
  amount: {
    color: '#ffffff',
    fontSize: 62,
    fontWeight: '900',
    marginTop: 8,
  },
  tokenLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  keypadWrap: {
    marginTop: 6,
    marginBottom: 20,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  key: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: tokens.radius.md,
  },
  keyText: {
    color: tokens.colors.textPrimary,
    fontSize: 33,
    fontWeight: '500',
  },
  payBtn: {
    backgroundColor: tokens.colors.accent,
    borderRadius: tokens.radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 20,
  },
});