import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { ScreenHeader, SectionHeader } from '../../components/ui/Headers';
import { Pill } from '../../components/ui/Pill';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { routes } from '../../constants/routes';
import {
  getAmotanSummaries,
  getRecentPayments,
  getStudentSummaries,
} from '../../database/amotanPaymentRepository';
import { syncNow } from '../../sync/syncManager';
import { useReloadOnSync } from '../../sync/useReloadOnSync';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { font, radius, space } from '../../theme/tokens';
import type { AmotanSummary, RecentPayment, StudentSummary } from '../../types/amotan';
import { formatCents } from '../../utils/amotanValidation';
import { formatDisplayDate } from '../../utils/validation';

const TOP_OWED = 5;
const RECENT = 10;

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * The totals the mayor and secretary ask for most: how much came in overall,
 * per amotan, who owes the most, and the latest payments.
 *
 * Built from the same summary queries as the Students and Amotan tabs, so
 * every number here matches what those screens show.
 */
export default function DashboardScreen() {
  const styles = useStyles();
  const { theme } = useTheme();
  const [amotanList, setAmotanList] = useState<AmotanSummary[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [recent, setRecent] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextAmotan, nextStudents, nextRecent] = await Promise.all([
        getAmotanSummaries(),
        getStudentSummaries(),
        getRecentPayments(RECENT),
      ]);
      setAmotanList(nextAmotan);
      setStudents(nextStudents);
      setRecent(nextRecent);
      setFailed(false);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load dashboard', error);
      }
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  useReloadOnSync(load);

  async function handleRefresh() {
    setRefreshing(true);
    await syncNow();
    await load();
    setRefreshing(false);
  }

  if (loading) {
    return <LoadingState />;
  }
  if (failed) {
    return (
      <ErrorState
        message="Couldn't load the dashboard."
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );
  }

  // All amounts are integer centavos, so these sums are exact.
  const expectedCents = amotanList.reduce(
    (sum, amotan) => sum + amotan.amountCents * amotan.studentCount,
    0
  );
  const collectedCents = amotanList.reduce((sum, amotan) => sum + amotan.collectedCents, 0);
  // From the per-student totals, so an overpayment by one student never
  // hides what another still owes.
  const outstandingCents = students.reduce((sum, student) => sum + student.owedCents, 0);
  const settledFraction =
    expectedCents > 0 ? (expectedCents - outstandingCents) / expectedCents : 0;
  const percent = Math.round(settledFraction * 100);
  const fullyPaidStudents = students.filter(
    (student) => student.amotanCount > 0 && student.owedCents === 0
  ).length;
  const topOwed = students
    .filter((student) => student.owedCents > 0)
    .sort((a, b) => b.owedCents - a.owedCents)
    .slice(0, TOP_OWED);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.accent}
          colors={[theme.colors.accent]}
        />
      }
    >
      <ScreenHeader title="Dashboard" subtitle={todayLabel()} right={<SyncStatusBar />} />

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Total collected</Text>
        <Text style={styles.heroValue}>{formatCents(collectedCents)}</Text>
        <Text style={styles.heroDetail}>
          of {formatCents(expectedCents)} expected{expectedCents > 0 ? ` · ${percent}%` : ''}
        </Text>
        <View style={styles.heroProgress}>
          <ProgressBar fraction={settledFraction} tone="hero" height={8} />
        </View>
      </View>

      <View style={styles.tiles}>
        <StatTile
          icon="hourglass-outline"
          tone="warning"
          value={formatCents(outstandingCents)}
          label="still to collect"
        />
        <StatTile
          icon="people-outline"
          tone="accent"
          value={`${fullyPaidStudents} / ${students.length}`}
          label="students fully paid"
        />
      </View>

      {amotanList.length === 0 || students.length === 0 ? (
        <EmptyState
          icon="stats-chart-outline"
          title="Your totals show up here"
          message="Add your students and your first amotan to start tracking."
        />
      ) : null}

      {amotanList.length > 0 ? (
        <>
          <SectionHeader title="Per amotan" />
          <Card padded={false}>
            {amotanList.map((amotan, index) => {
              const expected = amotan.amountCents * amotan.studentCount;
              return (
                <Pressable
                  key={amotan.id}
                  onPress={() =>
                    router.push({ pathname: routes.amotanDetails, params: { id: amotan.id } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${amotan.title}. ${formatCents(
                    amotan.collectedCents
                  )} of ${formatCents(expected)} collected.`}
                  style={({ pressed }) => [
                    styles.listRow,
                    styles.column,
                    index > 0 && styles.divider,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {amotan.title}
                    </Text>
                    <Text style={styles.rowAmount}>
                      {formatCents(amotan.collectedCents)}
                      <Text style={styles.rowAmountOf}> / {formatCents(expected)}</Text>
                    </Text>
                  </View>
                  <View style={styles.rowProgress}>
                    <ProgressBar
                      fraction={amotan.studentCount > 0 ? amotan.paidCount / amotan.studentCount : 0}
                    />
                  </View>
                  <Text style={styles.rowMeta}>
                    {amotan.paidCount} of {amotan.studentCount} paid
                    {amotan.dueDate ? ` · due ${formatDisplayDate(amotan.dueDate)}` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </Card>
        </>
      ) : null}

      {topOwed.length > 0 ? (
        <>
          <SectionHeader title="Owes the most" />
          <Card padded={false}>
            {topOwed.map((student, index) => (
              <Pressable
                key={student.id}
                onPress={() =>
                  router.push({ pathname: routes.studentDetails, params: { id: student.id } })
                }
                accessibilityRole="button"
                accessibilityLabel={`${student.name} owes ${formatCents(student.owedCents)}`}
                style={({ pressed }) => [
                  styles.listRow,
                  index > 0 && styles.divider,
                  pressed && styles.pressed,
                ]}
              >
                <Avatar name={student.name} size={36} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {student.name}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {student.paidCount} of {student.amotanCount} paid
                  </Text>
                </View>
                <Pill label={formatCents(student.owedCents)} tone="warning" />
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}

      {recent.length > 0 ? (
        <>
          <SectionHeader title="Latest payments" />
          <Card padded={false}>
            {recent.map((payment, index) => (
              <Pressable
                key={payment.id}
                onPress={() =>
                  router.push({
                    pathname: routes.recordPayment,
                    params: { studentId: payment.studentId, amotanId: payment.amotanId },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`${payment.studentName} paid ${formatCents(
                  payment.amountCents
                )} for ${payment.amotanTitle} on ${formatDisplayDate(payment.paidDate)}`}
                style={({ pressed }) => [
                  styles.listRow,
                  index > 0 && styles.divider,
                  pressed && styles.pressed,
                ]}
              >
                <Avatar name={payment.studentName} size={36} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {payment.studentName}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {payment.amotanTitle} · {formatDisplayDate(payment.paidDate)}
                  </Text>
                </View>
                <Text style={styles.paid}>+{formatCents(payment.amountCents)}</Text>
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

function StatTile({
  icon,
  tone,
  value,
  label,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  tone: 'accent' | 'warning';
  value: string;
  label: string;
}) {
  const styles = useStyles();
  const { theme } = useTheme();
  const [background, color] =
    tone === 'accent'
      ? [theme.colors.accentTint, theme.colors.accentText]
      : [theme.colors.warningTint, theme.colors.warningText];
  return (
    <Card style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
  },
  hero: {
    backgroundColor: t.colors.hero,
    borderRadius: radius.lg + 4,
    padding: space.xl,
    marginBottom: space.md,
    shadowColor: t.colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroLabel: {
    fontSize: font.footnote,
    fontWeight: '700',
    color: t.colors.heroSubtext,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroValue: {
    fontSize: font.hero + 4,
    fontWeight: '800',
    color: t.colors.heroText,
    letterSpacing: -1,
    marginTop: space.xs,
  },
  heroDetail: {
    fontSize: font.body,
    color: t.colors.heroSubtext,
  },
  heroProgress: {
    marginTop: space.lg,
  },
  tiles: {
    flexDirection: 'row',
    gap: space.md,
  },
  tile: {
    flex: 1,
  },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  tileValue: {
    fontSize: font.subtitle + 1,
    fontWeight: '800',
    color: t.colors.text,
  },
  tileLabel: {
    fontSize: font.footnote,
    color: t.colors.textSecondary,
    marginTop: 2,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.md,
  },
  column: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: t.colors.divider,
  },
  pressed: {
    backgroundColor: t.colors.surfaceMuted,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    flexShrink: 1,
    fontSize: font.callout,
    fontWeight: '700',
    color: t.colors.text,
  },
  rowAmount: {
    fontSize: font.body,
    fontWeight: '700',
    color: t.colors.accentText,
  },
  rowAmountOf: {
    fontWeight: '500',
    color: t.colors.textSecondary,
  },
  rowProgress: {
    marginTop: space.sm,
    marginBottom: space.xs,
  },
  rowMeta: {
    fontSize: font.footnote,
    color: t.colors.textSecondary,
    marginTop: 2,
  },
  paid: {
    fontSize: font.body,
    fontWeight: '700',
    color: t.colors.accentText,
  },
}));
