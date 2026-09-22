import { router } from 'expo-router';
import { Alert } from 'react-native';

import { PaymentForm } from '@/components/PaymentForm';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PaymentService } from '@/services/paymentService';
import type { PaymentFormValues } from '@/utils/validation';
import { createEmptyForm, toPaymentInput } from '@/utils/validation';
import { todayISO } from '@/utils/date';

export default function AddPaymentScreen() {
  const initialValues: PaymentFormValues = {
    ...createEmptyForm(),
    payment_date: todayISO(),
  };

  async function handleSubmit(values: PaymentFormValues) {
    const input = toPaymentInput(values);
    if (input === null) {
      return;
    }
    await PaymentService.addPayment(input);
    Alert.alert('Payment Added', 'The payment was recorded successfully.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <ScreenContainer>
      <PaymentForm
        initialValues={initialValues}
        submitLabel="Save Payment"
        onSubmit={handleSubmit}
      />
    </ScreenContainer>
  );
}