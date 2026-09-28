import { router } from 'expo-router';
import { Alert } from 'react-native';
import { AmotanForm } from '../components/AmotanForm';
import { createAmotan } from '../database/amotanRepository';
import type { AmotanInput } from '../types/amotan';

export default function AddAmotanScreen() {
  async function handleSubmit(input: AmotanInput) {
    try {
      await createAmotan(input);
      // The list reloads itself on focus.
      router.back();
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to save amotan', error);
      }
      Alert.alert('Unable to save', 'Could not save the amotan. Please try again.');
    }
  }

  return (
    <AmotanForm
      initialValues={{ title: '', amount: '', dueDate: '' }}
      submitLabel="Save amotan"
      busyLabel="Saving…"
      onSubmit={handleSubmit}
    />
  );
}
