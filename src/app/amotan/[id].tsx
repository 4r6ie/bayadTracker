import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Share, Text, View } from 'react-native';
import { ChecklistRow } from '../../components/ChecklistRow';
import { Card } from '../../components/ui/Card';
import { ChipGroup } from '../../components/ui/Controls';
import { IconButton } from '../../components/ui/IconButton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { routes } from '../../constants/routes';
import { getAmotanRoster } from '../../database/amotanPaymentRepository';
import { getAmotanById } from '../../database/amotanRepository';
import { useReloadOnSync } from '../../sync/useReloadOnSync';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { font, space } from '../../theme/tokens';
import type { Amotan, AmotanRosterEntry } from '../../types/amotan';
import { formatCents } from '../../utils/amotanValidation';
import { tapFeedback } from '../../utils/feedback';
import { firstParam } from '../../utils/params';
import { confirmPayRemaining } from '../../utils/payRemaining';
import { formatDisplayDate } from '../../utils/validation';

type Filter = 'all' | 'notYet' | 'paid';

/**
 * One amotan, with who has paid and who has not. "Not yet" covers both
 * unpaid and partly paid students: they all still owe something.
 */
export default function AmotanDetailsScreen() {
  const styles = useStyles();
  const { theme } = useTheme();
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
    return <LoadingState />;
  }
  if (failed || !amotan) {
    return (
      <ErrorState
        message={failed ? "Couldn't load this amotan." : 'This amotan was deleted.'}
        onRetry={failed ? load : () => router.back()}
      />
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
      Alert.alert('Unable to share', 'Try again.');
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton
                icon="share-outline"
                accessibilityLabel="Share who hasn't paid"
                onPress={shareNotYet}
              />
              <IconButton
                icon="create-outline"
                accessibilityLabel="Edit amotan"
                onPress={() =>
                  router.push({ pathname: routes.editAmotan, params: { id: amotan.id } })
                }
              />
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {amotan.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.each}>{formatCents(amotan.amountCents)} each</Text>
          <View style={styles.due}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.dueText}>
              {amotan.dueDate ? `Due ${formatDisplayDate(amotan.dueDate)}` : 'No deadline'}
            </Text>
          </View>
        </View>

        <Card style={styles.summary}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Collected</Text>
              <Text style={styles.summaryValue}>{formatCents(collectedCents)}</Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryLabel}>Expected</Text>
              <Text style={styles.summaryValueMuted}>{formatCents(expectedCents)}</Text>
            </View>
          </View>
          <View style={styles.summaryProgress}>
            <ProgressBar
              fraction={roster.length > 0 ? paid.length / roster.length : 0}
              height={8}
            />
          </View>
          <Text style={styles.summaryDetail}>
            {paid.length} of {roster.length} students paid
          </Text>
        </Card>

        {roster.length > 0 ? (
          <>
            <ChipGroup
              options={[
                { value: 'all', label: `All ${roster.length}` },
                { value: 'notYet', label: `Not yet ${notYet.length}` },
                { value: 'paid', label: `Paid ${paid.length}` },
              ]}
              value={filter}
              onChange={setFilter}
            />
            {visible.length > 0 ? (
              <Card padded={false}>
                {visible.map((entry, index) => (
                  <ChecklistRow
                    key={entry.studentId}
                    divider={index > 0}
                    title={entry.studentName}
                    avatarName={entry.studentName}
                    paidCents={entry.paidCents}
                    targetCents={amotan.amountCents}
                    status={entry.status}
                    onPress={() =>
                      router.push({
                        pathname: routes.recordPayment,
                        params: { studentId: entry.studentId, amotanId: amotan.id },
                      })
                    }
                    onCheck={() =>
                      confirmPayRemaining({
                        studentId: entry.studentId,
                        studentName: entry.studentName,
                        amotanId: amotan.id,
                        amotanTitle: amotan.title,
                        remainingCents: amotan.amountCents - entry.paidCents,
                        onDone: load,
                      })
                    }
                  />
                ))}
              </Card>
            ) : (
              <EmptyState
                icon={filter === 'notYet' ? 'happy-outline' : 'time-outline'}
                title={filter === 'notYet' ? 'Everyone has paid' : 'Nobody has fully paid yet'}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon="people-outline"
            title="No students yet"
            message="Add your class in the Students tab."
          />
        )}
      </ScrollView>
    </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: space.xs,
  },
  title: {
    fontSize: font.largeTitle - 2,
    fontWeight: '800',
    color: t.colors.text,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.xs,
    marginBottom: space.lg,
  },
  each: {
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
    fontSize: font.body,
    color: t.colors.textSecondary,
  },
  summary: {
    marginBottom: space.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: font.caption,
    fontWeight: '700',
    color: t.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: font.title,
    fontWeight: '800',
    color: t.colors.text,
    marginTop: 2,
  },
  summaryValueMuted: {
    fontSize: font.title,
    fontWeight: '700',
    color: t.colors.textSecondary,
    marginTop: 2,
  },
  summaryProgress: {
    marginTop: space.md,
  },
  summaryDetail: {
    fontSize: font.footnote,
    color: t.colors.textSecondary,
    marginTop: space.sm,
  },
}));
