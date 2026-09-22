import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AmountField } from '@/components/AmountField';
import { AppButton } from '@/components/AppButton';
import { DateField } from '@/components/DateField';
import { FilterChips } from '@/components/FilterChips';
import type { ChipOption } from '@/components/FilterChips';
import { FormField } from '@/components/FormField';
import { Colors, Radius, Spacing } from '@/constants/colors';
import type { PaymentStatus } from '@/types/payment';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUSES } from '@/types/payment';
import { parseISODate, toISODate } from '@/utils/date';
import type { PaymentFormErrors, PaymentFormValues } from '@/utils/validation';
import { validatePaymentForm } from '@/utils/validation';

const STATUS_OPTIONS: readonly ChipOption<PaymentStatus>[] = PAYMENT_STATUSES.map(
  (value) => ({ value, label: PAYMENT_STATUS_LABELS[value] })
);

const SAVE_ERROR_MESSAGE =
  'Could not save to the device database. Please try again.';

interface PaymentFormProps {
  initialValues: PaymentFormValues;
  submitLabel: string;
  onSubmit: (values: PaymentFormValues) => Promise<void>;
}

export function PaymentForm({
  initialValues,
  submitLabel,
  onSubmit,
}: PaymentFormProps) {
  const [values, setValues] = useState<PaymentFormValues>(initialValues);
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function setField<K extends keyof PaymentFormValues>(
    key: K,
    value: PaymentFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) =>
      prev[key] ? { ...prev, [key]: undefined } : prev
    );
    setSaveError(null);
  }

  async function handleSubmit() {
    const result = validatePaymentForm(values);
    setErrors(result);
    setSaveError(null);
    if (Object.keys(result).length > 0) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch {
      setSaveError(SAVE_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  const dateValue = parseISODate(values.payment_date) ?? new Date();

  return (
    <View>
      <FormField
        label="Payer Name"
        value={values.payer_name}
        onChangeText={(text) => setField('payer_name', text)}
        placeholder="e.g. Juan Dela Cruz"
        error={errors.payer_name}
        required
        autoCapitalize="words"
      />
      <FormField
        label="Description"
        value={values.description}
        onChangeText={(text) => setField('description', text)}
        placeholder="e.g. Electric Bill"
        error={errors.description}
        required
      />
      <AmountField
        value={values.amount}
        onChangeText={(text) => setField('amount', text)}
        error={errors.amount}
      />
      <DateField
        value={dateValue}
        onChange={(date) => setField('payment_date', toISODate(date))}
        error={errors.payment_date}
      />
      <View style={styles.statusGroup}>
        <Text style={styles.statusLabel}>Status</Text>
        <FilterChips
          options={STATUS_OPTIONS}
          selected={values.status}
          onSelect={(status) => setField('status', status)}
        />
        {errors.status ? <Text style={styles.error}>{errors.status}</Text> : null}
      </View>
      <FormField
        label="Notes"
        value={values.notes}
        onChangeText={(text) => setField('notes', text)}
        placeholder="Optional – e.g. September monthly payment"
        error={errors.notes}
        multiline
      />
      {saveError ? (
        <View style={styles.saveError}>
          <Text style={styles.saveErrorText}>{saveError}</Text>
        </View>
      ) : null}
      <View style={styles.submit}>
        <AppButton
          label={submitLabel}
          onPress={handleSubmit}
          loading={submitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusGroup: {
    marginBottom: Spacing.lg,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  saveError: {
    backgroundColor: Colors.dangerSoft,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  saveErrorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  submit: {
    marginTop: Spacing.md,
  },
});