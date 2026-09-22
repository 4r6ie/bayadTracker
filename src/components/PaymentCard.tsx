import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/colors';
import type { Payment } from '@/types/payment';
import { formatCurrency } from '@/utils/currency';
import { formatDisplayDate } from '@/utils/date';
import { StatusBadge } from './StatusBadge';

interface PaymentCardProps {
  payment: Payment;
  onPress: () => void;
}

export function PaymentCard({ payment, onPress }: PaymentCardProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: Colors.background }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Text style={styles.payer} numberOfLines={1}>
            {payment.payer_name}
          </Text>
          <Text style={styles.description} numberOfLines={1}>
            {payment.description}
          </Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(payment.amount)}</Text>
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.date}>{formatDisplayDate(payment.payment_date)}</Text>
        <StatusBadge status={payment.status} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardPressed: {
    opacity: 0.7,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  info: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  payer: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});