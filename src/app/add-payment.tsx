import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createPayment } from '../database/paymentRepository';
import {
  todayISO,
  toPaymentInput,
  validatePaymentForm,
  type PaymentFormErrors,
} from '../utils/validation';

export default function AddPaymentScreen() {
  const [payerName, setPayerName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const values = { payerName, amount, description, paymentDate };
    const result = validatePaymentForm(values);
    setErrors(result);
    if (Object.keys(result).length > 0) {
      return;
    }

    const input = toPaymentInput(values);
    if (input === null) {
      return;
    }

    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Field
        label="Payer Name"
        value={payerName}
        onChangeText={setPayerName}
        placeholder="e.g. Juan Dela Cruz"
        error={errors.payerName}
      />
      <Field
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="1500.00"
        keyboardType="decimal-pad"
        error={errors.amount}
      />
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="e.g. Electricity Bill"
        error={errors.description}
      />
      <Field
        label="Payment Date (YYYY-MM-DD)"
        value={paymentDate}
        onChangeText={setPaymentDate}
        placeholder="2026-09-22"
        error={errors.paymentDate}
      />

      <Pressable
        style={[styles.saveButton, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveLabel}>
          {saving ? 'Saving...' : 'Save Payment'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A948E"
        keyboardType={keyboardType}
        autoCorrect={false}
        style={[styles.input, error && styles.inputError]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  content: {
    padding: 16,
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
  saveButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#127A52',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  saveLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
