import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../auth/AuthProvider';
import { startAutoSync } from '../sync/syncManager';

function RootNavigator() {
  const { auth } = useAuth();
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
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerShadowVisible: false,
        headerTintColor: '#17211C',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#F4F6F5' },
      }}
    >
      <Stack.Protected guard={canUseApp}>
        <Stack.Screen name="index" options={{ title: 'Students' }} />
        <Stack.Screen name="add-student" options={{ title: 'Add Student' }} />
        <Stack.Screen name="amotan/index" options={{ title: 'Amotan' }} />
        <Stack.Screen name="add-amotan" options={{ title: 'Add Amotan' }} />
        <Stack.Screen name="add-payment" options={{ title: 'Add Payment' }} />
        <Stack.Screen
          name="payment/[id]"
          options={{ title: 'Payment Details' }}
        />
        <Stack.Screen name="payment/edit" options={{ title: 'Edit Payment' }} />
      </Stack.Protected>
      <Stack.Protected guard={!canUseApp}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    // `Swipeable` on the payment rows only responds to gestures inside a
    // GestureHandlerRootView. expo-router does not mount one for the native
    // stack, so the app provides it here, once, at the root.
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
