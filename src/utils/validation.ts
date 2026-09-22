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

/**
 * `1500` -> `₱1,500.00`. Never throws on bad data.
 *
 * `currencyDisplay` is spelled out even though `'symbol'` is the default: PHP
 * resolves to the `₱` symbol in ICU for `en-PH` and for the `en` fallback, so
 * the peso sign renders the same on every platform.
 */
export function formatAmount(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    currencyDisplay: 'symbol',
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

/**
 * Validates every field and builds the storable record in a single pass.
 * `validatePaymentForm` and `toPaymentInput` are both thin views over this,
 * so the amount text is parsed exactly once per call.
 */
function parsePaymentForm(values: PaymentFormValues): {
  errors: PaymentFormErrors;
  input: PaymentInput | null;
} {
  const errors: PaymentFormErrors = {};

  const payerName = values.payerName.trim().replace(/\s+/g, ' ');
  if (!payerName) {
    errors.payerName = 'Payer name is required.';
  } else if (payerName.length < 2) {
    errors.payerName = 'Payer name must be at least 2 characters.';
  }

  const amountText = values.amount.trim();
  // `parseAmount` tolerates thousands separators ("1,500") so a pasted value
  // still works, even though the decimal-pad keyboard never types a comma.
  const amount = amountText === '' ? null : parseAmount(amountText);
  if (!amountText) {
    errors.amount = 'Amount is required.';
  } else if (amount === null) {
    errors.amount = 'Enter a valid amount greater than 0 (numbers only).';
  }

  const description = values.description.trim();
  if (!description) {
    errors.description = 'Description is required.';
  }

  const paymentDate = values.paymentDate.trim();
  if (!paymentDate) {
    errors.paymentDate = 'Payment date is required (YYYY-MM-DD).';
  } else if (parseDateInput(paymentDate) === null) {
    errors.paymentDate = 'Enter a valid date as YYYY-MM-DD.';
  }

  if (amount === null || Object.keys(errors).length > 0) {
    return { errors, input: null };
  }

  return {
    errors,
    input: { payerName, amount, description, paymentDate },
  };
}

/** Validates every field before it reaches the database. */
export function validatePaymentForm(
  values: PaymentFormValues
): PaymentFormErrors {
  return parsePaymentForm(values).errors;
}

/**
 * Converts validated form text into a storable record.
 * Returns `null` when invalid, so callers never save bad data.
 */
export function toPaymentInput(
  values: PaymentFormValues
): PaymentInput | null {
  return parsePaymentForm(values).input;
}
