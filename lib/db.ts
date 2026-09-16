import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool)

export type ApplicationRow = {
  id: string
  name: string
  phone: string
  email: string | null
  guardianJob: string
  college: string
  garden: string
  gpa: string
  futurePlan: string
  department: string
  books: string[]
  bookWriters: Record<string, string>
  marksheetPath: string | null
  proofPath: string | null
  createdAt: Date
}

export async function queryApplications(): Promise<ApplicationRow[]> {
  await pool.query('ALTER TABLE applications ADD COLUMN IF NOT EXISTS future_plan TEXT NOT NULL DEFAULT \'\'')
  const result = await pool.query('SELECT id, name, phone, email, guardian_job AS "guardianJob", college, garden, gpa, future_plan AS "futurePlan", department, books, book_writers AS "bookWriters", marksheet_path AS "marksheetPath", proof_path AS "proofPath", created_at AS "createdAt" FROM applications ORDER BY created_at DESC')
  return result.rows
}

export async function insertApplication(input: Omit<ApplicationRow, 'createdAt'>) {
  await pool.query('ALTER TABLE applications ADD COLUMN IF NOT EXISTS future_plan TEXT NOT NULL DEFAULT \'\'')
  await pool.query('INSERT INTO applications (id, name, phone, email, guardian_job, college, garden, gpa, future_plan, department, books, book_writers, marksheet_path, proof_path) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14)', [input.id, input.name, input.phone, input.email, input.guardianJob, input.college, input.garden, input.gpa, input.futurePlan, input.department, JSON.stringify(input.books), JSON.stringify(input.bookWriters), input.marksheetPath, input.proofPath])
}

export async function getApplication(id: string): Promise<ApplicationRow | null> {
  const result = await pool.query('SELECT id, name, phone, email, guardian_job AS "guardianJob", college, garden, gpa, future_plan AS "futurePlan", department, books, book_writers AS "bookWriters", marksheet_path AS "marksheetPath", proof_path AS "proofPath", created_at AS "createdAt" FROM applications WHERE id = $1', [id])
  return result.rows[0] || null
}
