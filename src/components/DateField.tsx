import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';

import { Colors, Radius, Spacing } from '@/constants/colors';
import { formatDisplayDate, toISODate } from '@/utils/date';

interface DateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

export function DateField({ value, onChange, error }: DateFieldProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Payment Date<Text style={styles.required}> *</Text>
      </Text>

      {Platform.OS === 'android' ? (
        <>
          <Pressable
            onPress={() => setShowDialog(true)}
            style={({ pressed }) => [
              styles.field,
              pressed && styles.fieldPressed,
              error && styles.fieldError,
            ]}
          >
            <Text style={styles.fieldText}>{formatDisplayDate(toISODate(value))}</Text>
          </Pressable>
          {showDialog ? (
            <DateTimePicker
              value={value}
              mode="date"
              presentation="dialog"
              accentColor={Colors.primary}
              locale="en_US"
              onValueChange={(_event, date) => {
                setShowDialog(false);
                onChange(date);
              }}
              onDismiss={() => setShowDialog(false)}
            />
          ) : null}
        </>
      ) : (
        <View style={[styles.iosContainer, error && styles.fieldError]}>
          <DateTimePicker
            value={value}
            mode="date"
            display="compact"
            accentColor={Colors.primary}
            locale="en_US"
            themeVariant="light"
            onValueChange={(_event, date) => onChange(date)}
          />
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.danger,
  },
  field: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 50,
    justifyContent: 'center',
  },
  fieldPressed: {
    backgroundColor: Colors.background,
  },
  fieldText: {
    fontSize: 15,
    color: Colors.text,
  },
  fieldError: {
    borderColor: Colors.danger,
  },
  iosContainer: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
    marginTop: Spacing.xs,
  },
});