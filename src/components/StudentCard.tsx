import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Student } from '../types/amotan';
interface StudentCardProps {
    student: Student;
    onPress?: ()=> void;
    onLongPress?:()=> void;
}

export function StudentCard({ student, onPress, onLongPress }:
    StudentCardProps ) {
        const initial = student.name.charAt(0).toUpperCase();

        return (
            <Pressable
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="button"
                accessibilityLabel={student.name}
                accessibilityHint="Long press to delete"
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                >
                    <View style={styles.avatar}>
                        <Text style={styles.avatarLabel}>{initial}</Text>
                    </View>
                    <Text style={styles.name} numberOfLines={1}>
                            {student.name}
                    </Text>
                    
            </Pressable>

        );
    }

    const styles = StyleSheet.create({
        card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#127A52',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#17211C',
  },

    }
)