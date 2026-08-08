import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { queryApplications } from '@/lib/db'

export async function GET(request: NextRequest) {
  if (request.headers.get('x-admin-pass') !== 'lonewolf2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryApplications()
  const sheet = XLSX.utils.json_to_sheet(rows.map((row) => ({ রেফারেন্স: row.id, নাম: row.name, মোবাইল: row.phone, কলেজ: row.college, 'চা-বাগান': row.garden, 'অভিভাবকের পেশা': row.guardianJob, GPA: row.gpa, বিভাগ: row.department, বই: row.books.join(', '), জমাদানের_সময়: row.createdAt.toISOString(), মার্কশীট: row.marksheetPath ? 'সংযুক্ত' : 'নেই', প্রমাণপত্র: row.proofPath ? 'সংযুক্ত' : 'নেই' })))
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, 'Applications')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buffer, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="tea-garden-applications.xlsx"' } })
}
