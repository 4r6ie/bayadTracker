import { useState } from 'react';
import {
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
import type { PaymentInput } from '../types/payment';
import {
  toPaymentInput,
  validatePaymentForm,
  type PaymentFormErrors,
  type PaymentFormValues,
} from '../utils/validation';

export interface PaymentFormProps {
  /**
   * Values the form starts with. They are read once, when the form mounts, so
   * a screen must finish loading its data before rendering the form.
   */
  initialValues: PaymentFormValues;
  /** Label on the submit button (`Save Payment` / `Save Changes`). */
  submitLabel: string;
  /** Label shown on the button while `onSubmit` is running. */
  busyLabel: string;
  /**
   * Persists the already-validated values. The form owns the saving flag and
   * the keyboard; the screen owns the alerts and the navigation.
   */
  onSubmit: (input: PaymentInput) => Promise<void>;
}

/**
 * The add / edit payment form: payer name, amount, description, payment date.
 *
 * Shared by `src/app/add-payment.tsx` and `src/app/payment/edit.tsx` so the
 * fields, validation flow, keyboard handling and styles live in one place.
 */
export function PaymentForm({
  initialValues,
  submitLabel,
  busyLabel,
  onSubmit,
}: PaymentFormProps) {
  const [payerName, setPayerName] = useState(initialValues.payerName);
  const [amount, setAmount] = useState(initialValues.amount);
  const [description, setDescription] = useState(initialValues.description);
  const [paymentDate, setPaymentDate] = useState(initialValues.paymentDate);
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
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
    // Hide the keyboard before saving, so it is already gone when the screen
    // navigates away from the success alert.
    Keyboard.dismiss();
    setSaving(true);
    try {
      await onSubmit(input);
    } catch (error) {
      // Screens show their own alerts; log so a rejected submit is never silent.
      if (__DEV__) {
        console.error('Payment form submit failed', error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Field
          label="Payer Name"
          value={payerName}
          onChangeText={setPayerName}
          placeholder="e.g. argie cabudbud"
          error={errors.payerName}
        />
        <Field
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="150.00"
          keyboardType="decimal-pad"
          hint="Numbers only, no commas (for example 150.00)."
          error={errors.amount}
        />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="para asa ni nga bayad"
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
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.saveLabel}>{saving ? busyLabel : submitLabel}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  hint,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
  hint?: string;
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
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
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
  hint: {
    color: '#5B6660',
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
