import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Payment } from '../types/payment';
import { formatAmount, formatDisplayDate } from '../utils/validation';

interface PaymentCardProps {
  payment: Payment;
  onPress: () => void;
}

/** One payment in the list. Values are rendered as plain text only. */
export function PaymentCard({ payment, onPress }: PaymentCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Text style={styles.payer} numberOfLines={1}>
            {payment.payerName}
          </Text>
          <Text style={styles.description} numberOfLines={1}>
            {payment.description}
          </Text>
        </View>
        <Text style={styles.amount}>{formatAmount(payment.amount)}</Text>
      </View>
      <Text style={styles.date}>{formatDisplayDate(payment.paymentDate)}</Text>
    </Pressable>
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
  pressed: {
    opacity: 0.7,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  info: {
    flex: 1,
    marginRight: 16,
  },
  payer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17211C',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#5B6660',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C5C3E',
  },
  date: {
    fontSize: 13,
    color: '#8A948E',
  },
});
