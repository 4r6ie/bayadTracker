import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { AmotanCard } from '../../components/AmotanCard';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { Button } from '../../components/ui/Button';
import { Fab } from '../../components/ui/Controls';
import { ScreenHeader } from '../../components/ui/Headers';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { routes } from '../../constants/routes';
import { getAmotanSummaries } from '../../database/amotanPaymentRepository';
import { deleteAmotan } from '../../database/amotanRepository';
import { syncNow } from '../../sync/syncManager';
import { useReloadOnSync } from '../../sync/useReloadOnSync';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';
import type { AmotanSummary } from '../../types/amotan';

export default function AmotanListScreen() {
  const styles = useStyles();
  const { theme } = useTheme();
  const [amotanList, setAmotanList] = useState<AmotanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setAmotanList(await getAmotanSummaries());
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  useReloadOnSync(load);

  async function handleRefresh() {
    setRefreshing(true);
    await syncNow();
    await load();
    setRefreshing(false);
  }

  function handleDelete(amotan: AmotanSummary) {
    Alert.alert(
      `Delete ${amotan.title}?`,
      'This also deletes every payment recorded for this amotan, on both phones. This cannot be undone.',
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
        message="Couldn't load amotan."
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );
  }

  const openAdd = () => router.push(routes.addAmotan);
  const complete = amotanList.filter(
    (amotan) => amotan.studentCount > 0 && amotan.paidCount === amotan.studentCount
  ).length;

  return (
    <View style={styles.screen}>
      <FlatList
        data={amotanList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
          />
        }
        ListHeaderComponent={
          <ScreenHeader
            title="Amotan"
            // "amotan" has no separate plural form, so one label fits every count.
            subtitle={
              amotanList.length > 0
                ? `${amotanList.length} amotan · ${complete} complete`
                : undefined
            }
            right={<SyncStatusBar />}
          />
        }
        renderItem={({ item }) => (
          <AmotanCard
            amotan={item}
            onPress={() =>
              router.push({ pathname: routes.amotanDetails, params: { id: item.id } })
            }
            onLongPress={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="wallet-outline"
            title="Add your first amotan"
            message="A class T-shirt, a party, a field trip: set the amount each student pays."
            action={<Button label="Add amotan" icon="add" onPress={openAdd} />}
          />
        }
      />
      {amotanList.length > 0 ? <Fab onPress={openAdd} accessibilityLabel="Add amotan" /> : null}
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
    // Room for the floating button, so it never covers the last card.
    paddingBottom: 110,
    flexGrow: 1,
  },
}));
