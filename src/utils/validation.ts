import type { PaymentInput } from '../types/payment';

/** Raw text typed by the user in the add / edit form. */
export interface PaymentFormValues {
  payerName: string;
  amount: string;
  description: string;
  paymentDate: string;
}

export interface PaymentFormErrors {
  payerName?: string;
  amount?: string;
  description?: string;
  paymentDate?: string;
}

/** `2026-09-22` -> `September 22, 2026`. Falls back to the raw value. */
export function formatDisplayDate(iso: string): string {
  const date = parseDateInput(iso);
  if (!date) {
    return iso;
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** `1500` -> `₱1,500.00`. Never throws on bad data. */
export function formatAmount(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

/** Today's date as `YYYY-MM-DD`, used as the form default. */
export function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Accepts plain numbers only (`1500`, `1500.50`).
 * Rejects negatives, zero, peso signs, letters, and anything else.
 */
export function parseAmount(text: string): number | null {
  const normalized = text.trim().replace(/,/g, '');
  if (normalized === '' || normalized.includes('₱')) {
    return null;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

/** Returns a Date only when `value` is a real `YYYY-MM-DD` date. */
export function parseDateInput(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }
  const [year, month, day] = trimmed.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Validates every field before it reaches the database. */
export function validatePaymentForm(
  values: PaymentFormValues
): PaymentFormErrors {
  const errors: PaymentFormErrors = {};

  const payerName = values.payerName.trim().replace(/\s+/g, ' ');
  if (!payerName) {
    errors.payerName = 'Payer name is required.';
  } else if (payerName.length < 2) {
    errors.payerName = 'Payer name must be at least 2 characters.';
  }

  const amount = values.amount.trim();
  if (!amount) {
    errors.amount = 'Amount is required.';
  } else if (parseAmount(amount) === null) {
    errors.amount = 'Enter a valid amount greater than 0 (numbers only).';
  }

  if (!values.description.trim()) {
    errors.description = 'Description is required.';
  }

  if (!values.paymentDate.trim()) {
    errors.paymentDate = 'Payment date is required (YYYY-MM-DD).';
  } else if (parseDateInput(values.paymentDate) === null) {
    errors.paymentDate = 'Enter a valid date as YYYY-MM-DD.';
  }

  return errors;
}

/**
 * Converts validated form text into a storable record.
 * Returns `null` when invalid, so callers never save bad data.
 */
export function toPaymentInput(
  values: PaymentFormValues
): PaymentInput | null {
  if (Object.keys(validatePaymentForm(values)).length > 0) {
    return null;
  }
  const amount = parseAmount(values.amount.trim());
  if (amount === null) {
    return null;
  }
  return {
    payerName: values.payerName.trim().replace(/\s+/g, ' '),
    amount,
    description: values.description.trim(),
    paymentDate: values.paymentDate.trim(),
  };
}
