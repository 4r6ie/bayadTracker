import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { FormField } from './FormField';

interface AmountFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

const AMOUNT_PATTERN = /^\d*(\.\d{0,2})?$/;

export function AmountField({ value, onChangeText, error }: AmountFieldProps) {
  function handleChange(text: string) {
    const sanitized = text.replace(/\s/g, '');
    if (sanitized === '' || AMOUNT_PATTERN.test(sanitized)) {
      onChangeText(sanitized);
    }
  }

  return (
    <View style={styles.container}>
      <FormField
        label="Amount"
        value={value}
        onChangeText={handleChange}
        placeholder="0.00"
        keyboardType="decimal-pad"
        error={error}
        required
      />
      <Text style={styles.hint}>Enter the payment amount in Philippine Pesos.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
  },
});