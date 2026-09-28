import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { routes } from '../../constants/routes';
import {
  getAmotanSummaries,
  getRecentPayments,
  getStudentSummaries,
} from '../../database/amotanPaymentRepository';
import { syncNow } from '../../sync/syncManager';
import { useReloadOnSync } from '../../sync/useReloadOnSync';
import type { AmotanSummary, RecentPayment, StudentSummary } from '../../types/amotan';
import { formatCents } from '../../utils/amotanValidation';
import { formatDisplayDate } from '../../utils/validation';

const TOP_OWED = 5;
const RECENT = 10;

function ProgressBar({ fraction }: { fraction: number }) {
  const clamped = Math.max(0, Math.min(fraction, 1));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

/**
 * The totals the mayor and secretary ask for most: how much came in overall,
 * per amotan, who owes the most, and the latest payments.
 *
 * Built from the same summary queries as the Students and Amotan tabs, so
 * every number here matches what those screens show.
 */
export default function DashboardScreen() {
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
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color="#127A52" />
      </View>
    );
  }

  if (failed) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorTitle}>Unable to load the dashboard.</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            load();
          }}
        >
          <Text style={styles.retryLabel}>Try Again</Text>
        </Pressable>
      </View>
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
  const fullyPaidStudents = students.filter(
    (student) => student.amotanCount > 0 && student.owedCents === 0
  ).length;
  const topOwed = students
    .filter((student) => student.owedCents > 0)
    .sort((a, b) => b.owedCents - a.owedCents)
    .slice(0, TOP_OWED);

  const isEmpty = amotanList.length === 0 || students.length === 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#127A52"
          colors={['#127A52']}
        />
      }
    >
      <SyncStatusBar />

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Total collected</Text>
        <Text style={styles.heroValue}>{formatCents(collectedCents)}</Text>
        <Text style={styles.heroDetail}>of {formatCents(expectedCents)} expected</Text>
        <ProgressBar fraction={settledFraction} />
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{formatCents(outstandingCents)}</Text>
            <Text style={styles.heroStatLabel}>still to collect</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>
              {fullyPaidStudents} / {students.length}
            </Text>
            <Text style={styles.heroStatLabel}>students fully paid</Text>
          </View>
        </View>
      </View>

      {isEmpty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing to total yet.</Text>
          <Text style={styles.message}>
            Add students and amotan, and the totals show up here.
          </Text>
        </View>
      ) : null}

      {amotanList.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Per amotan</Text>
          {amotanList.map((amotan) => {
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
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {amotan.title}
                  </Text>
                  <Text style={styles.cardAmount}>
                    {formatCents(amotan.collectedCents)}
                    <Text style={styles.cardAmountOf}> / {formatCents(expected)}</Text>
                  </Text>
                </View>
                <ProgressBar
                  fraction={amotan.studentCount > 0 ? amotan.paidCount / amotan.studentCount : 0}
                />
                <Text style={styles.cardMeta}>
                  {amotan.paidCount} of {amotan.studentCount} paid
                  {amotan.dueDate ? ` · due ${formatDisplayDate(amotan.dueDate)}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </>
      ) : null}

      {topOwed.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Owes the most</Text>
          <View style={styles.listCard}>
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
                  index > 0 && styles.listRowDivider,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.listRank}>{index + 1}</Text>
                <View style={styles.listBody}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {student.name}
                  </Text>
                  <Text style={styles.listSub}>
                    {student.paidCount} of {student.amotanCount} paid
                  </Text>
                </View>
                <Text style={styles.owed}>{formatCents(student.owedCents)}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {recent.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Latest payments</Text>
          <View style={styles.listCard}>
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
                  index > 0 && styles.listRowDivider,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.listBody}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {payment.studentName}
                  </Text>
                  <Text style={styles.listSub} numberOfLines={1}>
                    {payment.amotanTitle} · {formatDisplayDate(payment.paidDate)}
                  </Text>
                </View>
                <Text style={styles.paid}>+{formatCents(payment.amountCents)}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F4F6F5',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#C63B3B',
  },
  retryButton: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#127A52',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  retryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hero: {
    backgroundColor: '#127A52',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CDEBDD',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  heroDetail: {
    fontSize: 14,
    color: '#CDEBDD',
    marginBottom: 4,
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: 16,
  },
  heroStat: {
    flex: 1,
  },
  heroStatValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroStatLabel: {
    fontSize: 12,
    color: '#CDEBDD',
    marginTop: 2,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    marginTop: 10,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#F2C14E',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B6660',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#17211C',
    marginRight: 8,
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#127A52',
  },
  cardAmountOf: {
    fontWeight: '500',
    color: '#5B6660',
  },
  cardMeta: {
    fontSize: 12,
    color: '#5B6660',
    marginTop: 6,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  listRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#EDF1EE',
  },
  listRank: {
    width: 22,
    fontSize: 14,
    fontWeight: '700',
    color: '#8A948E',
  },
  listBody: {
    flex: 1,
    marginRight: 8,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#17211C',
  },
  listSub: {
    fontSize: 12,
    color: '#5B6660',
    marginTop: 2,
  },
  owed: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A5A00',
  },
  paid: {
    fontSize: 14,
    fontWeight: '700',
    color: '#127A52',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17211C',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#5B6660',
    textAlign: 'center',
  },
});
