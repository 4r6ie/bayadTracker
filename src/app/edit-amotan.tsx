import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { IconButton } from '../components/ui/IconButton';
import { ErrorState, LoadingState } from '../components/ui/States';
import { AmotanForm } from '../components/AmotanForm';
import {
  deleteAmotan,
  getAmotanById,
  updateAmotan,
} from '../database/amotanRepository';
import type { Amotan, AmotanInput } from '../types/amotan';
import { centsToAmountText } from '../utils/amotanValidation';
import { firstParam } from '../utils/params';

export default function EditAmotanScreen() {
  const id = firstParam(useLocalSearchParams<{ id: string }>().id);
  const [amotan, setAmotan] = useState<Amotan | null>(null);
  const [loading, setLoading] = useState(true);

  // The form reads its initial values once, so load before rendering it.
  useEffect(() => {
    let cancelled = false;
    getAmotanById(id)
      .then((loaded) => {
        if (!cancelled) {
          setAmotan(loaded);
        }
      })
      .catch((error) => {
        if (__DEV__) {
          console.error('Failed to load amotan', error);
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

  async function handleSubmit(input: AmotanInput) {
    try {
      await updateAmotan(id, input);
      router.back();
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to update amotan', error);
      }
      Alert.alert('Unable to save', 'Could not save the amotan. Please try again.');
    }
  }

  function handleDelete() {
    if (!amotan) {
      return;
    }
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
              await deleteAmotan(id);
              router.dismissAll();
            } catch (error) {
              if (__DEV__) {
                console.error('Failed to delete amotan', error);
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

  if (!amotan) {
    return <ErrorState message="This amotan was deleted." onRetry={() => router.back()} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon="trash-outline"
              tone="danger"
              accessibilityLabel="Delete amotan"
              onPress={handleDelete}
            />
          ),
        }}
      />
      <AmotanForm
        initialValues={{
          title: amotan.title,
          amount: centsToAmountText(amotan.amountCents),
          dueDate: amotan.dueDate ?? '',
        }}
        submitLabel="Save changes"
        busyLabel="Saving…"
        onSubmit={handleSubmit}
      />
    </>
  );
}

