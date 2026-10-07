import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { font, radius, space, TOUCH } from '../theme/tokens';
import type { PaymentStatus } from '../types/amotan';
import { formatCents } from '../utils/amotanValidation';
import { Avatar } from './ui/Avatar';
import { StatusPill } from './ui/Pill';
import { ProgressBar } from './ui/ProgressBar';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Paid',
  partial: 'Partly paid',
  unpaid: 'Not paid',
};

/**
 * The checkbox: empty (not paid), half-filled (partly paid) or a check
 * (paid). Drawn with Views so it looks the same on every phone.
 */
function StatusCheck({ status }: { status: PaymentStatus }) {
  const styles = useStyles();
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.check,
        status === 'paid' && styles.checkPaid,
        status === 'partial' && styles.checkPartial,
      ]}
    >
      {status === 'paid' ? (
        <Ionicons name="checkmark" size={18} color={theme.colors.onAccent} />
      ) : null}
      {status === 'partial' ? <View style={styles.checkHalf} /> : null}
    </View>
  );
}

interface ChecklistRowProps {
  /** The amotan title (student checklist) or student name (amotan roster). */
  title: string;
  subtitle?: string;
  /** Show an avatar for this name (the roster lists people). */
  avatarName?: string;
  paidCents: number;
  targetCents: number;
  status: PaymentStatus;
  /** Opens the payment history for this student + amotan. */
  onPress: () => void;
  /** Tapping the checkbox of an unpaid / partly paid row: pay the rest. */
  onCheck: () => void;
  /** Draws a divider above the row (every row but the first in a card). */
  divider?: boolean;
}

/**
 * One line of a checklist, used by both details screens: checkbox, name,
 * status and, when partly paid, a progress bar.
 */
export function ChecklistRow({
  title,
  subtitle,
  avatarName,
  paidCents,
  targetCents,
  status,
  onPress,
  onCheck,
  divider = false,
}: ChecklistRowProps) {
  const styles = useStyles();
  const progress = targetCents > 0 ? Math.min(paidCents / targetCents, 1) : 0;
  const leftCents = Math.max(targetCents - paidCents, 0);
  const detail =
    subtitle ??
    (status === 'paid' ? `Paid ${formatCents(paidCents)}` : `${formatCents(leftCents)} left`);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${STATUS_LABEL[status]}. ${formatCents(
        paidCents
      )} of ${formatCents(targetCents)}.`}
      accessibilityHint="Opens the payment history"
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
    >
      <Pressable
        onPress={status === 'paid' ? onPress : onCheck}
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: status === 'paid' ? true : status === 'partial' ? 'mixed' : false,
        }}
        accessibilityLabel={
          status === 'paid' ? `${title} is paid` : `Mark ${title} as fully paid`
        }
        hitSlop={8}
        style={styles.checkHit}
      >
        <StatusCheck status={status} />
      </Pressable>
      {avatarName ? <Avatar name={avatarName} size={34} /> : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {status === 'partial' ? (
          <View style={styles.progress}>
            <ProgressBar fraction={progress} tone="warning" height={4} />
          </View>
        ) : null}
        <Text style={[styles.detail, status !== 'paid' && !subtitle && styles.detailOwed]}>
          {detail}
        </Text>
      </View>
      <StatusPill
        status={status}
        partialLabel={`${formatCents(paidCents)} / ${formatCents(targetCents)}`}
      />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.md,
    minHeight: TOUCH + 16,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: t.colors.divider,
  },
  pressed: {
    backgroundColor: t.colors.surfaceMuted,
  },
  checkHit: {
    padding: 2,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkPaid: {
    borderColor: t.colors.accent,
    backgroundColor: t.colors.accent,
  },
  checkPartial: {
    borderColor: t.colors.warning,
  },
  checkHalf: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: t.colors.warning,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: font.callout,
    fontWeight: '700',
    color: t.colors.text,
  },
  progress: {
    marginTop: space.xs + 2,
    marginBottom: 2,
  },
  detail: {
    fontSize: font.footnote,
    color: t.colors.textSecondary,
    marginTop: 2,
  },
  detailOwed: {
    color: t.colors.warningText,
  },
}));
