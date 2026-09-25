import type { Student, StudentInput } from '../types/amotan';
import { getDatabase } from './database';
import { isValidId } from './ids';

interface StudentRow {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

function toStudent(row: StudentRow): Student {
    return {
        id: Number(row.id),
        name: String(row.name),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
    }
}

export class DuplicateStudentError extends Error {
    constructor(){
        super('A student with the name already exists. Please choose a different name.');
        this.name = 'DuplicateStudentError';
    }
}

function rethrowIfDuplicate(error: unknown): never{
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')){
        throw new DuplicateStudentError();
    }
    throw error;
}

export async function getStudents(): Promise<Student[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<StudentRow>(
        `SELECT id, name, created_at, updated_at
         FROM students
         ORDER BY name COLLATE NOCASE ASC`
    );
    return rows.map(toStudent);
}

export async function getStudentById(id: number): Promise<Student | null> {
    if (!isValidId(id))  {
        return null;
    }
    const db = await getDatabase();
    const row = await db.getFirstAsync<StudentRow>(
        `SELECT id, name, created_at, updated_at
        FROM students
        WHERE id = ?
        LIMIT 1`,
        [id]
    );
    return row ? toStudent(row) : null;
}


export async function createStudent(input: StudentInput): Promise<number> {
    const db = await getDatabase();
    const timestamp = new Date().toISOString();
    try {
        const result = await db.runAsync(
            `INSERT INTO students (name, created_at, updated_at)
             VALUES (?, ?, ?)`,
            [input.name.trim(), timestamp, timestamp]
        );
        return result.lastInsertRowId;
    } catch (error) {
        
    return rethrowIfDuplicate(error);
    }
}
 

export async function updateStudent(
    id: number,
    input: StudentInput
): Promise<boolean> {
    if(!isValidId(id)){
        return false;
    }
    const db = await getDatabase();
    try {
        const result = await db.runAsync(
            `UPDATE students
             SET name = ?, updated_at = ?
             WHERE id = ?`,
            [input.name.trim(), new Date().toISOString(), id]
        );
        return result.changes > 0;
    } catch (error) {
      return  rethrowIfDuplicate(error);
    }
}

export async function deleteStudent(id: number): Promise<boolean> {
    if(!isValidId(id)){
        return false;
    }
    const db = await getDatabase();
    const result = await db.runAsync(
        `DELETE FROM students
         WHERE id = ?`,
        [id]
    );
    return result.changes > 0;
}

