import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PaymentForm } from '@/components/PaymentForm';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors } from '@/constants/colors';
import { PaymentService } from '@/services/paymentService';
import type { PaymentFormValues } from '@/utils/validation';
import { toPaymentInput } from '@/utils/validation';

export default function EditPaymentScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);

  const [initialValues, setInitialValues] = useState<PaymentFormValues | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isFinite(id) || id <= 0) {
        setNotFound(true);
        setLoaded(true);
        return;
      }
      try {
        setError(false);
        const record = await PaymentService.getPayment(id);
        if (cancelled) {
          return;
        }
        if (!record) {
          setNotFound(true);
        } else {
          setInitialValues({
            payer_name: record.payer_name,
            description: record.description,
            amount: String(record.amount),
            payment_date: record.payment_date,
            status: record.status,
            notes: record.notes ?? '',
          });
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <ErrorState
          title="Unable to load payment"
          message="Something went wrong while reading the database."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </ScreenContainer>
    );
  }

  if (notFound || !initialValues) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Payment not found"
          message="This payment may have been deleted."
        />
      </ScreenContainer>
    );
  }

  async function handleSubmit(values: PaymentFormValues) {
    const input = toPaymentInput(values);
    if (input === null) {
      return;
    }
    const updated = await PaymentService.updatePayment(id, input);
    if (!updated) {
      Alert.alert('Payment Not Found', 'This payment may have been deleted.', [
        { text: 'OK', onPress: () => router.replace('/payments') },
      ]);
      return;
    }
    Alert.alert('Payment Updated', 'The changes were saved successfully.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <ScreenContainer>
      <PaymentForm
        initialValues={initialValues}
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});