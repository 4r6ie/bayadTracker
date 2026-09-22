import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { PaymentForm } from '../../components/PaymentForm';
import {
  getPaymentById,
  updatePayment,
} from '../../database/paymentRepository';
import type { Payment, PaymentInput } from '../../types/payment';

export default function EditPaymentScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = Number(rawId);

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        try {
          const loaded = await getPaymentById(id);
          if (cancelled) return;
          if (!loaded) {
            setNotFound(true);
          } else {
            setPayment(loaded);
          }
        } catch (error) {
          if (!cancelled) {
            if (__DEV__) console.error('Failed to load payment', error);
            Alert.alert('Unable to Load', 'Unable to load payment. Please try again.');
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [id])
  );
  async function handleSave(input: PaymentInput) {
    try {
      const updated = await updatePayment(id, input);
      if (!updated) {
        Alert.alert('Payment Not Found', 'This payment may have been deleted.', [
          { text: 'OK', onPress: () => router.replace('/') },
        ]);
        return;
      }
      Alert.alert('Payment Updated', 'The changes were saved successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      if (__DEV__) console.error('Failed to update payment', error);
      Alert.alert('Unable to Save', 'Unable to save payment. Please try again.');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#127A52" />
      </View>
    );
  }

  if (notFound || !payment) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.title}>Payment not found.</Text>
        <Text style={styles.message}>This payment may have been deleted.</Text>
      </View>
    );
  }

  return (
    <PaymentForm
      // `initialValues` is read once, when the form mounts, so a reloaded
      // record has to remount the form to pick up the new values.
      key={payment.updatedAt}
      initialValues={{
        payerName: payment.payerName,
        amount: String(payment.amount),
        description: payment.description,
        paymentDate: payment.paymentDate,
      }}
      submitLabel="Save Changes"
      busyLabel="Saving..."
      onSubmit={handleSave}
    />
  );
}
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6F5' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6F5', padding: 16 },
  title: { fontSize: 17, fontWeight: '700', color: '#17211C', marginBottom: 4 },
  message: { fontSize: 14, color: '#5B6660', textAlign: 'center' },
});
