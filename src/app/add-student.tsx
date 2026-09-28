import { router } from 'expo-router';
import { Alert } from 'react-native';
import { StudentForm } from '../components/StudentForm';
import {
    createStudent,
    DuplicateStudentError,
} from '../database/studentRepository';
import type { StudentInput } from '../types/amotan';

export default function AddStudentScreen(){
    async function handleSubmit(input: StudentInput) {
        try {
            await createStudent(input);
            router.back();
        }catch (error) {
            if (error instanceof DuplicateStudentError){
                Alert.alert(
                    'Already added',
                    `A Student named "${input.name}" already exists.`
                );
                return;
            }
            if (__DEV__){
                console.error('Failed to save student', error);
            }
            Alert.alert("Unable to save",'Could not save the student. Please try again.');
        }
    }
    return (
        <StudentForm
        initialName=""
        submitLabel="Save student"
        busyLabel="Saving…"
        onSubmit={handleSubmit}
        />
    );
}   