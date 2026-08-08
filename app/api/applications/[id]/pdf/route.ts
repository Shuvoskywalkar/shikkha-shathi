import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-admin-pass') !== 'lonewolf2026' && request.nextUrl.searchParams.get('pass') !== 'lonewolf2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const result = await pool.query('SELECT * FROM applications WHERE id = $1', [id])
  const row = result.rows[0]
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const pdf = await PDFDocument.create(); const page = pdf.addPage([595, 842]); const font = await pdf.embedFont(StandardFonts.Helvetica)
  const lines = [`Tea Garden Education Support Application`, `Reference: ${row.id}`, `Name: ${row.name}`, `Phone: ${row.phone}`, `College: ${row.college}`, `Tea garden: ${row.garden}`, `Guardian job: ${row.guardian_job}`, `GPA: ${row.gpa}`, `Department: ${row.department}`, `Books: ${(row.books as string[]).join(', ')}`, `Marksheet: ${row.marksheet_path ? 'Uploaded' : 'Missing'}`, `Proof document: ${row.proof_path ? 'Uploaded' : 'Missing'}`]
  lines.forEach((line, index) => page.drawText(line, { x: 48, y: 780 - index * 34, size: index === 0 ? 18 : 11, font, color: rgb(0.1, 0.2, 0.14) }))
  const bytes = await pdf.save()
  return new NextResponse(new Uint8Array(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(bytes.length), 'Content-Disposition': `attachment; filename="${id}.pdf"` } })
}
