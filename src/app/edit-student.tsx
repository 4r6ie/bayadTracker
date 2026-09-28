import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { IconButton } from '../components/ui/IconButton';
import { ErrorState, LoadingState } from '../components/ui/States';
import { StudentForm } from '../components/StudentForm';
import {
  deleteStudent,
  DuplicateStudentError,
  getStudentById,
  updateStudent,
} from '../database/studentRepository';
import type { Student, StudentInput } from '../types/amotan';
import { firstParam } from '../utils/params';

export default function EditStudentScreen() {
  const id = firstParam(useLocalSearchParams<{ id: string }>().id);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // The form reads its initial value once, so load before rendering it.
  useEffect(() => {
    let cancelled = false;
    getStudentById(id)
      .then((loaded) => {
        if (!cancelled) {
          setStudent(loaded);
        }
      })
      .catch((error) => {
        if (__DEV__) {
          console.error('Failed to load student', error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(input: StudentInput) {
    try {
      await updateStudent(id, input);
      router.back();
    } catch (error) {
      if (error instanceof DuplicateStudentError) {
        Alert.alert('Already added', `A student named "${input.name}" already exists.`);
        return;
      }
      if (__DEV__) {
        console.error('Failed to update student', error);
      }
      Alert.alert('Unable to save', 'Could not save the student. Please try again.');
    }
  }

  function handleDelete() {
    if (!student) {
      return;
    }
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
              await deleteStudent(id);
              // Back to the list: the details screen behind us is gone too.
              router.dismissAll();
            } catch (error) {
              if (__DEV__) {
                console.error('Failed to delete student', error);
              }
              Alert.alert('Unable to delete', 'Could not delete. Please try again.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!student) {
    return <ErrorState message="This student was deleted." onRetry={() => router.back()} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon="trash-outline"
              tone="danger"
              accessibilityLabel="Delete student"
              onPress={handleDelete}
            />
          ),
        }}
      />
      <StudentForm
        initialName={student.name}
        submitLabel="Save changes"
        busyLabel="Saving…"
        onSubmit={handleSubmit}
      />
    </>
  );
}

