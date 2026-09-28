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
import { AmotanCard } from '../../components/AmotanCard';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { routes } from '../../constants/routes';
import { deleteAmotan, getAmotans } from '../../database/amotanRepository';
import { syncNow } from '../../sync/syncManager';
import { useReloadOnSync } from '../../sync/useReloadOnSync';
import type { Amotan } from '../../types/amotan';
import { tapFeedback } from '../../utils/feedback';

export default function AmotanListScreen() {
  const [amotanList, setAmotanList] = useState<Amotan[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setAmotanList(await getAmotans());
      setFailed(false);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load amotan', error);
      }
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload every time the screen regains focus, e.g. after adding one.
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

  function handleDelete(amotan: Amotan) {
    Alert.alert(
      `Delete ${amotan.title}?`,
      // ON DELETE CASCADE removes the installments too, so say so.
      'This also deletes every payment recorded for this amotan. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAmotan(amotan.id);
              await load();
            } catch (error) {
              if (__DEV__) {
                console.error('Failed to delete amotan', error);
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.errorTitle}>Unable to load amotan.</Text>
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
      <FlatList
        data={amotanList}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#127A52"
            colors={['#127A52']}
          />
        }
        // "amotan" has no separate plural form, so one label fits every count.
        ListHeaderComponent={
          <>
            <SyncStatusBar />
            <Text style={styles.count}>{amotanList.length} amotan</Text>
          </>
        }
        renderItem={({ item }) => (
          <AmotanCard amotan={item} onLongPress={() => handleDelete(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No amotan yet.</Text>
            <Text style={styles.message}>Tap + to add your first amotan.</Text>
          </View>
        }
      />
      <Pressable
        style={styles.fab}
        onPress={() => {
          tapFeedback();
          router.push(routes.addAmotan);
        }}
        accessibilityRole="button"
        accessibilityLabel="Add amotan"
        accessibilityHint="Opens the add amotan screen"
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
    // Room for the floating button, so it never covers the last row.
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
