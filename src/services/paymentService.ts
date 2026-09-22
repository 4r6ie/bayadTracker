import { initializeDatabase } from '@/database/database';
import * as repository from '@/database/paymentRepository';
import type { Payment, PaymentInput, PaymentQuery, PaymentStats } from '@/types/payment';

export const PaymentService = {
  async listPayments(query?: PaymentQuery): Promise<Payment[]> {
    const db = await initializeDatabase();
    return repository.getPayments(db, query);
  },

  async getPayment(id: number): Promise<Payment | null> {
    const db = await initializeDatabase();
    return repository.getPaymentById(db, id);
  },

  async addPayment(input: PaymentInput): Promise<number> {
    const db = await initializeDatabase();
    return repository.createPayment(db, input);
  },

  async updatePayment(id: number, input: PaymentInput): Promise<boolean> {
    const db = await initializeDatabase();
    return repository.updatePayment(db, id, input);
  },

  async removePayment(id: number): Promise<boolean> {
    const db = await initializeDatabase();
    return repository.deletePayment(db, id);
  },

  async removeAllPayments(): Promise<void> {
    const db = await initializeDatabase();
    return repository.deleteAllPayments(db);
  },

  async getStats(): Promise<PaymentStats> {
    const db = await initializeDatabase();
    return repository.getPaymentStats(db);
  },

  async countPayments(): Promise<number> {
    const db = await initializeDatabase();
    return repository.getPaymentCount(db);
  },
};