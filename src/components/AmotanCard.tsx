import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { font, space } from '../theme/tokens';
import type { AmotanSummary } from '../types/amotan';
import { formatCents } from '../utils/amotanValidation';
import { formatDisplayDate } from '../utils/validation';
import { Card } from './ui/Card';
import { Pill } from './ui/Pill';
import { ProgressBar } from './ui/ProgressBar';

interface AmotanCardProps {
  amotan: AmotanSummary;
  /** Opens who paid / who has not. */
  onPress?: () => void;
  onLongPress?: () => void;
}

/** One amotan in the list: title, target, deadline and class progress. */
export function AmotanCard({ amotan, onPress, onLongPress }: AmotanCardProps) {
  const styles = useStyles();
  const { theme } = useTheme();
  const progress = amotan.studentCount > 0 ? amotan.paidCount / amotan.studentCount : 0;
  const done = amotan.studentCount > 0 && amotan.paidCount === amotan.studentCount;

  return (
    <Card
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={`${amotan.title}, ${formatCents(amotan.amountCents)} each. ${
        amotan.paidCount
      } of ${amotan.studentCount} students paid.`}
      accessibilityHint="Opens who paid and who has not. Long press to delete."
    >
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {amotan.title}
        </Text>
        {done ? <Pill label="Complete" tone="accent" icon="checkmark" /> : null}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.amount}>{formatCents(amotan.amountCents)} each</Text>
        <View style={styles.due}>
          <Ionicons name="calendar-outline" size={13} color={theme.colors.textSecondary} />
          <Text style={styles.dueText}>
            {amotan.dueDate ? formatDisplayDate(amotan.dueDate) : 'No deadline'}
          </Text>
        </View>
      </View>
      <View style={styles.progress}>
        <ProgressBar fraction={progress} />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.stat}>
          <Text style={styles.statStrong}>{amotan.paidCount}</Text> of {amotan.studentCount} paid
        </Text>
        <Text style={styles.stat}>
          <Text style={styles.statStrong}>{formatCents(amotan.collectedCents)}</Text> collected
        </Text>
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  title: {
    flex: 1,
    fontSize: font.subtitle,
    fontWeight: '700',
    color: t.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
  amount: {
    fontSize: font.body,
    fontWeight: '700',
    color: t.colors.accentText,
  },
  due: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  dueText: {
    fontSize: font.footnote,
    color: t.colors.textSecondary,
  },
  progress: {
    marginTop: space.md,
    marginBottom: space.xs,
  },
  stat: {
    fontSize: font.footnote,
    color: t.colors.textSecondary,
  },
  statStrong: {
    fontWeight: '700',
    color: t.colors.text,
  },
}));
