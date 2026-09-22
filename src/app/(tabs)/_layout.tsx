import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Colors, Spacing } from '@/constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerShadowVisible: false,
        headerTintColor: Colors.text,
        headerTitleStyle: styles.headerTitle,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="payments" options={{ title: 'Payments' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontWeight: '700',
  },
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    paddingBottom: Spacing.xs,
  },
});
