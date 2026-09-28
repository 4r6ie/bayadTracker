/**
 * Shared date and amount helpers used by the forms and screens.
 * Dates are `YYYY-MM-DD` text everywhere in the app.
 */

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
 * A `Date` -> `YYYY-MM-DD`.
 *
 * Reads the local calendar fields instead of `toISOString()`, so a date picked
 * late in the day never shifts to the previous day.
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Today's date as `YYYY-MM-DD`, used as the form default. */
export function todayISO(): string {
  return toISODate(new Date());
}

/**
 * Accepts plain numbers only (`1500`, `1500.50`) and returns pesos.
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
