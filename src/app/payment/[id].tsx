import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  deletePayment,
  getPaymentById,
} from '../../database/paymentRepository';
import type { Payment } from '../../types/payment';
import { formatAmount, formatDisplayDate } from '../../utils/validation';

export default function PaymentDetailsScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = Number(rawId);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const load = useCallback(async () => {
    try {
      setPayment(await getPaymentById(id));
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load payment', error);
      }
      Alert.alert('Unable to Load', 'Unable to load payment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  function handleDelete() {
    Alert.alert('Delete Payment?', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: confirmDelete },
    ]);
  }
  async function confirmDelete() {
    setDeleting(true);
    try {
      const deleted = await deletePayment(id);
      if (!deleted) {
        Alert.alert('Payment Not Found', 'This payment may have been deleted.', [
          { text: 'OK', onPress: () => router.replace('/') },
        ]);
        return;
      }
      Alert.alert('Payment Deleted', 'The payment was deleted successfully.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to delete payment', error);
      }
      Alert.alert('Unable to Delete', 'Could not delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  }
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#127A52" />
      </View>
    );
  }
  if (!payment) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.title}>Payment not found.</Text>
        <Text style={styles.message}>This payment may have been deleted.</Text>
      </View>
    );
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.payerName}>{payment.payerName}</Text>
        <Text style={styles.amount}>{formatAmount(payment.amount)}</Text>
        <View style={styles.divider} />
        <Row label="Description" value={payment.description} />
        <Row label="Payment Date" value={formatDisplayDate(payment.paymentDate)} last />
      </View>
      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.editButton]}
          onPress={() =>
            router.push({ pathname: '/payment/edit', params: { id: String(payment.id) } })
          }
        >
          <Text style={styles.editLabel}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.deleteButton, deleting && styles.dim]}
          onPress={handleDelete}
          disabled={deleting}
        >
          <Text style={styles.deleteLabel}>{deleting ? 'Deleting...' : 'Delete'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
// SPLIT_A