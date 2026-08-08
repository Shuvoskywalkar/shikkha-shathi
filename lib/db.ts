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
  department: string
  books: string[]
  marksheetPath: string | null
  proofPath: string | null
  createdAt: Date
}

export async function queryApplications(): Promise<ApplicationRow[]> {
  const result = await pool.query('SELECT id, name, phone, email, guardian_job AS "guardianJob", college, garden, gpa, department, books, marksheet_path AS "marksheetPath", proof_path AS "proofPath", created_at AS "createdAt" FROM applications ORDER BY created_at DESC')
  return result.rows
}

export async function insertApplication(input: Omit<ApplicationRow, 'createdAt'>) {
  await pool.query('INSERT INTO applications (id, name, phone, email, guardian_job, college, garden, gpa, department, books, marksheet_path, proof_path) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12)', [input.id, input.name, input.phone, input.email, input.guardianJob, input.college, input.garden, input.gpa, input.department, JSON.stringify(input.books), input.marksheetPath, input.proofPath])
}
