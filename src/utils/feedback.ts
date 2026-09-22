import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * A short, light tap, used for presses that are navigation or confirmation —
 * opening a payment, opening the add screen, revealing a swipe action.
 *
 * Best-effort: haptics do not exist on web and can reject on devices without a
 * haptic motor, so the promise is swallowed instead of surfacing an error the
 * user cannot act on.
 */
export function tapFeedback(): void {
  if (Platform.OS === 'web') {
    return;
  }
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
