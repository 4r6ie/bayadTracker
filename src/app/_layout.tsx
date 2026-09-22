import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerShadowVisible: false,
          headerTintColor: Colors.text,
          headerTitleStyle: styles.headerTitle,
          contentStyle: { backgroundColor: Colors.background },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="payments/add" options={{ title: 'Add Payment' }} />
        <Stack.Screen name="payments/[id]" options={{ title: 'Payment Details' }} />
        <Stack.Screen name="payments/edit" options={{ title: 'Edit Payment' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontWeight: '700',
  },
});