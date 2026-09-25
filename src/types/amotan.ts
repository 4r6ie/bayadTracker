export interface Student{
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export type StudentInput= Pick<Student, 'name'>;

export interface Amotan{
    id: number;
    title: string;
    amountCents: number;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;  
}

export type AmotanInput = Pick<Amotan, 'title' | 'amountCents' | 'dueDate'>;

export interface AmotanPayment{
    id: number;
    studentId: number;
    amotanId: number;
    amountCents: number;
    paidDate: string;
    createdAt: string; 
}

export type AmotanPaymentInput = Pick<AmotanPayment, 'studentId' | 'amotanId' | 'amountCents' | 'paidDate'>;

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface AmotanRosterEntry {
    studentId: number;
    studentName: string;
    paidCents: number;
    status: PaymentStatus;
}

export interface StudentChecklistEntry {
    amotanId: number;
    title: string;
    targetCents: number;
    dueDate: string | null;
    paidCents: number;
    status: PaymentStatus;
}