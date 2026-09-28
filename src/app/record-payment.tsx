import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { DateField } from '../components/DateField';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/Controls';
import { SectionHeader } from '../components/ui/Headers';
import { Pill } from '../components/ui/Pill';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ErrorState, LoadingState } from '../components/ui/States';
import {
  deletePayment,
  getPaymentForStudentAndAmotan,
  recordPayment,
} from '../database/amotanPaymentRepository';
import { getAmotanById } from '../database/amotanRepository';
import { getStudentById } from '../database/studentRepository';
import { useReloadOnSync } from '../sync/useReloadOnSync';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { font, radius, space } from '../theme/tokens';
import type { Amotan, AmotanPayment, Student } from '../types/amotan';
import { centsToAmountText, formatCents, parseAmountToCents } from '../utils/amotanValidation';
import { tapFeedback } from '../utils/feedback';
import { firstParam } from '../utils/params';
import { formatDisplayDate, parseDateInput, todayISO } from '../utils/validation';

/**
 * One student's payments toward one amotan: how much is left, a form to
 * record the next installment, and the history (with delete for mistakes).
 */
export default function RecordPaymentScreen() {
  const styles = useStyles();
  const { theme } = useTheme();
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
    return <LoadingState />;
  }
  if (failed || !student || !amotan) {
    return (
      <ErrorState
        message={
          failed ? "Couldn't load these payments." : 'This student or amotan was deleted.'
        }
        onRetry={failed ? load : () => router.back()}
      />
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
      nextErrors.amount = 'Enter the amount received.';
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
      nextErrors.paidDate = "The payment date can't be in the future.";
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
      Alert.alert('Unable to save', "The payment wasn't recorded. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(payment: AmotanPayment) {
    Alert.alert(
      'Delete this payment?',
      `${formatCents(payment.amountCents)} on ${formatDisplayDate(payment.paidDate)}. It's removed on both phones.`,
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
              Alert.alert('Unable to delete', 'Try again.');
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
      <Stack.Screen options={{ title: 'Payments' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <View style={styles.who}>
            <Avatar name={student.name} size={44} />
            <View style={styles.whoBody}>
              <Text style={styles.whoName} numberOfLines={1}>
                {student.name}
              </Text>
              <Text style={styles.whoAmotan} numberOfLines={1}>
                {amotan.title}
              </Text>
            </View>
            {remainingCents === 0 ? (
              <Pill label="Paid" tone="accent" icon="checkmark" />
            ) : null}
          </View>
          <View style={styles.progress}>
            <ProgressBar
              fraction={amotan.amountCents > 0 ? paidCents / amotan.amountCents : 0}
              tone={remainingCents === 0 ? 'accent' : 'warning'}
              height={8}
            />
          </View>
          <View style={styles.amounts}>
            <Text style={styles.amountText}>
              Paid <Text style={styles.amountStrong}>{formatCents(paidCents)}</Text> of{' '}
              {formatCents(amotan.amountCents)}
            </Text>
            {remainingCents > 0 ? (
              <Text style={styles.left}>{formatCents(remainingCents)} left</Text>
            ) : null}
          </View>
        </Card>

        {remainingCents > 0 ? (
          <>
            <SectionHeader title="Record a payment" />
            <TextField
              label="Amount received (₱)"
              value={amount}
              onChangeText={(text) => {
                amountTouched.current = true;
                setAmount(text);
              }}
              placeholder={centsToAmountText(remainingCents)}
              keyboardType="decimal-pad"
              error={errors.amount}
              hint="Lower it if they're paying only part."
            />
            <DateField
              label="Date received"
              value={paidDate}
              onChange={setPaidDate}
              error={errors.paidDate}
            />
            <Button
              label="Record payment"
              icon="checkmark"
              busy={saving}
              busyLabel="Saving…"
              onPress={handleSave}
            />
          </>
        ) : null}

        <SectionHeader title="History" />
        {payments.length === 0 ? (
          <Text style={styles.empty}>No payments yet.</Text>
        ) : (
          <Card padded={false}>
            {payments.map((payment, index) => (
              <View key={payment.id} style={[styles.historyRow, index > 0 && styles.divider]}>
                <View style={styles.historyIcon}>
                  <Ionicons name="cash-outline" size={18} color={theme.colors.accentText} />
                </View>
                <View style={styles.historyBody}>
                  <Text style={styles.historyAmount}>{formatCents(payment.amountCents)}</Text>
                  <Text style={styles.historyDate}>{formatDisplayDate(payment.paidDate)}</Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(payment)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete payment of ${formatCents(payment.amountCents)}`}
                  hitSlop={10}
                  style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.5 }]}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                </Pressable>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    padding: space.lg,
    paddingBottom: space.xxl * 1.5,
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  whoBody: {
    flex: 1,
  },
  whoName: {
    fontSize: font.subtitle,
    fontWeight: '800',
    color: t.colors.text,
  },
  whoAmotan: {
    fontSize: font.body,
    color: t.colors.textSecondary,
    marginTop: 2,
  },
  progress: {
    marginTop: space.lg,
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.sm,
  },
  amountText: {
    fontSize: font.footnote,
    color: t.colors.textSecondary,
  },
  amountStrong: {
    fontWeight: '700',
    color: t.colors.text,
  },
  left: {
    fontSize: font.footnote,
    fontWeight: '700',
    color: t.colors.warningText,
  },
  empty: {
    fontSize: font.body,
    color: t.colors.textSecondary,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.md,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: t.colors.divider,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: t.colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBody: {
    flex: 1,
  },
  historyAmount: {
    fontSize: font.callout,
    fontWeight: '700',
    color: t.colors.text,
  },
  historyDate: {
    fontSize: font.footnote,
    color: t.colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: space.sm,
  },
}));
