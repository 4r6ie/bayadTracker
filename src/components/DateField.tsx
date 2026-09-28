import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatDisplayDate, parseDateInput, toISODate } from '../utils/validation';

interface DateFieldProps {
  label: string;
  /** `YYYY-MM-DD`, or `''` when an optional date is not set. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /**
   * Optional dates show `emptyLabel` when blank and get a Clear button;
   * required ones always hold a date.
   */
  optional?: boolean;
  emptyLabel?: string;
}

/**
 * A date chosen with the platform's own picker: a dialog on Android, an
 * inline calendar on iOS, and a typed `YYYY-MM-DD` field on web (the picker
 * has no web version). The value stays `YYYY-MM-DD` text everywhere.
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  optional = false,
  emptyLabel = 'Not set',
}: DateFieldProps) {
  const [picking, setPicking] = useState(false);
  // The picker needs a real date to open on; fall back to today.
  const selected = parseDateInput(value) ?? new Date();

  if (Platform.OS === 'web') {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label} (YYYY-MM-DD)</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={optional ? 'Leave blank for none' : 'YYYY-MM-DD'}
          placeholderTextColor="#8A948E"
          autoCorrect={false}
          style={[styles.input, error && styles.inputError]}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
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

  const display = !value
    ? emptyLabel
    : parseDateInput(value)
      ? formatDisplayDate(value)
      : value;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${display}`}
          accessibilityHint="Opens the date picker"
          style={({ pressed }) => [
            styles.input,
            styles.dateRow,
            error && styles.inputError,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.dateValue, !value && styles.placeholder]}>{display}</Text>
          <Text style={styles.dateAction}>{picking ? 'Done' : 'Change'}</Text>
        </Pressable>
        {optional && value ? (
          <Pressable
            onPress={() => {
              onChange('');
              setPicking(false);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            hitSlop={8}
            style={styles.clear}
          >
            <Text style={styles.clearLabel}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {picking && Platform.OS === 'ios' ? (
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
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17211C',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  placeholder: {
    color: '#8A948E',
  },
  dateAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#127A52',
    marginLeft: 12,
  },
  clear: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  clearLabel: {
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
  error: {
    color: '#C63B3B',
    fontSize: 13,
    marginTop: 4,
  },
});
