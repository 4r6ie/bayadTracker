import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AmotanSummary } from '../types/amotan';
import { formatCents } from '../utils/amotanValidation';
import { formatDisplayDate } from '../utils/validation';

interface AmotanCardProps {
  amotan: AmotanSummary;
  /** Opens who paid / who has not. */
  onPress?: () => void;
  onLongPress?: () => void;
}

/** One amotan in the list: title, target, deadline and class progress. */
export function AmotanCard({ amotan, onPress, onLongPress }: AmotanCardProps) {
  const progress =
    amotan.studentCount > 0 ? amotan.paidCount / amotan.studentCount : 0;
  const done = amotan.studentCount > 0 && amotan.paidCount === amotan.studentCount;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${amotan.title}. ${amotan.paidCount} of ${amotan.studentCount} students paid.`}
      accessibilityHint="Opens who paid and who has not. Long press to delete."
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {amotan.title}
        </Text>
        <Text style={styles.amount}>{formatCents(amotan.amountCents)}</Text>
      </View>
      <Text style={styles.dueDate}>
        {amotan.dueDate ? `Due ${formatDisplayDate(amotan.dueDate)}` : 'No deadline'}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, done && styles.metaDone]}>
          {amotan.paidCount} of {amotan.studentCount} paid
        </Text>
        <Text style={styles.meta}>{formatCents(amotan.collectedCents)} collected</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#17211C',
    marginRight: 8,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#127A52',
  },
  dueDate: {
    fontSize: 13,
    color: '#5B6660',
    marginTop: 2,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EDF1EE',
    marginTop: 10,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#127A52',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  meta: {
    fontSize: 12,
    color: '#5B6660',
  },
  metaDone: {
    color: '#127A52',
    fontWeight: '700',
  },
});
