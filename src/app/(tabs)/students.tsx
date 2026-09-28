import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { StudentCard } from '../../components/StudentCard';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { Button } from '../../components/ui/Button';
import { Fab, SearchField } from '../../components/ui/Controls';
import { ScreenHeader, SectionHeader } from '../../components/ui/Headers';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { routes } from '../../constants/routes';
import { getStudentSummaries } from '../../database/amotanPaymentRepository';
import { deleteStudent } from '../../database/studentRepository';
import { syncNow } from '../../sync/syncManager';
import { useReloadOnSync } from '../../sync/useReloadOnSync';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';
import type { StudentSummary } from '../../types/amotan';

export default function StudentsScreen() {
  const styles = useStyles();
  const { theme } = useTheme();
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
              Alert.alert('Unable to delete', 'Try again.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return <LoadingState />;
  }
  if (failed) {
    return (
      <ErrorState
        message="Couldn't load students."
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );
  }

  const openAdd = () => router.push(routes.addStudent);

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
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Students"
              subtitle={
                students.length === 0
                  ? undefined
                  : owingCount > 0
                    ? `${students.length} in class · ${owingCount} still owe`
                    : `${students.length} in class · all paid`
              }
              right={<SyncStatusBar />}
            />
            {students.length > 0 ? (
              <>
                <SearchField
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search students"
                  accessibilityLabel="Search students by name"
                />
                <SectionHeader title={query ? `${visible.length} found` : 'A to Z'} />
              </>
            ) : null}
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
          students.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="Add your class"
              message="Start with the names of everyone in your section."
              action={<Button label="Add student" icon="add" onPress={openAdd} />}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No matching students"
              message="Try a different name."
            />
          )
        }
      />
      {students.length > 0 ? <Fab onPress={openAdd} accessibilityLabel="Add student" /> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  listContent: {
    paddingHorizontal: space.lg,
    // Room for the floating button, so it never covers the last row.
    paddingBottom: 110,
    flexGrow: 1,
  },
}));
