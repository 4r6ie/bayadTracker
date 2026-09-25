import {
    AmotanPayment,
    AmotanPaymentInput,
    AmotanRosterEntry,
    StudentChecklistEntry,
} from '../types/amotan';
import { getPaymentStatus } from '../utils/paymentStatus';
import { getAmotanById } from './amotanRepository';
import { getDatabase } from './database';
import { isValidId } from './ids';
import { getStudentById } from './studentRepository';

interface AmotanPaymentRow{
    id: number;
    student_id: number;
    amotan_id: number;
    amount_cents: number;
    paid_date: string;
    created_at: string;
}

function toAmotanPayment(row: AmotanPaymentRow): AmotanPayment {
    return{
        id: Number(row.id),
        studentId: Number(row.student_id),
        amotanId: Number(row.amotan_id),
        amountCents: Number(row.amount_cents),
        paidDate: String(row.paid_date),
        createdAt: String(row.created_at),
    };
}

export async function recordPayment(input: AmotanPaymentInput): Promise<number>{
    const db = await getDatabase();
    const result = await db.runAsync(`
        INSERT INTO amotan_payments (student_id, amotan_id, amount_cents, paid_date, created_at)
        VALUES (?, ?, ?, ?, ?)`,
    [
        input.studentId,
        input.amotanId,
        input.amountCents,
        input.paidDate,
        new Date().toISOString(),
    ]
    );
    return result.lastInsertRowId;
}

export async function getPaymentForStudentAndAmotan(
    studentId: number,
    amotanId: number
): Promise<AmotanPayment[]>{
    if(!isValidId(studentId)|| !isValidId(amotanId)){
        return [];
    }

    const db = await getDatabase();
    const rows = await db.getAllAsync<AmotanPaymentRow>(`
        SELECT id, student_id, amotan_id, amount_cents, paid_date, created_at
        FROM amotan_payments
        WHERE student_id = ? AND amotan_id =?
        ORDER BY paid_date DESC, id DESC`,
    [studentId, amotanId]);
    return rows.map(toAmotanPayment);
}

export async function updatePayment(
    id: number,
    input: Pick<AmotanPaymentInput,'amountCents' | 'paidDate'>
): Promise<boolean>{
    if (!isValidId(id)){
        return false;
    }

    const db = await getDatabase();
    const result = await db.runAsync(`
        UPDATE amotan_payments 
        SET amount_cents = ?, paid_date = ?
        WHERE id =?`,
        [input.amountCents,input.paidDate,id]
    );
    return result.changes>0;
}

export async function deletePayment(id: number): Promise<boolean> {
    if (!isValidId(id)){
        return false;
    }
    const db = await getDatabase();
    const result = await db.runAsync(`
        DELETE FROM amotan_payments
        WHERE id = ?`,
    [id]);
    return result.changes>0;
}


export async function getAmotanRoster(
    amotanId: number
): Promise<AmotanRosterEntry[]> {
    if (!isValidId(amotanId)){
        return []
    }
    const amotan = await getAmotanById(amotanId);
    if (!amotan){
        return []
    }
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
        student_id: number;
        student_name: string;
        paid_cents: number;
    }>(`
        SELECT s.id AS student_id,
               s.name AS student_name,
               COALESCE(SUM(p.amount_cents), 0) AS paid_cents
        FROM students s
        LEFT JOIN amotan_payments p
            ON p.student_id = s.id AND p.amotan_id = ?
        GROUP BY s.id
        ORDER BY s.name COLLATE NOCASE ASC`,
    [amotanId]);

    return rows.map((row)=> {
        const paidCents = Number(row.paid_cents);
        return {
            studentId: Number(row.student_id),
            studentName: String(row.student_name),
            paidCents,
            status: getPaymentStatus(paidCents, amotan.amountCents),
        };
    });
}

export async function getStudentChecklist(
    studentId: number
): Promise<StudentChecklistEntry[]>{
    if (!isValidId(studentId)){
        return [];
    }

    const student = await getStudentById(studentId);
    if (!student){
        return [];
    }
    
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
        amotan_id: number;
        title: string;
        target_cents: number;
        due_date: string | null;
        paid_cents: number;
    }>(`
         SELECT a.id AS amotan_id,
               a.title AS title,
               a.amount_cents AS target_cents,
               a.due_date AS due_date,
               COALESCE(SUM(p.amount_cents), 0) AS paid_cents
         FROM amotan a
         LEFT JOIN amotan_payments p 
            ON p.amotan_id = a.id AND p.student_id=?
         GROUP BY a.id
         ORDER BY a.due_date IS NULL, a.due_date ASC, a.title COLLATE NOCASE ASC`,
         [studentId]);

         return rows.map((row)=>{
            const paidCents = Number(row.paid_cents);
            const targetCents = Number(row.target_cents);
        return {
            amotanId: Number(row.amotan_id),
            title: String(row.title),
            targetCents,
            dueDate: row.due_date === null ? null : String(row.due_date),
            paidCents,
            status: getPaymentStatus(paidCents, targetCents),
        };
         });


}