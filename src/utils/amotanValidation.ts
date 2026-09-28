import { parseAmount, parseDateInput } from './validation';

export function validateAmotanTitle(title: string): string | undefined {
  const trimmed = title.trim();
  if (!trimmed) {
    return 'Amotan title is required.';
  }
  if (trimmed.length > 80) {
    return 'Title must be 80 characters or fewer.';
  }
  return undefined;
}

/**
 * Peso text ("150.50") -> whole centavos (15050), or null when invalid.
 * `parseAmount` already rejects negatives, zero, letters and the peso sign.
 */
export function parseAmountToCents(text: string): number | null {
  const pesos = parseAmount(text);
  if (pesos === null) {
    return null;
  }
  // Round so float noise (e.g. 1.005 * 100) can never leave a fraction.
  return Math.round(pesos * 100);
}

export function validateAmotanAmount(text: string): string | undefined {
  if (!text.trim()) {
    return 'Target amount is required.';
  }
  if (parseAmountToCents(text) === null) {
    return 'Enter a valid amount greater than 0 (numbers only).';
  }
  return undefined;
}

/** The due date is optional: blank means "no deadline", not an error. */
export function validateDueDate(text: string): string | undefined {
  if (!text.trim()) {
    return undefined;
  }
  if (parseDateInput(text) === null) {
    return 'Enter a valid date as YYYY-MM-DD, or leave it blank.';
  }
  return undefined;
}

/** `15050` -> `₱150.50`. */
export function formatCents(cents: number): string {
  const safeCents = Number.isFinite(cents) ? cents : 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeCents / 100);
}
