import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PaymentStatus } from '../types/amotan';
import { formatCents } from '../utils/amotanValidation';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Paid',
  partial: 'Partly paid',
  unpaid: 'Not paid',
};

/**
 * The checkbox: empty (not paid), half-filled amber (partly paid) or a green
 * check (paid). Drawn with Views so it looks the same on every phone.
 */
function StatusCheck({ status }: { status: PaymentStatus }) {
  return (
    <View
      style={[
        styles.check,
        status === 'paid' && styles.checkPaid,
        status === 'partial' && styles.checkPartial,
      ]}
    >
      {status === 'paid' ? <Text style={styles.checkMark}>✓</Text> : null}
      {status === 'partial' ? <View style={styles.checkHalf} /> : null}
    </View>
  );
}

interface ChecklistRowProps {
  /** The amotan title (student checklist) or student name (amotan roster). */
  title: string;
  subtitle?: string;
  paidCents: number;
  targetCents: number;
  status: PaymentStatus;
  /** Opens the payment history for this student + amotan. */
  onPress: () => void;
  /** Tapping the checkbox of an unpaid / partly paid row: pay the rest. */
  onCheck: () => void;
}

/**
 * One line of a checklist, used by both details screens: checkbox, name,
 * "₱50.00 of ₱150.00" and a progress bar.
 */
export function ChecklistRow({
  title,
  subtitle,
  paidCents,
  targetCents,
  status,
  onPress,
  onCheck,
}: ChecklistRowProps) {
  const progress = targetCents > 0 ? Math.min(paidCents / targetCents, 1) : 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${STATUS_LABEL[status]}. ${formatCents(
        paidCents
      )} of ${formatCents(targetCents)}.`}
      accessibilityHint="Opens the payment history"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Pressable
        onPress={status === 'paid' ? onPress : onCheck}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: status === 'paid' ? true : status === 'partial' ? 'mixed' : false }}
        accessibilityLabel={
          status === 'paid' ? `${title} is paid` : `Mark ${title} as fully paid`
        }
        hitSlop={10}
        style={styles.checkHit}
      >
        <StatusCheck status={status} />
      </Pressable>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text
            style={[
              styles.amount,
              status === 'paid' && styles.amountPaid,
              status === 'partial' && styles.amountPartial,
            ]}
          >
            {formatCents(paidCents)} / {formatCents(targetCents)}
          </Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              status === 'partial' && styles.fillPartial,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  checkHit: {
    marginRight: 12,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#B9C4BE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkPaid: {
    borderColor: '#127A52',
    backgroundColor: '#127A52',
  },
  checkPartial: {
    borderColor: '#D08A00',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 20,
  },
  checkHalf: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: '#F2C14E',
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#17211C',
    marginRight: 8,
  },
  amount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B6660',
  },
  amountPaid: {
    color: '#127A52',
  },
  amountPartial: {
    color: '#8A5A00',
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EDF1EE',
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#127A52',
  },
  fillPartial: {
    backgroundColor: '#F2C14E',
  },
  subtitle: {
    fontSize: 12,
    color: '#5B6660',
    marginTop: 6,
  },
});
