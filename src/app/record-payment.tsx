import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DateField } from '../components/DateField';
import {
  deletePayment,
  getPaymentForStudentAndAmotan,
  recordPayment,
} from '../database/amotanPaymentRepository';
import { getAmotanById } from '../database/amotanRepository';
import { getStudentById } from '../database/studentRepository';
import { useReloadOnSync } from '../sync/useReloadOnSync';
import type { Amotan, AmotanPayment, Student } from '../types/amotan';
import {
  centsToAmountText,
  formatCents,
  parseAmountToCents,
} from '../utils/amotanValidation';
import { tapFeedback } from '../utils/feedback';
import { firstParam } from '../utils/params';
import { formatDisplayDate, parseDateInput, todayISO } from '../utils/validation';

/**
 * One student's payments toward one amotan: how much is left, a form to
 * record the next installment, and the history (with delete for mistakes).
 */
export default function RecordPaymentScreen() {
  const params = useLocalSearchParams<{ studentId: string; amotanId: string }>();
  const studentId = firstParam(params.studentId);
  const amotanId = firstParam(params.amotanId);

  const [student, setStudent] = useState<Student | null>(null);
  const [amotan, setAmotan] = useState<Amotan | null>(null);
  const [payments, setPayments] = useState<AmotanPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [amount, setAmount] = useState('');
  // Once the user types an amount, reloads (focus, sync) must not replace it.
  const amountTouched = useRef(false);
  const [paidDate, setPaidDate] = useState(todayISO());
  const [errors, setErrors] = useState<{ amount?: string; paidDate?: string }>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [loadedStudent, loadedAmotan, loadedPayments] = await Promise.all([
        getStudentById(studentId),
        getAmotanById(amotanId),
        getPaymentForStudentAndAmotan(studentId, amotanId),
      ]);
      setStudent(loadedStudent);
      setAmotan(loadedAmotan);
      setPayments(loadedPayments);
      if (loadedAmotan && !amountTouched.current) {
        const paid = loadedPayments.reduce((sum, p) => sum + p.amountCents, 0);
        const left = Math.max(loadedAmotan.amountCents - paid, 0);
        // Suggest paying the rest; most students pay it all at once.
        setAmount(left > 0 ? centsToAmountText(left) : '');
      }
      setFailed(false);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load payments', error);
      }
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [studentId, amotanId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  useReloadOnSync(load);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color="#127A52" />
      </View>
    );
  }

  if (failed || !student || !amotan) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.emptyTitle}>
          {failed
            ? 'Unable to load these payments.'
            : 'This student or amotan was deleted.'}
        </Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonLabel}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const paidCents = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  const remainingCents = Math.max(amotan.amountCents - paidCents, 0);

  async function handleSave() {
    if (!student || !amotan) {
      return;
    }
    const nextErrors: { amount?: string; paidDate?: string } = {};
    const amountCents = parseAmountToCents(amount);
    if (!amount.trim()) {
      nextErrors.amount = 'Amount is required.';
    } else if (amountCents === null) {
      nextErrors.amount = 'Enter a valid amount greater than 0 (numbers only).';
    } else if (amountCents > remainingCents) {
      // Catches typos like 1500 for 150 before they skew the totals.
      nextErrors.amount = `Only ${formatCents(remainingCents)} is left to pay.`;
    }
    if (parseDateInput(paidDate) === null) {
      nextErrors.paidDate = 'Pick the date the money was received.';
    } else if (paidDate > todayISO()) {
      // YYYY-MM-DD strings sort like dates, so a string compare works.
      nextErrors.paidDate = 'The payment date cannot be in the future.';
    }
    setErrors(nextErrors);
    if (nextErrors.amount || nextErrors.paidDate || amountCents === null) {
      return;
    }

    Keyboard.dismiss();
    setSaving(true);
    try {
      await recordPayment({
        studentId: student.id,
        amotanId: amotan.id,
        amountCents,
        paidDate,
      });
      tapFeedback();
      router.back();
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to record payment', error);
      }
      Alert.alert('Unable to Save', 'Could not record the payment. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(payment: AmotanPayment) {
    Alert.alert(
      'Delete this payment?',
      `${formatCents(payment.amountCents)} on ${formatDisplayDate(payment.paidDate)}. It is removed on both phones.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePayment(payment.id);
              await load();
            } catch (error) {
              if (__DEV__) {
                console.error('Failed to delete payment', error);
              }
              Alert.alert('Unable to Delete', 'Could not delete. Please try again.');
            }
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: student.name }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>{amotan.title}</Text>
          <Text style={styles.summaryLine}>
            Paid {formatCents(paidCents)} of {formatCents(amotan.amountCents)}
          </Text>
          <Text style={[styles.summaryLeft, remainingCents === 0 && styles.summaryDone]}>
            {remainingCents === 0 ? '✓ Fully paid' : `${formatCents(remainingCents)} left`}
          </Text>
        </View>

        {remainingCents > 0 ? (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Record a payment</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Amount (₱)</Text>
              <TextInput
                value={amount}
                onChangeText={(text) => {
                  amountTouched.current = true;
                  setAmount(text);
                }}
                placeholder={centsToAmountText(remainingCents)}
                placeholderTextColor="#8A948E"
                keyboardType="decimal-pad"
                style={[styles.input, errors.amount && styles.inputError]}
              />
              {errors.amount ? (
                <Text style={styles.error}>{errors.amount}</Text>
              ) : (
                <Text style={styles.hint}>Lower it if they are paying only part.</Text>
              )}
            </View>
            <DateField
              label="Date Received"
              value={paidDate}
              onChange={setPaidDate}
              error={errors.paidDate}
            />
            <Pressable
              style={[styles.button, saving && styles.disabled]}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
            >
              <Text style={styles.buttonLabel}>{saving ? 'Saving...' : 'Record Payment'}</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>History</Text>
        {payments.length === 0 ? (
          <Text style={styles.message}>No payments yet.</Text>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={styles.historyRow}>
              <View style={styles.historyBody}>
                <Text style={styles.historyAmount}>{formatCents(payment.amountCents)}</Text>
                <Text style={styles.historyDate}>{formatDisplayDate(payment.paidDate)}</Text>
              </View>
              <Pressable
                onPress={() => handleDelete(payment)}
                accessibilityRole="button"
                accessibilityLabel={`Delete payment of ${formatCents(payment.amountCents)}`}
                hitSlop={8}
              >
                <Text style={styles.deleteLabel}>Delete</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F4F6F5',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  summary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17211C',
  },
  summaryLine: {
    fontSize: 14,
    color: '#5B6660',
    marginTop: 4,
  },
  summaryLeft: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8A5A00',
    marginTop: 8,
  },
  summaryDone: {
    color: '#127A52',
  },
  form: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B6660',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17211C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#17211C',
    minHeight: 50,
  },
  inputError: {
    borderColor: '#C63B3B',
  },
  error: {
    color: '#C63B3B',
    fontSize: 13,
    marginTop: 4,
  },
  hint: {
    color: '#5B6660',
    fontSize: 13,
    marginTop: 4,
  },
  button: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#127A52',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyBody: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17211C',
  },
  historyDate: {
    fontSize: 13,
    color: '#5B6660',
    marginTop: 2,
  },
  deleteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C63B3B',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17211C',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#5B6660',
  },
});
