import { StyleSheet, Text, View } from 'react-native';
import type { PaymentSummary } from '../database/paymentRepository';
import { formatAmount } from '../utils/validation';

interface PaymentSummaryCardProps {
  summary: PaymentSummary;
}

/**
 * The running total shown at the top of the payments list.
 *
 * Rendered even when nothing has been saved yet (`₱0.00`), so the header does
 * not change height between the empty and populated states.
 */
export function PaymentSummaryCard({ summary }: PaymentSummaryCardProps) {
  const countLabel =
    summary.count === 1 ? '1 payment recorded' : `${summary.count} payments recorded`;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Total Paid</Text>
      <Text style={styles.total}>{formatAmount(summary.total)}</Text>
      <Text style={styles.count}>{countLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E7E3',
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#5B6660',
    marginBottom: 2,
  },
  total: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C5C3E',
    marginBottom: 2,
  },
  count: {
    fontSize: 13,
    color: '#8A948E',
  },
});
