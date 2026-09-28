import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChecklistRow } from '../../components/ChecklistRow';
import { routes } from '../../constants/routes';
import { getAmotanRoster } from '../../database/amotanPaymentRepository';
import { getAmotanById } from '../../database/amotanRepository';
import { useReloadOnSync } from '../../sync/useReloadOnSync';
import type { Amotan, AmotanRosterEntry } from '../../types/amotan';
import { formatCents } from '../../utils/amotanValidation';
import { tapFeedback } from '../../utils/feedback';
import { firstParam } from '../../utils/params';
import { confirmPayRemaining } from '../../utils/payRemaining';
import { formatDisplayDate } from '../../utils/validation';

type Filter = 'all' | 'notYet' | 'paid';

/**
 * Task 7: one amotan, with who has paid and who has not. "Not yet" covers
 * both unpaid and partly paid students: they all still owe something.
 */
export default function AmotanDetailsScreen() {
  const id = firstParam(useLocalSearchParams<{ id: string }>().id);
  const [amotan, setAmotan] = useState<Amotan | null>(null);
  const [roster, setRoster] = useState<AmotanRosterEntry[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const [loadedAmotan, loadedRoster] = await Promise.all([
        getAmotanById(id),
        getAmotanRoster(id),
      ]);
      setAmotan(loadedAmotan);
      setRoster(loadedRoster);
      setFailed(false);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load amotan', error);
      }
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  useReloadOnSync(load);

  const notYet = useMemo(() => roster.filter((entry) => entry.status !== 'paid'), [roster]);
  const paid = useMemo(() => roster.filter((entry) => entry.status === 'paid'), [roster]);
  const visible = filter === 'notYet' ? notYet : filter === 'paid' ? paid : roster;

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color="#127A52" />
      </View>
    );
  }

  if (failed || !amotan) {
    return (
      <View style={styles.centerBox}>
        <Stack.Screen options={{ title: 'Amotan' }} />
        <Text style={styles.emptyTitle}>
          {failed ? 'Unable to load this amotan.' : 'This amotan was deleted.'}
        </Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonLabel}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const collectedCents = roster.reduce((sum, entry) => sum + entry.paidCents, 0);
  const expectedCents = amotan.amountCents * roster.length;

  /** Plain text for the class group chat: who still has to pay, and how much. */
  async function shareNotYet() {
    if (!amotan) {
      return;
    }
    tapFeedback();
    const lines = notYet.map(
      (entry, index) =>
        `${index + 1}. ${entry.studentName} — ${formatCents(
          amotan.amountCents - entry.paidCents
        )} left`
    );
    const header = `${amotan.title} (${formatCents(amotan.amountCents)} each)${
      amotan.dueDate ? `, due ${formatDisplayDate(amotan.dueDate)}` : ''
    }`;
    const message =
      notYet.length === 0
        ? `${header}\nEveryone has paid. Salamat!`
        : `${header}\nWala pa nakabayad / kulang pa (${notYet.length}):\n${lines.join('\n')}`;
    try {
      await Share.share({ message });
    } catch (error) {
      if (__DEV__) {
        console.error('Share failed', error);
      }
      Alert.alert('Unable to Share', 'Please try again.');
    }
  }

  const FILTERS: { value: Filter; label: string }[] = [
    { value: 'all', label: `All (${roster.length})` },
    { value: 'notYet', label: `Not yet (${notYet.length})` },
    { value: 'paid', label: `Paid (${paid.length})` },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: amotan.title,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={shareNotYet}
                accessibilityRole="button"
                accessibilityLabel="Share who has not paid"
                hitSlop={8}
              >
                <Text style={styles.headerAction}>Share</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({ pathname: routes.editAmotan, params: { id: amotan.id } })
                }
                accessibilityRole="button"
                accessibilityLabel="Edit amotan"
                hitSlop={8}
              >
                <Text style={styles.headerAction}>Edit</Text>
              </Pressable>
            </View>
          ),
        }}
      />
      <FlatList
        data={visible}
        keyExtractor={(entry) => entry.studentId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.summary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Each</Text>
                <Text style={styles.summaryValue}>{formatCents(amotan.amountCents)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Collected</Text>
                <Text style={styles.summaryValue}>{formatCents(collectedCents)}</Text>
                <Text style={styles.summaryDetail}>of {formatCents(expectedCents)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Due</Text>
                <Text style={styles.summaryValueSmall}>
                  {amotan.dueDate ? formatDisplayDate(amotan.dueDate) : 'No deadline'}
                </Text>
              </View>
            </View>
            {roster.length > 0 ? (
              <View style={styles.chips}>
                {FILTERS.map((option) => {
                  const active = option.value === filter;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        tapFeedback();
                        setFilter(option.value);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <ChecklistRow
            title={item.studentName}
            paidCents={item.paidCents}
            targetCents={amotan.amountCents}
            status={item.status}
            onPress={() =>
              router.push({
                pathname: routes.recordPayment,
                params: { studentId: item.studentId, amotanId: amotan.id },
              })
            }
            onCheck={() =>
              confirmPayRemaining({
                studentId: item.studentId,
                studentName: item.studentName,
                amotanId: amotan.id,
                amotanTitle: amotan.title,
                remainingCents: amotan.amountCents - item.paidCents,
                onDone: load,
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {roster.length === 0
                ? 'No students yet.'
                : filter === 'notYet'
                  ? 'Everyone has paid.'
                  : 'Nobody has fully paid yet.'}
            </Text>
            {roster.length === 0 ? (
              <Text style={styles.message}>Add students in the Students tab.</Text>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F4F6F5',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 20,
  },
  headerAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#127A52',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B6660',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#17211C',
    marginTop: 4,
  },
  summaryValueSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: '#17211C',
    marginTop: 6,
    textAlign: 'center',
  },
  summaryDetail: {
    fontSize: 12,
    color: '#5B6660',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#5B6660',
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#127A52',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
