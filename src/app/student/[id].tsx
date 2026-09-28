import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ChecklistRow } from '../../components/ChecklistRow';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/Headers';
import { IconButton } from '../../components/ui/IconButton';
import { Pill } from '../../components/ui/Pill';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { routes } from '../../constants/routes';
import { getStudentChecklist } from '../../database/amotanPaymentRepository';
import { getStudentById } from '../../database/studentRepository';
import { useReloadOnSync } from '../../sync/useReloadOnSync';
import { makeStyles } from '../../theme/ThemeProvider';
import { font, space } from '../../theme/tokens';
import type { Student, StudentChecklistEntry } from '../../types/amotan';
import { formatCents } from '../../utils/amotanValidation';
import { firstParam } from '../../utils/params';
import { confirmPayRemaining } from '../../utils/payRemaining';
import { formatDisplayDate } from '../../utils/validation';

/** A student and the checklist of every amotan they owe. */
export default function StudentDetailsScreen() {
  const styles = useStyles();
  const id = firstParam(useLocalSearchParams<{ id: string }>().id);
  const [student, setStudent] = useState<Student | null>(null);
  const [checklist, setChecklist] = useState<StudentChecklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const [loadedStudent, loadedChecklist] = await Promise.all([
        getStudentById(id),
        getStudentChecklist(id),
      ]);
      setStudent(loadedStudent);
      setChecklist(loadedChecklist);
      setFailed(false);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load student', error);
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

  if (loading) {
    return <LoadingState />;
  }
  if (failed || !student) {
    return (
      <ErrorState
        message={failed ? "Couldn't load this student." : 'This student was deleted.'}
        onRetry={failed ? load : () => router.back()}
      />
    );
  }

  const owedCents = checklist.reduce(
    (sum, entry) => sum + Math.max(entry.targetCents - entry.paidCents, 0),
    0
  );
  const paidCount = checklist.filter((entry) => entry.status === 'paid').length;
  // "Record payment" opens the first amotan still owed, soonest deadline first.
  const nextOwed = checklist.find((entry) => entry.status !== 'paid');

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              icon="create-outline"
              accessibilityLabel="Edit student"
              onPress={() =>
                router.push({ pathname: routes.editStudent, params: { id: student.id } })
              }
            />
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profile}>
          <Avatar name={student.name} size={64} />
          <View style={styles.profileBody}>
            <Text style={styles.name} accessibilityRole="header">
              {student.name}
            </Text>
            {checklist.length === 0 ? null : owedCents === 0 ? (
              <Pill label="All paid" tone="accent" icon="checkmark" />
            ) : (
              <Pill label={`Owes ${formatCents(owedCents)}`} tone="warning" />
            )}
          </View>
        </View>

        {checklist.length > 0 ? (
          <>
            <SectionHeader title={`${paidCount} of ${checklist.length} amotan paid`} />
            <Card padded={false}>
              {checklist.map((entry, index) => (
                <ChecklistRow
                  key={entry.amotanId}
                  divider={index > 0}
                  title={entry.title}
                  subtitle={
                    entry.status === 'paid'
                      ? `Paid ${formatCents(entry.paidCents)}`
                      : entry.dueDate
                        ? `${formatCents(entry.targetCents - entry.paidCents)} left · due ${formatDisplayDate(entry.dueDate)}`
                        : undefined
                  }
                  paidCents={entry.paidCents}
                  targetCents={entry.targetCents}
                  status={entry.status}
                  onPress={() =>
                    router.push({
                      pathname: routes.recordPayment,
                      params: { studentId: student.id, amotanId: entry.amotanId },
                    })
                  }
                  onCheck={() =>
                    confirmPayRemaining({
                      studentId: student.id,
                      studentName: student.name,
                      amotanId: entry.amotanId,
                      amotanTitle: entry.title,
                      remainingCents: entry.targetCents - entry.paidCents,
                      onDone: load,
                    })
                  }
                />
              ))}
            </Card>
            <Text style={styles.tip}>Tap a checkbox to record the full remaining amount.</Text>
          </>
        ) : (
          <EmptyState
            icon="wallet-outline"
            title="No amotan yet"
            message="Add one in the Amotan tab and it shows up here."
          />
        )}
      </ScrollView>

      {nextOwed ? (
        <View style={styles.footer}>
          <Button
            label="Record payment"
            icon="add"
            onPress={() =>
              router.push({
                pathname: routes.recordPayment,
                params: { studentId: student.id, amotanId: nextOwed.amotanId },
              })
            }
          />
        </View>
      ) : null}
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
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  profileBody: {
    flex: 1,
    gap: space.sm,
  },
  name: {
    fontSize: font.title + 2,
    fontWeight: '800',
    color: t.colors.text,
    letterSpacing: -0.3,
  },
  tip: {
    fontSize: font.footnote,
    color: t.colors.textMuted,
    textAlign: 'center',
    marginTop: space.sm,
  },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xl,
    backgroundColor: t.colors.background,
  },
}));
