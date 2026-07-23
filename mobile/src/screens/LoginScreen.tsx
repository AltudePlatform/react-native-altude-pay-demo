import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useAuthStore} from '../store/authStore';
import {useWalletStore} from '../store/walletStore';
import {generateDemoWallet} from '../services/solana';

export default function LoginScreen(): React.JSX.Element {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore(s => s.login);
  const setWallet = useWalletStore(s => s.setWallet);
  const wallet = useWalletStore(s => s.wallet);

  const handleLogin = async () => {
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      Alert.alert('Invalid username', 'Please enter at least 2 characters.');
      return;
    }

    setLoading(true);
    try {
      // Auto-generate a demo wallet if none exists
      if (!wallet) {
        const demoWallet = generateDemoWallet();
        await setWallet(demoWallet);
      }
      await login(trimmed);
    } catch (err) {
      Alert.alert('Error', 'Could not log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.logo}>◎</Text>
        <Text style={styles.title}>AltudePay</Text>
        <Text style={styles.subtitle}>Solana USDC Payments Demo</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Get Started</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>Running on Solana Devnet</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#9945FF',
    marginBottom: 48,
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  label: {
    color: '#ccc',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#1e1e30',
    borderWidth: 1,
    borderColor: '#3a3a55',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#9945FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  note: {
    color: '#555',
    fontSize: 12,
    marginTop: 40,
  },
});
