import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import type { PaymentStatus } from '../../types/amotan';
import { font, radius, space } from '../../theme/tokens';

export type PillTone = 'accent' | 'warning' | 'neutral' | 'danger';

interface PillProps {
  label: string;
  tone?: PillTone;
  icon?: ComponentProps<typeof Ionicons>['name'];
}

/** A small rounded label: statuses, sync state, "Owes ₱60". */
export function Pill({ label, tone = 'neutral', icon }: PillProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [background, color] =
    tone === 'accent'
      ? [c.accentTint, c.accentText]
      : tone === 'warning'
        ? [c.warningTint, c.warningText]
        : tone === 'danger'
          ? [c.dangerTint, c.danger]
          : [c.neutralTint, c.neutralText];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        alignSelf: 'flex-start',
        backgroundColor: background,
        borderRadius: radius.pill,
        paddingHorizontal: space.sm + 2,
        paddingVertical: 3,
      }}
    >
      {icon ? <Ionicons name={icon} size={13} color={color} /> : null}
      <Text style={{ color, fontSize: font.caption, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

/**
 * Payment status as words, not just a color, so it still reads for
 * color-blind users and on a sunlit screen.
 */
export function StatusPill({
  status,
  partialLabel,
}: {
  status: PaymentStatus;
  /** Shown for partly paid rows, e.g. "₱40 / ₱100". */
  partialLabel?: string;
}) {
  if (status === 'paid') {
    return <Pill label="Paid" tone="accent" icon="checkmark" />;
  }
  if (status === 'partial') {
    return <Pill label={partialLabel ?? 'Partly paid'} tone="warning" />;
  }
  return <Pill label="Not paid" tone="neutral" />;
}
