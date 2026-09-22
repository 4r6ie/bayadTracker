/**
 * Payment data model.
 *
 * Keep it simple: only the fields required by the spec.
 * `amount` is stored as a number (no peso sign in the database).
 * `paymentDate` is stored as `YYYY-MM-DD` text.
 */
export interface Payment {
  id: number;
  payerName: string;
  amount: number;
  description: string;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
}

/** Values the user can create or edit. */
export type PaymentInput = Pick<
  Payment,
  'payerName' | 'amount' | 'description' | 'paymentDate'
>;
