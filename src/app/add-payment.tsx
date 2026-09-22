import { router } from 'expo-router';
import { Alert } from 'react-native';
import { PaymentForm } from '../components/PaymentForm';
import { createPayment } from '../database/paymentRepository';
import type { PaymentInput } from '../types/payment';
import { todayISO } from '../utils/validation';

export default function AddPaymentScreen() {
  async function handleSubmit(input: PaymentInput) {
    try {
      await createPayment(input);
      Alert.alert('Payment Saved', 'The payment was recorded successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to save payment', error);
      }
      Alert.alert(
        'Unable to Save',
        'Unable to save payment. Please try again.'
      );
    }
  }

  return (
    <PaymentForm
      initialValues={{
        payerName: '',
        amount: '',
        description: '',
        paymentDate: todayISO(),
      }}
      submitLabel="Save Payment"
      busyLabel="Saving..."
      onSubmit={handleSubmit}
    />
  );
}

