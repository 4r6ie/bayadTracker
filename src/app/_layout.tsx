import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerShadowVisible: false,
          headerTintColor: '#17211C',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#F4F6F5' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'BayadTracker' }} />
        <Stack.Screen name="add-payment" options={{ title: 'Add Payment' }} />
        <Stack.Screen
          name="payment/[id]"
          options={{ title: 'Payment Details' }}
        />
        <Stack.Screen name="payment/edit" options={{ title: 'Edit Payment' }} />
      </Stack>
    </>
  );
}
