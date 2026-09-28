import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignInError, useAuth } from '../auth/AuthProvider';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Controls';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { font, radius, space } from '../theme/tokens';

/**
 * Sign-in for the mayor and the secretary. Accounts are created in the
 * Supabase dashboard; there is no sign-up here on purpose.
 */
export default function LoginScreen() {
  const styles = useStyles();
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    Keyboard.dismiss();
    setError(undefined);
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
          : "Couldn't sign in. Try again."
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name="wallet" size={34} color={theme.colors.onAccent} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            BayadTracker
          </Text>
          <Text style={styles.subtitle}>
            {"Sign in once with internet. After that the app works offline and syncs when you're back online."}
          </Text>

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="mayor@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            returnKeyType="next"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleSignIn}
            error={error}
          />
          <Button
            label="Sign in"
            icon="log-in-outline"
            busy={busy}
            busyLabel="Signing in…"
            onPress={handleSignIn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  safeArea: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: space.xl,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg + 4,
    backgroundColor: t.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  title: {
    fontSize: font.largeTitle,
    fontWeight: '800',
    color: t.colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: font.body,
    lineHeight: 22,
    color: t.colors.textSecondary,
    marginTop: space.sm,
    marginBottom: space.xxl,
  },
}));
