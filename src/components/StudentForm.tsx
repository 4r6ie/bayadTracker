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
import type { StudentInput } from '../types/amotan';
import {
  normalizeStudentName,
  validateStudentName,
} from '../utils/studentValidation';

interface StudentFormPage {
    initialName: string;
    submitLabel: string;
    busyLabel: string;
    onSubmit: (input: StudentInput) => Promise<void>;
}

export function StudentForm({
    initialName,
    submitLabel,
    busyLabel,
    onSubmit,
}: StudentFormPage){
    const [name, setName] = useState(initialName);
    const [error, setError] = useState<string | undefined>(undefined);
    const [saving, setSaving] = useState(false);

    async function handleSubmit() {
        const message = validateStudentName(name);
        setError(message);
        if (message){
            return;
        }

        Keyboard.dismiss();
        setSaving(true);
        try {
            await onSubmit({ name: normalizeStudentName(name) });
        }catch (submitError){

            if (__DEV__) {
                console.error('Student form submit failed', submitError);
            }
        }finally{
            setSaving(false);
        }
    }

    return (
        <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS ==='ios' ? 'padding' : undefined}
        >
        <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        >
            <View style={styles.field}>
                <Text style ={styles.label}>Student Name</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder='e.g. argie cabudbud'
                    placeholderTextColor="#8A948E"
                    autoCorrect={false}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    style={[styles.input, error && styles.inputError]}
                    />
                    {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
            <Pressable
                style={[styles.saveButton, saving && styles.disabled]}
                onPress={handleSubmit}
                disabled= {saving}
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