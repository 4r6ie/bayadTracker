import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBadge } from '@/components/StatusBadge';
import { Colors, Radius, Spacing } from '@/constants/colors';
import { PaymentService } from '@/services/paymentService';
import type { Payment } from '@/types/payment';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime, formatDisplayDate } from '@/utils/date';

export default function PaymentDetailsScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setLoaded(true);
      setPayment(null);
      return;
    }
    try {
      setError(false);
      const record = await PaymentService.getPayment(id);
      setPayment(record);
    } catch {
      setError(true);
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleDelete() {
    setConfirmVisible(false);
    setDeleting(true);
    try {
      const deleted = await PaymentService.removePayment(id);
      Alert.alert(
        deleted ? 'Payment Deleted' : 'Payment Not Found',
        deleted
          ? 'The payment was deleted successfully.'
          : 'This payment may have already been deleted.',
        [{ text: 'OK', onPress: () => router.replace('/payments') }]
      );
    } catch {
      Alert.alert('Error', 'Unable to delete the payment. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <ErrorState
          title="Unable to load payment"
          message="Something went wrong while reading the database."
          actionLabel="Try Again"
          onAction={load}
        />
      </ScreenContainer>
    );
  }

  if (!payment) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Payment not found"
          message="This payment may have been deleted."
        />
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <Text style={styles.payerName}>{payment.payer_name}</Text>
              <Text style={styles.description}>{payment.description}</Text>
            </View>
            <StatusBadge status={payment.status} />
          </View>

          <View style={styles.divider} />

          <DetailRow label="Amount" value={formatCurrency(payment.amount)} />
          <DetailRow label="Payment Date" value={formatDisplayDate(payment.payment_date)} />
          <DetailRow label="Status" value={payment.status} />

          {payment.notes ? (
            <DetailRow label="Notes" value={payment.notes} last />
          ) : null}

          <Text style={styles.timestamps}>
            Created: {formatDateTime(payment.created_at)}
            {'\n'}
            Updated: {formatDateTime(payment.updated_at)}
          </Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.action}>
            <AppButton
              label="Edit"
              variant="outline"
              onPress={() => router.push(`/payments/edit?id=${payment.id}`)}
            />
          </View>
          <View style={styles.action}>
            <AppButton
              label="Delete"
              variant="danger"
              onPress={() => setConfirmVisible(true)}
              loading={deleting}
            />
          </View>
        </View>
      </ScreenContainer>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Payment?"
        message="Are you sure you want to delete this payment? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </>
  );
}

function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  payerName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  row: {
    marginBottom: Spacing.lg,
  },
  rowLast: {
    marginBottom: 0,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  timestamps: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.xl,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  action: {
    flex: 1,
  },
});