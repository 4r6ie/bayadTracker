import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Amotan } from '../types/amotan';
import { formatCents } from '../utils/amotanValidation';
import { formatDisplayDate } from '../utils/validation';

interface AmotanCardProps {
  amotan: Amotan;
  onPress?: () => void;
  /** Long press deletes, like the student rows. */
  onLongPress?: () => void;
}

/** One amotan in the list: title, target per student and deadline. */
export function AmotanCard({ amotan, onPress, onLongPress }: AmotanCardProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={amotan.title}
      accessibilityHint="Long press to delete"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.title} numberOfLines={1}>
        {amotan.title}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.amount}>{formatCents(amotan.amountCents)}</Text>
        <Text style={styles.dueDate}>
          {amotan.dueDate
            ? `Due ${formatDisplayDate(amotan.dueDate)}`
            : 'No deadline'}
        </Text>
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
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#17211C',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#127A52',
  },
  dueDate: {
    fontSize: 13,
    color: '#5B6660',
  },
});
