import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { queryApplications } from '@/lib/db'

export async function GET(request: NextRequest) {
  if (request.headers.get('x-admin-pass') !== 'lonewolf2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryApplications()
  const origin = request.nextUrl.origin
  const exportRows = rows.map((row) => ({ রেফারেন্স: row.id, নাম: row.name, মোবাইল: row.phone, কলেজ: row.college, 'চা-বাগান': row.garden, 'অভিভাবকের পেশা': row.guardianJob, GPA: row.gpa, বিভাগ: row.department, বই: row.books.join(', '), জমাদানের_সময়: row.createdAt.toISOString(), মার্কশীট: row.marksheetPath ? 'সংযুক্ত' : 'নেই', মার্কশীট_ফাইল: row.marksheetPath ? row.marksheetPath.split('/').pop() : '', মার্কশীট_লিংক: row.marksheetPath ? `${origin}/api/applications/${row.id}/files/marksheet?pass=lonewolf2026` : '', প্রমাণপত্র: row.proofPath ? 'সংযুক্ত' : 'নেই', প্রমাণপত্র_ফাইল: row.proofPath ? row.proofPath.split('/').pop() : '', প্রমাণপত্র_লিংক: row.proofPath ? `${origin}/api/applications/${row.id}/files/proof?pass=lonewolf2026` : '' }))
  const sheet = XLSX.utils.json_to_sheet(exportRows)
  const headers = Object.keys(exportRows[0] || {})
  const linkColumns = ['মার্কশীট_লিংক', 'প্রমাণপত্র_লিংক']
  linkColumns.forEach((column) => { const columnIndex = headers.indexOf(column); if (columnIndex < 0) return; exportRows.forEach((row, rowIndex) => { const address = XLSX.utils.encode_cell({ r: rowIndex + 1, c: columnIndex }); const value = String(row[column as keyof typeof row] || ''); if (value) sheet[address].l = { Target: value, Tooltip: 'ফাইল খুলুন' } }) })
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, 'Applications')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buffer, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="tea-garden-applications.xlsx"' } })
}
