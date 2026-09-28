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
import type { AmotanInput } from '../types/amotan';
import {
  parseAmountToCents,
  validateAmotanAmount,
  validateAmotanTitle,
  validateDueDate,
} from '../utils/amotanValidation';
import { formatDisplayDate, parseDateInput, toISODate } from '../utils/validation';

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

/**
 * Add / edit amotan form: title, target amount and an optional due date.
 *
 * The date field is not the one from `PaymentForm`: that one is required,
 * while an amotan may have no deadline, so this one can be cleared.
 */
export function AmotanForm({
  initialValues,
  submitLabel,
  busyLabel,
  onSubmit,
}: AmotanFormProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [amount, setAmount] = useState(initialValues.amount);
  const [dueDate, setDueDate] = useState(initialValues.dueDate);
  const [errors, setErrors] = useState<AmotanFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);

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
    setPicking(false);
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

  function handleDateChange(_event: DateTimePickerChangeEvent, date: Date) {
    setDueDate(toISODate(date));
  }

  function openPicker() {
    const selected = parseDateInput(dueDate) ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selected,
        mode: 'date',
        onValueChange: handleDateChange,
      });
      return;
    }
    setPicking((open) => !open);
  }

  const dueDateDisplay = !dueDate
    ? 'No deadline'
    : parseDateInput(dueDate)
      ? formatDisplayDate(dueDate)
      : dueDate;

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
        <View style={styles.field}>
          <Text style={styles.label}>Amotan Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Class T-shirt"
            placeholderTextColor="#8A948E"
            autoCorrect={false}
            style={[styles.input, errors.title && styles.inputError]}
          />
          {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Target Amount per Student (₱)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="150.00"
            placeholderTextColor="#8A948E"
            keyboardType="decimal-pad"
            style={[styles.input, errors.amount && styles.inputError]}
          />
          {errors.amount ? (
            <Text style={styles.error}>{errors.amount}</Text>
          ) : (
            <Text style={styles.hint}>
              Numbers only, no commas (for example 150.00).
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Due Date (optional)</Text>
          {Platform.OS === 'web' ? (
            // The native date picker has no web implementation.
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8A948E"
              autoCorrect={false}
              style={[styles.input, errors.dueDate && styles.inputError]}
            />
          ) : (
            <View style={styles.dueDateRow}>
              <Pressable
                onPress={openPicker}
                accessibilityRole="button"
                accessibilityLabel={`Due date: ${dueDateDisplay}`}
                accessibilityHint="Opens the date picker"
                style={({ pressed }) => [
                  styles.input,
                  styles.dateRow,
                  errors.dueDate && styles.inputError,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.dateValue}>{dueDateDisplay}</Text>
                <Text style={styles.dateAction}>{picking ? 'Done' : 'Set'}</Text>
              </Pressable>
              {dueDate ? (
                <Pressable
                  onPress={() => {
                    setDueDate('');
                    setPicking(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear due date"
                  hitSlop={8}
                  style={styles.clearDate}
                >
                  <Text style={styles.clearDateLabel}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
          )}
          {errors.dueDate ? <Text style={styles.error}>{errors.dueDate}</Text> : null}
          {picking && Platform.OS === 'ios' ? (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={parseDateInput(dueDate) ?? new Date()}
                mode="date"
                display="inline"
                onValueChange={handleDateChange}
                onDismiss={() => setPicking(false)}
              />
            </View>
          ) : null}
        </View>

        <Pressable
          style={[styles.saveButton, saving && styles.disabled]}
          onPress={handleSubmit}
          disabled={saving}
          accessibilityRole="button"
        >
          <Text style={styles.saveLabel}>{saving ? busyLabel : submitLabel}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
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
  clearDate: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  clearDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C63B3B',
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
