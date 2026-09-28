import { Alert } from 'react-native';
import { recordPayment } from '../database/amotanPaymentRepository';
import { formatCents } from './amotanValidation';
import { tapFeedback } from './feedback';
import { todayISO } from './validation';

interface PayRemainingArgs {
  studentId: string;
  studentName: string;
  amotanId: string;
  amotanTitle: string;
  remainingCents: number;
  /** Called after the payment is saved, to reload the screen. */
  onDone: () => void;
}

/**
 * The checklist's checkbox: confirms, then records the rest of the amount
 * as one payment dated today. Asking first matters because it is money.
 */
export function confirmPayRemaining({
  studentId,
  studentName,
  amotanId,
  amotanTitle,
  remainingCents,
  onDone,
}: PayRemainingArgs): void {
  if (remainingCents <= 0) {
    return;
  }
  Alert.alert(
    'Mark as paid?',
    `Record ${formatCents(remainingCents)} from ${studentName} for ${amotanTitle}, dated today.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Record',
        onPress: async () => {
          try {
            await recordPayment({
              studentId,
              amotanId,
              amountCents: remainingCents,
              paidDate: todayISO(),
            });
            tapFeedback();
            onDone();
          } catch (error) {
            if (__DEV__) {
              console.error('Failed to record payment', error);
            }
            Alert.alert('Unable to Save', 'Could not record the payment. Please try again.');
          }
        },
      },
    ]
  );
}
