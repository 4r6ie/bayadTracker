import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StudentCard } from '../components/StudentCard';
import { routes } from '../constants/routes';
import { deleteStudent, getStudents } from '../database/studentRepository';
import type { Student } from '../types/amotan';
import { tapFeedback } from '../utils/feedback';

export default function StudentsScreen(){
  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [failed, setFlailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback (async ()=>{
 try {
    setStudents(await getStudents());
    setFlailed(false);
    }catch (error){
      if (__DEV__) {
        console.error('Failed to load students', error);
    }
    setFlailed(true);
    }finally {
      setLoading(false);
    }
  },[]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh(){
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function handleDelete(student: Student) {
    Alert.alert(
      `Delete ${student.name}?`,
      'This also delete all of this student\u2019s recorded payments. This cannot be undone.',
      [
        { text: 'Cancel',  style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(student.id);
              await load();
            }catch (error) {
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator color="#127A52" />
        </View>
      </SafeAreaView>
    );
  }

  if (failed) {
    return (
      <SafeAreaView style ={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.errorTitle}> Unable to load students.</Text>
          <Text style={styles.message}>Please try again.</Text>
          <Pressable
            style={styles.retryButton}
            onPress={()=> {
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
      <FlatList
      data={students}
      keyExtractor={(students)=> String(students.id)}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor= "#127A52"
        colors={['#127A52']}
        />
      }
      ListHeaderComponent={
        <Text style={styles.count}>
          {students.length} {students.length === 1 ? 'student' : 'student'}
        </Text>
      }
      renderItem={({ item}) => (
        <StudentCard student={item} onLongPress={() => handleDelete(item)}/>
      )}
      ListEmptyComponent={
        <View style= {styles.empty}>
          <Text style={styles.emptyTitle}>No student yet</Text>
          <Text style={styles.message}>Tap + tp add your first student.</Text>
        </View>
      }/>


      <Pressable
        style ={styles.fab}
          onPress={()=> {
            tapFeedback();
            router.push(routes.addStudent);
         }}
        accessibilityRole="button"
        accessibilityLabel="Add Student"
        accessibilityHint="Opens the add student screen"
        >
        <Text style= {styles.fabLabel}>+</Text>
        </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F5',
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
  listContent: {
    padding: 16,
    // Lugar para sa floating button, aron dili matabonan ang katapusang row.
    paddingBottom: 96,
    flexGrow: 1,
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