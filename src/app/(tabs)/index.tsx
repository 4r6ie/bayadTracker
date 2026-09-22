import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PaymentCard } from '@/components/PaymentCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StatCard } from '@/components/StatCard';
import { Colors, Radius, Spacing } from '@/constants/colors';
import { PaymentService } from '@/services/paymentService';
import type { Payment, PaymentStats } from '@/types/payment';
import { formatCurrency } from '@/utils/currency';

const RECENT_LIMIT = 5;
const NO_EDGES = [] as const;

export default function DashboardScreen() {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [recent, setRecent] = useState<Payment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const [statsResult, recentResult] = await Promise.all([
        PaymentService.getStats(),
        PaymentService.listPayments({ sort: 'NEWEST', limit: RECENT_LIMIT }),
      ]);
      setStats(statsResult);
      setRecent(recentResult);
    } catch {
      setError(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !stats) {
    return (
      <ScreenContainer edges={NO_EDGES} scroll={false}>
        <View style={styles.errorContainer}>
          <ErrorState
            title="Unable to load payments"
            message="Something went wrong while reading the database."
            actionLabel="Try Again"
            onAction={load}
          />
        </View>
      </ScreenContainer>
    );
  }

  const hasPayments = stats.total_payments > 0;

  return (
    <View style={styles.flex}>
      <ScreenContainer
        edges={NO_EDGES}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatCard label="Total Collected" value={formatCurrency(stats.total_collected)} />
            <View style={styles.gridGap} />
            <StatCard label="Total Payments" value={String(stats.total_payments)} />
          </View>
          <View style={styles.gridRow}>
            <StatCard label="Today" value={String(stats.today_payments)} />
            <View style={styles.gridGap} />
            <StatCard
              label="This Month"
              value={formatCurrency(stats.monthly_total)}
              accent={Colors.primary}
            />
          </View>
        </View>

        {hasPayments ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Payments</Text>
              <Pressable onPress={() => router.navigate('/payments')} hitSlop={8}>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>
            {recent.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                onPress={() => router.push(`/payments/${payment.id}`)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <EmptyState
              title="No payments yet"
              message="Start recording your payments by tapping + Add Payment."
              actionLabel="Add Payment"
              onAction={() => router.push('/payments/add')}
            />
          </View>
        )}
      </ScreenContainer>

      <Pressable
        onPress={() => router.push('/payments/add')}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabLabel}>Add Payment</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  grid: {
    marginBottom: Spacing.xl,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  gridGap: {
    width: Spacing.md,
  },
  section: {
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    height: 54,
    borderRadius: Radius.round,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    backgroundColor: Colors.primaryDark,
  },
  fabIcon: {
    fontSize: 24,
    lineHeight: 28,
    color: Colors.white,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  fabLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
