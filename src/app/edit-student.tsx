import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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
        Alert.alert('Already Added', `A student named "${input.name}" already exists.`);
        return;
      }
      if (__DEV__) {
        console.error('Failed to update student', error);
      }
      Alert.alert('Unable to Save', 'Could not save the student. Please try again.');
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

  if (!student) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.message}>This student was deleted.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete student"
              hitSlop={8}
            >
              <Text style={styles.deleteAction}>Delete</Text>
            </Pressable>
          ),
        }}
      />
      <StudentForm
        initialName={student.name}
        submitLabel="Save Changes"
        busyLabel="Saving..."
        onSubmit={handleSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F4F6F5',
  },
  message: {
    fontSize: 15,
    color: '#5B6660',
  },
  deleteAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C63B3B',
  },
});
