import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    // `Swipeable` on the payment rows only responds to gestures inside a
    // GestureHandlerRootView. expo-router does not mount one for the native
    // stack, so the app provides it here, once, at the root.
    <GestureHandlerRootView style={styles.root}>
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
