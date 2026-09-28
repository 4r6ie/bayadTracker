import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { makeStyles } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import type { AmotanInput } from '../types/amotan';
import {
  parseAmountToCents,
  validateAmotanAmount,
  validateAmotanTitle,
  validateDueDate,
} from '../utils/amotanValidation';
import { DateField } from './DateField';
import { Button } from './ui/Button';
import { TextField } from './ui/Controls';

/** Raw text in the form, before it is converted to an `AmotanInput`. */
export interface AmotanFormValues {
  title: string;
  /** Peso text, e.g. `150.00`. */
  amount: string;
  /** `YYYY-MM-DD`, or `''` for no deadline. */
  dueDate: string;
}

interface AmotanFormErrors {
  title?: string;
  amount?: string;
  dueDate?: string;
}

interface AmotanFormProps {
  initialValues: AmotanFormValues;
  submitLabel: string;
  busyLabel: string;
  onSubmit: (input: AmotanInput) => Promise<void>;
}

/** Add / edit amotan form: title, target amount and an optional due date. */
export function AmotanForm({ initialValues, submitLabel, busyLabel, onSubmit }: AmotanFormProps) {
  const styles = useStyles();
  const [title, setTitle] = useState(initialValues.title);
  const [amount, setAmount] = useState(initialValues.amount);
  const [dueDate, setDueDate] = useState(initialValues.dueDate);
  const [errors, setErrors] = useState<AmotanFormErrors>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const nextErrors: AmotanFormErrors = {
      title: validateAmotanTitle(title),
      amount: validateAmotanAmount(amount),
      dueDate: validateDueDate(dueDate),
    };
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.amount || nextErrors.dueDate) {
      return;
    }
    // Already validated above; checked again so TypeScript narrows to number.
    const amountCents = parseAmountToCents(amount);
    if (amountCents === null) {
      return;
    }

    Keyboard.dismiss();
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        amountCents,
        dueDate: dueDate.trim() === '' ? null : dueDate.trim(),
      });
    } catch (submitError) {
      // Screens show their own alerts; log so a rejected submit is never silent.
      if (__DEV__) {
        console.error('Amotan form submit failed', submitError);
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Class T-shirt"
          autoCorrect={false}
          error={errors.title}
        />
        <TextField
          label="Amount per student (₱)"
          value={amount}
          onChangeText={setAmount}
          placeholder="150.00"
          keyboardType="decimal-pad"
          error={errors.amount}
          hint="Numbers only, no commas."
        />
        <DateField
          label="Due date (optional)"
          value={dueDate}
          onChange={setDueDate}
          error={errors.dueDate}
          optional
          emptyLabel="No deadline"
        />
        <Button
          label={submitLabel}
          busy={saving}
          busyLabel={busyLabel}
          icon="checkmark"
          onPress={handleSubmit}
        />
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
  },
}));
