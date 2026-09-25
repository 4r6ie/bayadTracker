import type { Amotan, AmotanInput } from '../types/amotan';
import { getDatabase } from './database';

interface AmotanRow {
    id: number;
    title: string;
    amount_cents: number;
    due_date: string | null;
    created_at: string;
    updated_at: string;
}

function toAmotan(row: AmotanRow): Amotan {
    return {
        id: Number(row.id),
        title: String(row.title),
        amountCents: Number(row.amount_cents),
        dueDate: row.due_date ? String(row.due_date) : null,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
    }
}

function isValid(id:number): boolean{
    return Number.isInteger(id) && id > 0;
}

export async function getAmotans(): Promise<Amotan[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<AmotanRow>(
        `SELECT id, title, amount_cents, due_date, created_at, updated_at
         FROM amotan
         ORDER BY due_date IS NULL, due_date ASC, title COLLATE NOCASE ASC`
    );
    return rows.map(toAmotan);
}

export async function getAmotanById(
    id:number
): Promise<Amotan | null> {
    if(!isValid(id)){
        return null;
    }

    const db = await getDatabase();
    const row = await db.getFirstAsync<AmotanRow>(
        `SELECT id, title, amount_cents, due_date, created_at, updated_at
        FROM amotan
        WHERE id = ?
        LIMIT 1`,
        [id]
    );

    return row ? toAmotan(row) : null;
}

export async function createAmotan(input: AmotanInput): Promise<number> {
    const db = await getDatabase();
    const timestamp = new Date().toISOString();
     
        const result = await db.runAsync(
            `INSERT INTO amotan (title, amount_cents, due_date,created_at, updated_at)
            VALUES (?,?,?,?,?)`,
            [input.title.trim(),input.amountCents,input.dueDate, timestamp, timestamp]
        );
    return result.lastInsertRowId;
}

export async function updateAmotan(id: number, input: AmotanInput): Promise<boolean>{
    if (!isValid(id)){
        return false
    }
    const db = await getDatabase();
   
        const result = await db.runAsync(`
            UPDATE amotan
            SET title=?, 
            amount_cents=?,
            due_date = ?,
            updated_at= ?
            WHERE id = ?`,[input.title.trim(),input.amountCents,input.dueDate, new Date().toISOString(), id]);
        return result.changes>0;
}

export async function deleteAmotan(id: number): Promise<boolean>{
    if(!isValid(id)){
        return false;
    }
    const db = await getDatabase();
    const result = await db.runAsync(`
        DELETE FROM amotan 
        WHERE id = ?`,[id]);
    return result.changes>0;
}
