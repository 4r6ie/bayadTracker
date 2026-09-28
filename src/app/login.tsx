import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignInError, useAuth } from '../auth/AuthProvider';

/**
 * Sign-in for the mayor and the secretary. Accounts are created in the
 * Supabase dashboard; there is no sign-up here on purpose.
 */
export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    Keyboard.dismiss();
    setError(null);
    setBusy(true);
    try {
      // On success the root layout swaps to the app screens by itself.
      await signIn(email, password);
    } catch (signInError) {
      if (__DEV__) {
        console.error('Sign-in failed', signInError);
      }
      setError(
        signInError instanceof SignInError
          ? signInError.message
          : 'Could not sign in. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>BayadTracker</Text>
          <Text style={styles.subtitle}>
            Sign in once with internet. After that the app works offline and
            syncs when you are back online.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#8A948E"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="username"
              returnKeyType="next"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#8A948E"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSignIn}
              style={styles.input}
            />
          </View>

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          <Pressable
            style={[styles.button, busy && styles.disabled]}
            onPress={handleSignIn}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={styles.buttonLabel}>{busy ? 'Signing in...' : 'Sign In'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#127A52',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5B6660',
    marginBottom: 32,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17211C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#17211C',
    minHeight: 50,
  },
  error: {
    color: '#C63B3B',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#127A52',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
