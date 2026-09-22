import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilterChips } from '@/components/FilterChips';
import type { ChipOption } from '@/components/FilterChips';
import { PaymentCard } from '@/components/PaymentCard';
import { SearchBar } from '@/components/SearchBar';
import { Colors, Radius, Spacing } from '@/constants/colors';
import { PaymentService } from '@/services/paymentService';
import type { Payment, PaymentFilter, PaymentSort } from '@/types/payment';
import { PAYMENT_FILTERS, PAYMENT_STATUS_LABELS } from '@/types/payment';

const NO_EDGES = [] as const;

const FILTER_LABELS: Record<PaymentFilter, string> = {
  ALL: 'All',
  ...PAYMENT_STATUS_LABELS,
};

const FILTER_OPTIONS: readonly ChipOption<PaymentFilter>[] = PAYMENT_FILTERS.map(
  (value) => ({ value, label: FILTER_LABELS[value] })
);

const SORT_OPTIONS: readonly ChipOption<PaymentSort>[] = [
  { label: 'Newest', value: 'NEWEST' },
  { label: 'Oldest', value: 'OLDEST' },
  { label: 'Highest Amount', value: 'AMOUNT_HIGH' },
  { label: 'Lowest Amount', value: 'AMOUNT_LOW' },
];

export default function PaymentsScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<PaymentFilter>('ALL');
  const [sort, setSort] = useState<PaymentSort>('NEWEST');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const reload = useCallback(async () => {
    try {
      setError(false);
      const result = await PaymentService.listPayments({
        search: debouncedSearch,
        filter,
        sort,
      });
      setPayments(result);
    } catch {
      setError(true);
    } finally {
      setLoaded(true);
    }
  }, [debouncedSearch, filter, sort]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await reload();
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

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={NO_EDGES}>
        <View style={styles.errorContainer}>
          <ErrorState
            title="Unable to load payments"
            message="Something went wrong while reading the database."
            actionLabel="Try Again"
            onAction={reload}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isSearching = debouncedSearch.length > 0 || filter !== 'ALL';

  return (
    <SafeAreaView style={styles.safeArea} edges={NO_EDGES}>
      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PaymentCard
            payment={item}
            onPress={() => router.push(`/payments/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search payer, description, or notes"
            />
            <View style={styles.chipSection}>
              <Text style={styles.chipLabel}>Filter</Text>
              <FilterChips
                options={FILTER_OPTIONS}
                selected={filter}
                onSelect={setFilter}
              />
            </View>
            <View style={styles.chipSection}>
              <Text style={styles.chipLabel}>Sort</Text>
              <FilterChips
                options={SORT_OPTIONS}
                selected={sort}
                onSelect={setSort}
              />
            </View>
            <Text style={styles.count}>
              {payments.length} {payments.length === 1 ? 'payment' : 'payments'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          isSearching ? (
            <EmptyState
              title="No payments found"
              message="Try adjusting your search or filters."
            />
          ) : (
            <EmptyState
              title="No payments yet"
              message="Record your first payment to see it listed here."
              actionLabel="Add Payment"
              onAction={() => router.push('/payments/add')}
            />
          )
        }
      />

      <Pressable
        onPress={() => router.push('/payments/add')}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabLabel}>Add Payment</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
    padding: Spacing.lg,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 96,
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing.md,
  },
  chipSection: {
    marginTop: Spacing.lg,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: Spacing.sm,
  },
  count: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
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
