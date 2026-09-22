import type { Payment } from '../types/payment';
import { formatDisplayDate, parseDateInput, todayISO } from './validation';

/**
 * Pure helpers behind the payments list: search, date filtering, sorting and
 * day grouping.
 *
 * They live outside the screen so the list logic can be reasoned about (and
 * checked) without rendering anything.
 */

/** Which payments the user is looking at, on top of the search text. */
export type DateRange = 'all' | 'today' | 'week' | 'month';

/** Newest first (the default) or oldest first. */
export type SortOrder = 'newest' | 'oldest';

export interface PaymentSection {
  title: string;
  data: Payment[];
}

interface DayKey {
  year: number;
  month: number;
  day: number;
}

function toDayKey(date: Date): DayKey {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

/** Whole days between two calendar dates, ignoring the time of day. */
function daysBetween(from: DayKey, to: DayKey): number {
  const fromTime = Date.UTC(from.year, from.month, from.day);
  const toTime = Date.UTC(to.year, to.month, to.day);
  return Math.round((toTime - fromTime) / 86_400_000);
}

/**
 * Is `paymentDate` (`YYYY-MM-DD`) inside `range`, relative to `today`?
 *
 * Future dates only match when they fall inside the window: "today" is exactly
 * today, "week" is today and the 6 days before it, "month" is the current
 * calendar month. A payment dated tomorrow never shows under the Today chip,
 * so the list always agrees with the chip label.
 */
export function isWithinRange(
  paymentDate: string,
  range: DateRange,
  today: Date
): boolean {
  if (range === 'all') {
    return true;
  }
  const date = parseDateInput(paymentDate);
  if (!date) {
    // An unparseable date cannot be filtered meaningfully, so keep it visible
    // rather than making the payment disappear from the list.
    return true;
  }
  const target = toDayKey(date);
  const base = toDayKey(today);
  switch (range) {
    case 'today':
      return daysBetween(base, target) === 0;
    case 'week':
      // The last 7 days including today.
      return daysBetween(base, target) >= -6 && daysBetween(base, target) <= 0;
    case 'month':
      return target.year === base.year && target.month === base.month;
  }
}

/** Case-insensitive match on payer name or description. Blank query matches all. */
export function matchesQuery(payment: Payment, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return (
    payment.payerName.toLowerCase().includes(needle) ||
    payment.description.toLowerCase().includes(needle)
  );
}

/** Applies the search text and the date range, preserving the incoming order. */
export function filterPayments(
  payments: Payment[],
  query: string,
  range: DateRange,
  today: Date = new Date()
): Payment[] {
  return payments.filter(
    (payment) => matchesQuery(payment, query) && isWithinRange(payment.paymentDate, range, today)
  );
}

/** Compares two `YYYY-MM-DD` days. */
function compareDays(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Sorts a copy of `payments` by payment date, newest or oldest first.
 * Ties on the same day fall back to the id (higher id = more recently saved).
 */
export function sortPayments(payments: Payment[], sort: SortOrder): Payment[] {
  const direction = sort === 'newest' ? -1 : 1;
  return [...payments].sort((a, b) => {
    const byDate = compareDays(a.paymentDate, b.paymentDate);
    if (byDate !== 0) {
      return byDate * direction;
    }
    return (a.id - b.id) * direction;
  });
}

/** `2026-09-22` -> `Today` / `Yesterday` / `September 22, 2026`. */
export function sectionTitle(paymentDate: string, today: string = todayISO()): string {
  const date = parseDateInput(paymentDate);
  if (!date) {
    return paymentDate;
  }
  const todayDate = parseDateInput(today);
  if (todayDate) {
    const difference = daysBetween(toDayKey(todayDate), toDayKey(date));
    if (difference === 0) {
      return 'Today';
    }
    if (difference === -1) {
      return 'Yesterday';
    }
  }
  return formatDisplayDate(paymentDate);
}

/**
 * Groups sorted payments into one section per payment date.
 * Section order follows the sort direction, so "Oldest" reads chronologically.
 */
export function groupPaymentsByDate(
  payments: Payment[],
  sort: SortOrder,
  today: string = todayISO()
): PaymentSection[] {
  const sections = new Map<string, PaymentSection>();
  for (const payment of sortPayments(payments, sort)) {
    const existing = sections.get(payment.paymentDate);
    if (existing) {
      existing.data.push(payment);
    } else {
      sections.set(payment.paymentDate, {
        title: sectionTitle(payment.paymentDate, today),
        data: [payment],
      });
    }
  }
  return [...sections.values()];
}
