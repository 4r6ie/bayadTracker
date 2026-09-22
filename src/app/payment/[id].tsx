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
import { routes } from '../../constants/routes';
import type { Payment } from '../../types/payment';
import { formatAmount, formatDisplayDate } from '../../utils/validation';

export default function PaymentDetailsScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = Number(rawId);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        try {
          const loaded = await getPaymentById(id);
          if (cancelled) {
            return;
          }
          setPayment(loaded);
        } catch (error) {
          if (!cancelled) {
            if (__DEV__) {
              console.error('Failed to load payment', error);
            }
            Alert.alert(
              'Unable to Load',
              'Unable to load payment. Please try again.'
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [id])
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
            router.push({ pathname: routes.editPayment, params: { id: String(payment.id) } })
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
function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F5',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F5',
    padding: 16,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#17211C', marginBottom: 4 },
  message: { fontSize: 14, color: '#5B6660', textAlign: 'center' },
  screen: { flex: 1, backgroundColor: '#F4F6F5' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E7E3',
    padding: 16,
    marginBottom: 12,
  },
  payerName: { fontSize: 16, fontWeight: '700', color: '#17211C', marginBottom: 2 },
  amount: { fontSize: 20, fontWeight: '700', color: '#0C5C3E', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#E1E7E3', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLast: { marginBottom: 0 },
  rowLabel: { fontSize: 14, color: '#5B6660' },
  rowValue: { fontSize: 14, color: '#17211C', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: { backgroundColor: '#127A52' },
  deleteButton: { backgroundColor: '#C63B3B' },
  dim: { opacity: 0.5 },
  editLabel: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  deleteLabel: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});