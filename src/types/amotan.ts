/**
 * Amotan monitoring data model (one school section).
 *
 * Ids are UUID strings so rows created offline on two phones never collide.
 * Money is always whole centavos: ₱150.50 is stored as `15050`.
 * Dates are `YYYY-MM-DD` text.
 */

export interface Student {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type StudentInput = Pick<Student, 'name'>;

export interface Amotan {
  id: string;
  title: string;
  /** Target each student has to pay, in centavos. */
  amountCents: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AmotanInput = Pick<Amotan, 'title' | 'amountCents' | 'dueDate'>;

/** One installment a student paid toward an amotan. */
export interface AmotanPayment {
  id: string;
  studentId: string;
  amotanId: string;
  amountCents: number;
  paidDate: string;
  createdAt: string;
  updatedAt: string;
}

export type AmotanPaymentInput = Pick<
  AmotanPayment,
  'studentId' | 'amotanId' | 'amountCents' | 'paidDate'
>;

/**
 * Derived from the sum of installments vs the target, never stored, so it
 * cannot drift out of sync with the actual payments.
 */
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

/** A student plus their standing across every live amotan (Students list). */
export interface StudentSummary extends Student {
  amotanCount: number;
  /** Amotan this student has fully paid. */
  paidCount: number;
  /** Total still owed across all amotan, in centavos. */
  owedCents: number;
}

/** An amotan plus how the whole section is doing on it (Amotan list). */
export interface AmotanSummary extends Amotan {
  studentCount: number;
  /** Students who have fully paid. */
  paidCount: number;
  collectedCents: number;
}

/** One student in an amotan's roster, with how much they have paid. */
export interface AmotanRosterEntry {
  studentId: string;
  studentName: string;
  paidCents: number;
  status: PaymentStatus;
}

/** One amotan in a student's checklist, with how much they have paid. */
export interface StudentChecklistEntry {
  amotanId: string;
  title: string;
  targetCents: number;
  dueDate: string | null;
  paidCents: number;
  status: PaymentStatus;
}
