import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { font, radius, space, TOUCH } from '../theme/tokens';
import { formatDisplayDate, parseDateInput, toISODate } from '../utils/validation';
import { TextField } from './ui/Controls';

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
  const styles = useStyles();
  const { theme } = useTheme();
  const [picking, setPicking] = useState(false);
  // The picker needs a real date to open on; fall back to today.
  const selected = parseDateInput(value) ?? new Date();

  if (Platform.OS === 'web') {
    return (
      <TextField
        label={`${label} (YYYY-MM-DD)`}
        value={value}
        onChangeText={onChange}
        placeholder={optional ? 'Leave blank for none' : '2026-10-01'}
        autoCorrect={false}
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
            error ? styles.inputError : null,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.value, !value && styles.placeholder]}>{display}</Text>
          <Text style={styles.action}>{picking ? 'Done' : 'Change'}</Text>
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
            <Ionicons name="close-circle" size={24} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {picking && Platform.OS === 'ios' ? (
        <View style={styles.picker}>
          <DateTimePicker
            value={selected}
            mode="date"
            display="inline"
            accentColor={theme.colors.accent}
            onValueChange={handleValueChange}
            onDismiss={() => setPicking(false)}
          />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  field: {
    marginBottom: space.lg,
  },
  label: {
    fontSize: font.footnote,
    fontWeight: '700',
    color: t.colors.textSecondary,
    marginBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  input: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    minHeight: TOUCH + 6,
  },
  inputError: {
    borderColor: t.colors.danger,
  },
  pressed: {
    opacity: 0.7,
  },
  value: {
    flex: 1,
    fontSize: font.callout,
    color: t.colors.text,
  },
  placeholder: {
    color: t.colors.textMuted,
  },
  action: {
    fontSize: font.body,
    fontWeight: '700',
    color: t.colors.accentText,
  },
  clear: {
    padding: space.xs,
  },
  error: {
    color: t.colors.danger,
    fontSize: font.footnote,
    marginTop: space.xs,
  },
  picker: {
    marginTop: space.sm,
    backgroundColor: t.colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    // The inline iOS calendar has no intrinsic height to measure against.
    height: 340,
  },
}));
