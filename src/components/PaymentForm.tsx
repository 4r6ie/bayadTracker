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
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import type { PaymentInput } from '../types/payment';
import {
  formatDisplayDate,
  parseDateInput,
  toISODate,
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
 * fields, the date picker, the validation flow, the keyboard handling and the
 * styles live in one place.
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
        <DateField
          label="Payment Date"
          value={paymentDate}
          onChange={setPaymentDate}
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

/**
 * The payment date, chosen with the platform's own picker.
 *
 * Tapping the row opens a dialog on Android (the imperative API the library
 * recommends) or an inline calendar on iOS, so the date can never be typed in
 * the wrong format. The value kept in state stays `YYYY-MM-DD`, so validation
 * and storage are unchanged.
 */
function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [picking, setPicking] = useState(false);
  // A picker needs a real date to open on, so fall back to today when the
  // value in state cannot be parsed.
  const selected = parseDateInput(value) ?? new Date();

  // `@react-native-community/datetimepicker` has no web implementation (it
  // warns and renders nothing), so web keeps the typed `YYYY-MM-DD` field.
  if (Platform.OS === 'web') {
    return (
      <Field
        label={`${label} (YYYY-MM-DD)`}
        value={value}
        onChangeText={onChange}
        placeholder="2026-09-22"
        error={error}
      />
    );
  }

  function handleValueChange(_event: DateTimePickerChangeEvent, date: Date) {
    onChange(toISODate(date));
  }

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selected,
        mode: 'date',
        onValueChange: handleValueChange,
      });
      return;
    }
    setPicking((open) => !open);
  }

  const displayValue = parseDateInput(value) ? formatDisplayDate(value) : value;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${displayValue || 'no date selected'}`}
        accessibilityHint="Opens the date picker"
        style={({ pressed }) => [
          styles.input,
          styles.dateRow,
          error && styles.inputError,
          pressed && styles.dateRowPressed,
        ]}
      >
        <Text style={styles.dateValue}>
          {displayValue || 'Select a date'}
        </Text>
        <Text style={styles.dateAction}>
          {picking ? 'Done' : 'Change'}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {picking ? (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={selected}
            mode="date"
            display="inline"
            onValueChange={handleValueChange}
            onDismiss={() => setPicking(false)}
          />
        </View>
      ) : null}
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRowPressed: {
    opacity: 0.7,
  },
  dateValue: {
    flex: 1,
    fontSize: 15,
    color: '#17211C',
  },
  dateAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#127A52',
    marginLeft: 12,
  },
  pickerContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    overflow: 'hidden',
    // The inline iOS calendar has no intrinsic height to measure against.
    height: 340,
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
