import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../auth/AuthProvider';
import { startAutoSync } from '../sync/syncManager';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';

function RootNavigator() {
  const { auth } = useAuth();
  const { theme } = useTheme();
  const canUseApp = auth.status === 'signedIn' || auth.status === 'localOnly';

  // Sync in the background for as long as someone is signed in.
  useEffect(() => {
    if (auth.status !== 'signedIn') {
      return;
    }
    return startAutoSync();
  }, [auth.status]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerShadowVisible: false,
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Protected guard={canUseApp}>
        {/* The tabs draw their own large titles. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="student/[id]" options={{ title: '' }} />
        <Stack.Screen name="amotan/[id]" options={{ title: '' }} />
        <Stack.Screen name="record-payment" options={{ title: 'Payments' }} />
        <Stack.Screen name="add-student" options={{ title: 'New student' }} />
        <Stack.Screen name="edit-student" options={{ title: 'Edit student' }} />
        <Stack.Screen name="add-amotan" options={{ title: 'New amotan' }} />
        <Stack.Screen name="edit-amotan" options={{ title: 'Edit amotan' }} />
      </Stack.Protected>
      <Stack.Protected guard={!canUseApp}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    // Gesture-handler components only respond inside a GestureHandlerRootView,
    // which expo-router does not mount for the native stack, so the app
    // provides it here, once, at the root.
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
