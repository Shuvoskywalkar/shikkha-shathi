import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { pool } from '@/lib/db'

const ADMIN_PASS = 'lonewolf2026'
export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-admin-pass') !== ADMIN_PASS && request.nextUrl.searchParams.get('pass') !== ADMIN_PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const result = await pool.query('SELECT * FROM applications WHERE id = $1', [id]); const row = result.rows[0]
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const pdf = await PDFDocument.create(); const page = pdf.addPage([595, 842]); const font = await pdf.embedFont(StandardFonts.Helvetica)
    const lines = [`Tea Garden Education Support Application`, `Reference: ${row.id}`, `Name: ${row.name}`, `Phone: ${row.phone}`, `College: ${row.college}`, `Tea garden: ${row.garden}`, `Guardian job: ${row.guardian_job}`, `GPA: ${row.gpa}`, `Department: ${row.department}`, `Books: ${(Array.isArray(row.books) ? row.books : []).join(', ')}`, `Marksheet: ${row.marksheet_path ? 'Uploaded' : 'Missing'}`, `Proof document: ${row.proof_path ? 'Uploaded' : 'Missing'}`]
    lines.forEach((line, index) => page.drawText(line.replace(/[\r\n]/g, ' '), { x: 48, y: 780 - index * 34, size: index === 0 ? 18 : 11, font, color: rgb(0.1, 0.2, 0.14), maxWidth: 500 }))
    const bytes = await pdf.save(); const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '') || 'application'
    return new NextResponse(new Uint8Array(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(bytes.length), 'Content-Disposition': `attachment; filename="${safeId}.pdf"`, 'Cache-Control': 'no-store' } })
  } catch (error) { console.error('[v0] PDF generation failed', error); return NextResponse.json({ error: 'PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।' }, { status: 500 }) }
}
