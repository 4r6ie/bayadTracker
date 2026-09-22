import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius } from '@/constants/colors';
import type { PaymentStatus } from '@/types/payment';

const STATUS_STYLES: Record<
  PaymentStatus,
  { background: string; text: string }
> = {
  PAID: { background: Colors.primarySoft, text: Colors.primaryDark },
  PENDING: { background: Colors.warningSoft, text: Colors.warning },
  CANCELLED: { background: Colors.mutedSoft, text: Colors.muted },
};

interface StatusBadgeProps {
  status: PaymentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const palette = STATUS_STYLES[status];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.round,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});