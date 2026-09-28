import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { font, space } from '../theme/tokens';
import type { StudentSummary } from '../types/amotan';
import { formatCents } from '../utils/amotanValidation';
import { Avatar } from './ui/Avatar';
import { Card } from './ui/Card';
import { Pill } from './ui/Pill';

interface StudentCardProps {
  student: StudentSummary;
  /** Opens the student's checklist. */
  onPress?: () => void;
  onLongPress?: () => void;
}

/** One student in the list: avatar, name, and what they still owe. */
export function StudentCard({ student, onPress, onLongPress }: StudentCardProps) {
  const styles = useStyles();
  const { theme } = useTheme();
  const hasAmotan = student.amotanCount > 0;
  const settled = hasAmotan && student.owedCents === 0;
  const detail = hasAmotan
    ? `${student.paidCount} of ${student.amotanCount} amotan paid`
    : 'No amotan yet';

  return (
    <Card
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={`${student.name}. ${
        settled ? 'All paid' : hasAmotan ? `Owes ${formatCents(student.owedCents)}` : detail
      }.`}
      accessibilityHint="Opens the checklist. Long press to delete."
      style={styles.row}
    >
      <Avatar name={student.name} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {student.name}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      {settled ? (
        <Pill label="All paid" tone="accent" icon="checkmark" />
      ) : hasAmotan ? (
        <Pill label={`Owes ${formatCents(student.owedCents)}`} tone="warning" />
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: font.callout,
    fontWeight: '700',
    color: t.colors.text,
  },
  detail: {
    fontSize: font.footnote,
    color: t.colors.textSecondary,
    marginTop: 2,
  },
}));
