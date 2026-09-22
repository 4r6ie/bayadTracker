import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaymentCard } from '../components/PaymentCard';
import { routes } from '../constants/routes';
import {
  getPayments,
  initializeDatabase,
} from '../database/paymentRepository';
import type { Payment } from '../types/payment';

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      await initializeDatabase();
      setPayments(await getPayments());
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load payments', error);
      }
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh the list every time the screen regains focus.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#127A52" />
      </View>
    );
  }

  if (failed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.errorTitle}>Unable to load payments.</Text>
          <Text style={styles.message}>Please try again.</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              load();
            }}
          >
            <Text style={styles.retryLabel}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={payments}
        keyExtractor={(payment) => String(payment.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Pressable
            style={styles.addButton}
            onPress={() => router.push(routes.addPayment)}
          >
            <Text style={styles.addLabel}>+ Add Payment</Text>
          </Pressable>
        }
        renderItem={({ item }) => (
          <PaymentCard
            payment={item}
            onPress={() =>
              router.push({
                pathname: routes.paymentDetails,
                params: { id: String(item.id) },
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No payments yet.</Text>
            <Text style={styles.message}>
              Tap &quot;Add Payment&quot; to record your first payment.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
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
    padding: 16,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#C63B3B',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#5B6660',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#127A52',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  retryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  addButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#127A52',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  addLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17211C',
    marginBottom: 8,
  },
});
