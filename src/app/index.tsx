import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaymentCard } from '../components/PaymentCard';
import { PaymentSummaryCard } from '../components/PaymentSummaryCard';
import { PaymentsLoadingSkeleton } from '../components/PaymentsLoadingSkeleton';
import { routes } from '../constants/routes';
import {
  deletePayment,
  getPayments,
  getPaymentSummary,
  initializeDatabase,
  type PaymentSummary,
} from '../database/paymentRepository';
import type { Payment } from '../types/payment';
import { tapFeedback } from '../utils/feedback';
import {
  filterPayments,
  groupPaymentsByDate,
  type DateRange,
  type SortOrder,
} from '../utils/paymentList';

/** Date filters offered as chips above the list. */
const RANGES: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({ count: 0, total: 0 });
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<DateRange>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  // `load()` is shared by the focus effect and pull-to-refresh. Each call takes
  // a ticket on entry; only the newest call may write results or clear the
  // spinners, so a slow focus load cannot overwrite a newer refresh.
  const loadTicket = useRef(0);

  const load = useCallback(async () => {
    const ticket = ++loadTicket.current;
    const isCurrent = () => ticket === loadTicket.current;
    try {
      await initializeDatabase();
      const [nextPayments, nextSummary] = await Promise.all([
        getPayments(),
        getPaymentSummary(),
      ]);
      if (!isCurrent()) {
        return;
      }
      setPayments(nextPayments);
      setSummary(nextSummary);
      setFailed(false);
    } catch (error) {
      if (!isCurrent()) {
        return;
      }
      if (__DEV__) {
        console.error('Failed to load payments', error);
      }
      setFailed(true);
    } finally {
      if (isCurrent()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Refresh the list every time the screen regains focus.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /**
   * Pull-to-refresh deliberately leaves `loading` alone: the summary, the
   * filters and the rows stay on screen under the system spinner, instead of
   * collapsing back into the skeleton.
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const visiblePayments = useMemo(
    () => filterPayments(payments, query, range),
    [payments, query, range]
  );
  const sections = useMemo(
    () => groupPaymentsByDate(visiblePayments, sort),
    [visiblePayments, sort]
  );
  const filtersApplied = query.trim().length > 0 || range !== 'all';

  function handleDelete(payment: Payment) {
    Alert.alert(
      'Delete Payment?',
      'Are you sure you want to delete this payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const deleted = await deletePayment(payment.id);
              if (!deleted) {
                Alert.alert(
                  'Payment Not Found',
                  'This payment may have been deleted.'
                );
              }
              await load();
            } catch (error) {
              if (__DEV__) {
                console.error('Failed to delete payment', error);
              }
              Alert.alert(
                'Unable to Delete',
                'Could not delete. Please try again.'
              );
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <PaymentsLoadingSkeleton />
      </SafeAreaView>
    );
  }

  if (failed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.errorTitle}>Unable to load payments.</Text>
          <Text style={styles.message}>Please try again.</Text>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/*
        The header sits outside the list on purpose, so the total, the search
        field and the filters stay put while the rows scroll underneath.
      */}
      <View style={styles.header}>
        <PaymentSummaryCard summary={summary} />
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search payer or description"
            placeholderTextColor="#8A948E"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search payments by payer or description"
            style={styles.search}
          />
          {query ? (
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
              style={styles.searchClear}
            >
              <Text style={styles.searchClearLabel}>✕</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.controls}>
          <View style={styles.chips}>
            {RANGES.map((option) => {
              const active = option.value === range;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    tapFeedback();
                    setRange(option.value);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipLabel, active && styles.chipLabelActive]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={() => {
              tapFeedback();
              setSort(sort === 'newest' ? 'oldest' : 'newest');
            }}
            accessibilityRole="button"
            accessibilityLabel={`Sort by date: ${
              sort === 'newest' ? 'newest first' : 'oldest first'
            }. Tap to switch.`}
            style={styles.sort}
          >
            <Text style={styles.sortLabel}>
              {sort === 'newest' ? 'Newest ▼' : 'Oldest ▲'}
            </Text>
          </Pressable>
        </View>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(payment) => String(payment.id)}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#127A52"
            colors={['#127A52']}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <PaymentCard
            payment={item}
            onPress={() =>
              router.push({
                pathname: routes.paymentDetails,
                params: { id: String(item.id) },
              })
            }
            onEdit={() =>
              router.push({
                pathname: routes.editPayment,
                params: { id: String(item.id) },
              })
            }
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          payments.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No payments yet.</Text>
              <Text style={styles.message}>
                Tap + to record your first payment.
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No matching payments.</Text>
              <Text style={styles.message}>
                Nothing matches your search or filter.
              </Text>
              {filtersApplied ? (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => {
                    setQuery('');
                    setRange('all');
                  }}
                >
                  <Text style={styles.clearLabel}>Clear filters</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
      />
      <Pressable
        style={styles.fab}
        onPress={() => {
          tapFeedback();
          Keyboard.dismiss();
          router.push(routes.addPayment);
        }}
        accessibilityRole="button"
        accessibilityLabel="Add payment"
        accessibilityHint="Opens the add payment screen"
      >
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#C63B3B',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#5B6660',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    minHeight: 50,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  search: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#17211C',
    minHeight: 50,
  },
  searchClear: {
    position: 'absolute',
    right: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearLabel: {
    fontSize: 15,
    color: '#5B6660',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
  },
  chipActive: {
    backgroundColor: '#127A52',
    borderColor: '#127A52',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B6660',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  sort: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    marginLeft: 8,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0C5C3E',
  },
  listContent: {
    paddingHorizontal: 16,
    // Room for the floating button, so it never covers the last payment.
    paddingBottom: 96,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B6660',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 8,
    paddingBottom: 8,
    // Section headers stick to the top while scrolling, so they need an opaque
    // background or the rows would show through them.
    backgroundColor: '#F4F6F5',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17211C',
    marginBottom: 8,
  },
  clearButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#127A52',
  },
  clearLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#127A52',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabLabel: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '400',
    color: '#FFFFFF',
  },
});
