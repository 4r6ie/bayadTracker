import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StudentSummary } from '../types/amotan';
import { formatCents } from '../utils/amotanValidation';

interface StudentCardProps {
  student: StudentSummary;
  /** Opens the student's checklist. */
  onPress?: () => void;
  onLongPress?: () => void;
}

function standing(student: StudentSummary): { text: string; settled: boolean } {
  if (student.amotanCount === 0) {
    return { text: 'No amotan yet', settled: true };
  }
  if (student.owedCents === 0) {
    return { text: 'All paid', settled: true };
  }
  return {
    text: `Owes ${formatCents(student.owedCents)} · ${student.paidCount} of ${student.amotanCount} paid`,
    settled: false,
  };
}

/** One student in the list: initial, name, and what they still owe. */
export function StudentCard({ student, onPress, onLongPress }: StudentCardProps) {
  const initial = student.name.charAt(0).toUpperCase();
  const { text, settled } = standing(student);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${student.name}. ${text}.`}
      accessibilityHint="Opens the checklist. Long press to delete."
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarLabel}>{initial}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {student.name}
        </Text>
        <Text style={[styles.standing, settled && styles.settled]} numberOfLines={1}>
          {text}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#127A52',
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#17211C',
  },
  standing: {
    fontSize: 13,
    color: '#8A5A00',
    marginTop: 2,
  },
  settled: {
    color: '#127A52',
  },
  chevron: {
    fontSize: 22,
    color: '#B9C4BE',
    marginLeft: 8,
  },
});
