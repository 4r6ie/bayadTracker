import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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
      Alert.alert('Unable to Save', 'Could not save the amotan. Please try again.');
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

  if (!amotan) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.message}>This amotan was deleted.</Text>
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
              accessibilityLabel="Delete amotan"
              hitSlop={8}
            >
              <Text style={styles.deleteAction}>Delete</Text>
            </Pressable>
          ),
        }}
      />
      <AmotanForm
        initialValues={{
          title: amotan.title,
          amount: centsToAmountText(amotan.amountCents),
          dueDate: amotan.dueDate ?? '',
        }}
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
