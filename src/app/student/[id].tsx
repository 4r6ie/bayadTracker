import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChecklistRow } from '../../components/ChecklistRow';
import { routes } from '../../constants/routes';
import { getStudentChecklist } from '../../database/amotanPaymentRepository';
import { getStudentById } from '../../database/studentRepository';
import { useReloadOnSync } from '../../sync/useReloadOnSync';
import type { Student, StudentChecklistEntry } from '../../types/amotan';
import { formatCents } from '../../utils/amotanValidation';
import { firstParam } from '../../utils/params';
import { confirmPayRemaining } from '../../utils/payRemaining';
import { formatDisplayDate } from '../../utils/validation';

/** Task 6: one student and the checklist of every amotan they owe. */
export default function StudentDetailsScreen() {
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
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color="#127A52" />
      </View>
    );
  }

  if (failed || !student) {
    return (
      <View style={styles.centerBox}>
        <Stack.Screen options={{ title: 'Student' }} />
        <Text style={styles.emptyTitle}>
          {failed ? 'Unable to load this student.' : 'This student was deleted.'}
        </Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonLabel}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const owedCents = checklist.reduce(
    (sum, entry) => sum + Math.max(entry.targetCents - entry.paidCents, 0),
    0
  );
  const paidCount = checklist.filter((entry) => entry.status === 'paid').length;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: student.name,
          headerRight: () => (
            <Pressable
              onPress={() =>
                router.push({ pathname: routes.editStudent, params: { id: student.id } })
              }
              accessibilityRole="button"
              accessibilityLabel="Edit student"
              hitSlop={8}
            >
              <Text style={styles.headerAction}>Edit</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={checklist}
        keyExtractor={(entry) => entry.amotanId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          checklist.length > 0 ? (
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>
                {owedCents === 0 ? 'All paid' : 'Still owes'}
              </Text>
              <Text style={[styles.summaryValue, owedCents === 0 && styles.summaryDone]}>
                {owedCents === 0 ? '✓' : formatCents(owedCents)}
              </Text>
              <Text style={styles.summaryDetail}>
                {paidCount} of {checklist.length} amotan fully paid
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ChecklistRow
            title={item.title}
            subtitle={item.dueDate ? `Due ${formatDisplayDate(item.dueDate)}` : undefined}
            paidCents={item.paidCents}
            targetCents={item.targetCents}
            status={item.status}
            onPress={() =>
              router.push({
                pathname: routes.recordPayment,
                params: { studentId: student.id, amotanId: item.amotanId },
              })
            }
            onCheck={() =>
              confirmPayRemaining({
                studentId: student.id,
                studentName: student.name,
                amotanId: item.amotanId,
                amotanTitle: item.title,
                remainingCents: item.targetCents - item.paidCents,
                onDone: load,
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No amotan yet.</Text>
            <Text style={styles.message}>Add one in the Amotan tab.</Text>
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B6660',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8A5A00',
    marginVertical: 4,
  },
  summaryDone: {
    color: '#127A52',
  },
  summaryDetail: {
    fontSize: 14,
    color: '#5B6660',
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
