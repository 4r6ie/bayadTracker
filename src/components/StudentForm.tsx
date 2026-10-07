import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { makeStyles } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import type { StudentInput } from '../types/amotan';
import { normalizeStudentName, validateStudentName } from '../utils/studentValidation';
import { Button } from './ui/Button';
import { TextField } from './ui/Controls';

interface StudentFormProps {
  initialName: string;
  submitLabel: string;
  busyLabel: string;
  /** The screen saves; the form owns the input and its validation. */
  onSubmit: (input: StudentInput) => Promise<void>;
}

/** Add / edit student form. */
export function StudentForm({ initialName, submitLabel, busyLabel, onSubmit }: StudentFormProps) {
  const styles = useStyles();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const message = validateStudentName(name);
    setError(message);
    if (message) {
      return;
    }
    // Hide the keyboard first so it is gone when the screen goes back.
    Keyboard.dismiss();
    setSaving(true);
    try {
      await onSubmit({ name: normalizeStudentName(name) });
    } catch (submitError) {
      // The screen shows the alert; log so a failure is never silent.
      if (__DEV__) {
        console.error('Student form submit failed', submitError);
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
          label="Student name"
          value={name}
          onChangeText={setName}
          placeholder="Juan Dela Cruz"
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          error={error}
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
