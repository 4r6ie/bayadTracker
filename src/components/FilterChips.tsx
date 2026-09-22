import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/colors';

export interface ChipOption<T extends string> {
  label: string;
  value: T;
}

interface FilterChipsProps<T extends string> {
  options: readonly ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export function FilterChips<T extends string>({
  options,
  selected,
  onSelect,
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
            ]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelSelected: {
    color: Colors.white,
  },
});