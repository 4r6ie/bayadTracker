import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StudentCard } from '../../components/StudentCard';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { routes } from '../../constants/routes';
import { getStudentSummaries } from '../../database/amotanPaymentRepository';
import { deleteStudent } from '../../database/studentRepository';
import { syncNow } from '../../sync/syncManager';
import { useReloadOnSync } from '../../sync/useReloadOnSync';
import type { StudentSummary } from '../../types/amotan';
import { tapFeedback } from '../../utils/feedback';

export default function StudentsScreen() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [query, setQuery] = useState('');
  // Three states: loading -> (failed | loaded)
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setStudents(await getStudentSummaries());
      setFailed(false);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load students', error);
      }
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload every time the tab regains focus (e.g. after adding a student).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  // Show the other phone's changes as soon as a sync brings them in.
  useReloadOnSync(load);

  async function handleRefresh() {
    setRefreshing(true);
    // Pulling down also syncs, then shows whatever arrived.
    await syncNow();
    await load();
    setRefreshing(false);
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? students.filter((student) => student.name.toLowerCase().includes(needle))
      : students;
  }, [students, query]);

  const owingCount = students.filter((student) => student.owedCents > 0).length;

  function handleDelete(student: StudentSummary) {
    Alert.alert(
      `Delete ${student.name}?`,
      'This also deletes every payment recorded for this student, on both phones. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(student.id);
              await load();
            } catch (error) {
              if (__DEV__) {
                console.error('Failed to delete student', error);
              }
              Alert.alert('Unable to Delete', 'Could not delete. Please try again.');
            }
          },
        },
      ]
    );
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
        <Text style={styles.errorTitle}>Unable to load students.</Text>
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
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(student) => student.id}
        contentContainerStyle={styles.listContent}
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
        ListHeaderComponent={
          <>
            <SyncStatusBar />
            {students.length > 0 ? (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search students"
                placeholderTextColor="#8A948E"
                autoCorrect={false}
                clearButtonMode="while-editing"
                accessibilityLabel="Search students by name"
                style={styles.search}
              />
            ) : null}
            <Text style={styles.count}>
              {students.length} {students.length === 1 ? 'student' : 'students'}
              {owingCount > 0 ? ` · ${owingCount} still owe` : ''}
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            onPress={() =>
              router.push({ pathname: routes.studentDetails, params: { id: item.id } })
            }
            onLongPress={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {students.length === 0 ? 'No students yet.' : 'No matching students.'}
            </Text>
            <Text style={styles.message}>
              {students.length === 0
                ? 'Tap + to add your first student.'
                : 'Try a different name.'}
            </Text>
          </View>
        }
      />
      <Pressable
        style={styles.fab}
        onPress={() => {
          tapFeedback();
          router.push(routes.addStudent);
        }}
        accessibilityRole="button"
        accessibilityLabel="Add student"
        accessibilityHint="Opens the add student screen"
      >
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>
    </View>
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
  listContent: {
    padding: 16,
    // Room for the floating button, so it never covers the last row.
    paddingBottom: 96,
    flexGrow: 1,
  },
  search: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#17211C',
    minHeight: 48,
    marginBottom: 12,
  },
  count: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B6660',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
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
