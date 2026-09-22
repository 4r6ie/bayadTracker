import { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/colors';

interface ScreenContainerProps extends PropsWithChildren {
  scroll?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  edges?: readonly Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ScreenContainer({
  children,
  scroll = true,
  style,
  contentContainerStyle,
  edges = ['bottom'],
  refreshing = false,
  onRefresh,
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Colors.primary}
                  colors={[Colors.primary]}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, style, contentContainerStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
});