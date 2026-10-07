import type { PaymentStatus } from '../types/amotan';

export function getPaymentStatus(
    paidCents: number,
    targetCents: number
): PaymentStatus {
    if(paidCents<=0){
        return 'unpaid';
    }

    if(paidCents >= targetCents){
        return 'paid';
    }
    return 'partial';
}
