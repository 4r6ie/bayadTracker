import { useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors, Radius, Spacing } from '@/constants/colors';
import { PaymentService } from '@/services/paymentService';

const NO_EDGES = [] as const;

export default function SettingsScreen() {
  const [count, setCount] = useState(0);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const total = await PaymentService.countPayments();
      setCount(total);
    } catch {
      setCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleDeleteAll() {
    setConfirmVisible(false);
    setDeleting(true);
    try {
      await PaymentService.removeAllPayments();
      setCount(0);
      Alert.alert('Cleared', 'All payment records have been deleted.');
    } catch {
      Alert.alert('Error', 'Unable to delete payment records. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <ScreenContainer edges={NO_EDGES}>
        <View style={styles.card}>
          <Text style={styles.appName}>BayadTracker</Text>
          <Text style={styles.version}>
            Version {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
          <Text style={styles.tagline}>
            A simple payment-recording app that keeps your records on your device.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <Text style={styles.body}>
            All payment data is stored locally on this device using SQLite. The app
            works fully offline — no account or internet connection is required.
          </Text>
          <Text style={styles.stat}>
            {count} {count === 1 ? 'payment record' : 'payment records'} stored on this
            device.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <Text style={styles.body}>
            Amounts are entered and displayed in Philippine Pesos (₱). The peso symbol
            is never saved — only the numeric value is stored.
          </Text>
        </View>

        <View style={[styles.card, styles.dangerCard]}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <Text style={styles.body}>
            Permanently delete all payment records on this device.
          </Text>
          <View style={styles.dangerAction}>
            <AppButton
              label="Delete All Payments"
              variant="danger"
              onPress={() => setConfirmVisible(true)}
              loading={deleting}
              disabled={count === 0 && !deleting}
            />
          </View>
        </View>
      </ScreenContainer>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete All Payments?"
        message="Are you sure you want to delete every payment record? This action cannot be undone."
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  version: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  stat: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  dangerCard: {
    borderColor: Colors.danger,
  },
  dangerTitle: {
    color: Colors.danger,
  },
  dangerAction: {
    marginTop: Spacing.lg,
  },
});
