import type { PaymentInput, PaymentStatus } from '@/types/payment';
import { PAYMENT_STATUSES } from '@/types/payment';
import { parseAmountInput } from '@/utils/currency';
import { parseISODate } from '@/utils/date';

export interface PaymentFormValues {
  payer_name: string;
  description: string;
  amount: string;
  payment_date: string;
  status: PaymentStatus;
  notes: string;
}

export interface PaymentFormErrors {
  payer_name?: string;
  description?: string;
  amount?: string;
  payment_date?: string;
  status?: string;
  notes?: string;
}

export function createEmptyForm(): PaymentFormValues {
  return {
    payer_name: '',
    description: '',
    amount: '',
    payment_date: '',
    status: 'PAID',
    notes: '',
  };
}

export function validatePaymentForm(values: PaymentFormValues): PaymentFormErrors {
  const errors: PaymentFormErrors = {};

  const payerName = values.payer_name.trim();
  if (!payerName) {
    errors.payer_name = 'Payer name is required.';
  } else if (payerName.length < 2) {
    errors.payer_name = 'Payer name must be at least 2 characters.';
  }

  if (!values.description.trim()) {
    errors.description = 'Description is required.';
  }

  if (!values.amount.trim()) {
    errors.amount = 'Amount is required.';
  } else if (parseAmountInput(values.amount) === null) {
    errors.amount = 'Enter a valid amount greater than 0.';
  }

  if (!values.payment_date) {
    errors.payment_date = 'Payment date is required.';
  } else if (parseISODate(values.payment_date) === null) {
    errors.payment_date = 'Payment date is invalid.';
  }

  if (!PAYMENT_STATUSES.includes(values.status)) {
    errors.status = 'Select a valid status.';
  }

  return errors;
}

export function toPaymentInput(values: PaymentFormValues): PaymentInput | null {
  const amount = parseAmountInput(values.amount);
  if (amount === null) {
    return null;
  }
  const notes = values.notes.trim();
  return {
    payer_name: values.payer_name.trim(),
    description: values.description.trim(),
    amount,
    payment_date: values.payment_date,
    status: values.status,
    notes: notes ? notes : null,
  };
}