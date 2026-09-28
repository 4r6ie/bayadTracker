import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { font, radius, space, TOUCH } from '../../theme/tokens';
import { tapFeedback } from '../../utils/feedback';

/** Label, input, and either an error or a hint under it. */
export function TextField({
  label,
  error,
  hint,
  ...inputProps
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  const styles = useStyles();
  const { theme } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        {...inputProps}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        style={[styles.input, error ? styles.inputError : null, inputProps.style]}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Search box with a magnifier icon. */
export function SearchField(props: TextInputProps) {
  const styles = useStyles();
  const { theme } = useTheme();
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={theme.colors.textMuted} />
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        autoCorrect={false}
        clearButtonMode="while-editing"
        {...props}
        style={styles.searchInput}
      />
    </View>
  );
}

/** Filter chips (All / Not yet / Paid). */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              tapFeedback();
              onChange(option.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Two or three mutually exclusive options in one pill (the style toggle). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.segments} accessibilityRole="radiogroup">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              tapFeedback();
              onChange(option.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The round "+" button floating over a list. */
export function Fab({
  onPress,
  accessibilityLabel,
}: {
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const styles = useStyles();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.fab,
        { bottom: space.xl + Math.max(insets.bottom - 34, 0) },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Ionicons name="add" size={30} color={theme.colors.onAccent} />
    </Pressable>
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
  input: {
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontSize: font.callout,
    color: t.colors.text,
    minHeight: TOUCH + 6,
  },
  inputError: {
    borderColor: t.colors.danger,
  },
  error: {
    color: t.colors.danger,
    fontSize: font.footnote,
    marginTop: space.xs,
  },
  hint: {
    color: t.colors.textSecondary,
    fontSize: font.footnote,
    marginTop: space.xs,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: t.colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: TOUCH,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: font.body,
    color: t.colors.text,
    paddingVertical: space.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.md,
  },
  chip: {
    paddingHorizontal: space.md + 2,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  chipActive: {
    backgroundColor: t.colors.text,
    borderColor: t.colors.text,
  },
  chipLabel: {
    fontSize: font.footnote,
    fontWeight: '700',
    color: t.colors.textSecondary,
  },
  chipLabelActive: {
    color: t.colors.surface,
  },
  segments: {
    flexDirection: 'row',
    backgroundColor: t.colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: TOUCH - 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm + 2,
  },
  segmentActive: {
    backgroundColor: t.colors.surface,
    shadowColor: t.colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentLabel: {
    fontSize: font.body,
    fontWeight: '600',
    color: t.colors.textSecondary,
  },
  segmentLabelActive: {
    color: t.colors.text,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: space.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: t.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: t.colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
}));
