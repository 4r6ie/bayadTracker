export type PaymentStatus = 'PAID' | 'PENDING' | 'CANCELLED';

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'PAID',
  'PENDING',
  'CANCELLED',
];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: 'Paid',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled',
};

export interface Payment {
  id: number;
  payer_name: string;
  description: string;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentInput {
  payer_name: string;
  description: string;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
  notes: string | null;
}

export interface PaymentStats {
  total_collected: number;
  total_payments: number;
  today_payments: number;
  monthly_total: number;
}

export type PaymentFilter = 'ALL' | PaymentStatus;

export const PAYMENT_FILTERS: readonly PaymentFilter[] = [
  'ALL',
  'PAID',
  'PENDING',
  'CANCELLED',
];

export type PaymentSort =
  | 'NEWEST'
  | 'OLDEST'
  | 'AMOUNT_HIGH'
  | 'AMOUNT_LOW';

export interface PaymentQuery {
  search?: string;
  filter?: PaymentFilter;
  sort?: PaymentSort;
  limit?: number;
  offset?: number;
}