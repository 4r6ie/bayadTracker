import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles } from '../../theme/ThemeProvider';
import { font, space } from '../../theme/tokens';

/**
 * The big title at the top of each tab. The tabs hide the navigation header
 * and draw this instead, inside the scroll view, so the title scrolls away
 * and leaves room for the list.
 */
export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screenHeader, { paddingTop: insets.top + space.md }]}>
      <View style={styles.topRow}>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle ?? ''}
        </Text>
        {right}
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

/** A small label above a group of cards, with an optional action. */
export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  screenHeader: {
    paddingBottom: space.md,
  },
  topRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  subtitle: {
    flex: 1,
    fontSize: font.body,
    color: t.colors.textSecondary,
  },
  title: {
    fontSize: font.largeTitle,
    fontWeight: '800',
    color: t.colors.text,
    letterSpacing: -0.5,
    marginTop: space.xs,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  sectionTitle: {
    fontSize: font.footnote,
    fontWeight: '700',
    color: t.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
}));
