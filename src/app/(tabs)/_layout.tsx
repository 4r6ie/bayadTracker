import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Filled icon for the active tab, outline for the rest. */
function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({
    color,
    size,
    focused,
  }: {
    color: ColorValue;
    size: number;
    focused: boolean;
  }) {
    return <Ionicons name={focused ? active : inactive} color={color} size={size} />;
  }
  return TabIcon;
}

// Created once, not per render, so the icons are not remounted on every
// theme change.
const HomeIcon = tabIcon('stats-chart', 'stats-chart-outline');
const StudentsIcon = tabIcon('people', 'people-outline');
const AmotanIcon = tabIcon('wallet', 'wallet-outline');
const AccountIcon = tabIcon('person-circle', 'person-circle-outline');

export default function TabsLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={{
        // Each tab draws its own large title (ScreenHeader).
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabActive,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBorder,
        },
        tabBarLabelStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: HomeIcon }} />
      <Tabs.Screen name="students" options={{ title: 'Students', tabBarIcon: StudentsIcon }} />
      <Tabs.Screen name="amotan" options={{ title: 'Amotan', tabBarIcon: AmotanIcon }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: AccountIcon }} />
    </Tabs>
  );
}
