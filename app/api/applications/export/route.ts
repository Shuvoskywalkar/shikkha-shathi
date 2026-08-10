import { getBlob } from '@/lib/blob'
import ExcelJS from 'exceljs'
import { NextRequest, NextResponse } from 'next/server'
import { queryApplications } from '@/lib/db'

const ADMIN_PASS = 'lonewolf2026'
export const runtime = 'nodejs'

async function blobBuffer(pathname: string | null) {
  if (!pathname) return null
  const result = await getBlob(pathname, { access: 'private' })
  if (!result) return null
  return result.buffer
}

export async function GET(request: NextRequest) {
  if (request.headers.get('x-admin-pass') !== ADMIN_PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const rows = await queryApplications()
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Tea Garden Education Support'
    workbook.created = new Date()
    const sheet = workbook.addWorksheet('আবেদনসমূহ', { views: [{ state: 'frozen', ySplit: 1 }] })
    sheet.columns = [
      { header: 'রেফারেন্স', key: 'id', width: 18 }, { header: 'নাম', key: 'name', width: 24 }, { header: 'মোবাইল', key: 'phone', width: 16 }, { header: 'ইমেইল', key: 'email', width: 28 }, { header: 'কলেজ', key: 'college', width: 30 }, { header: 'চা-বাগান', key: 'garden', width: 24 }, { header: 'অভিভাবকের পেশা', key: 'guardianJob', width: 24 }, { header: 'GPA', key: 'gpa', width: 10 }, { header: 'বিভাগ', key: 'department', width: 16 }, { header: 'বই ও লেখক/প্রকাশনী', key: 'books', width: 58 }, { header: 'জমাদানের সময়', key: 'createdAt', width: 24 }, { header: 'মার্কশীট প্রিভিউ', key: 'marksheet', width: 22 }, { header: 'প্রমাণপত্র প্রিভিউ', key: 'proof', width: 22 }, { header: 'PDF', key: 'pdf', width: 16 },
    ]
    sheet.getRow(1).height = 28
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4D3A' } }
    const configuredOrigin = process.env.BETTER_AUTH_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
    const origin = configuredOrigin ? (configuredOrigin.startsWith('http') ? configuredOrigin : `https://${configuredOrigin}`) : request.nextUrl.origin
    const baseUrl = origin.replace(/\/$/, '')
    for (const row of rows) {
      const excelRow = sheet.addRow({ id: row.id, name: row.name, phone: row.phone, email: row.email || '', college: row.college, garden: row.garden, guardianJob: row.guardianJob, gpa: Number(row.gpa), department: row.department, books: row.books.map((book) => row.bookWriters?.[book] ? `${book} — ${row.bookWriters[book]}` : book).join(', '), createdAt: row.createdAt.toLocaleString('bn-BD') })
      excelRow.height = 110
      const rowNumber = excelRow.number
      const marksheetUrl = row.marksheetPath ? `${baseUrl}/api/applications/${row.id}/files/marksheet?pass=${ADMIN_PASS}` : ''
      const proofUrl = row.proofPath ? `${baseUrl}/api/applications/${row.id}/files/proof?pass=${ADMIN_PASS}` : ''
      const pdfUrl = `${baseUrl}/api/applications/${row.id}/pdf?pass=${ADMIN_PASS}`
      for (const [column, pathname, url] of [[12, row.marksheetPath, marksheetUrl], [13, row.proofPath, proofUrl]] as const) {
        if (!pathname || !url) continue
        const image = await blobBuffer(pathname)
        if (image) {
          const extension = pathname.toLowerCase().endsWith('.png') ? 'png' : 'jpeg'
          const imageId = workbook.addImage({ buffer: image, extension })
          sheet.addImage(imageId, { tl: { col: column - 1 + 0.08, row: rowNumber - 1 + 0.08 }, ext: { width: 125, height: 95 } })
        }
        sheet.getCell(rowNumber, column).value = { text: column === 12 ? '\u09ae\u09be\u09b0\u09cd\u0995\u09b6\u09c0\u099f \u09a6\u09c7\u0996\u09c1\u09a8' : '\u09aa\u09cd\u09b0\u09ae\u09be\u09a3\u09aa\u09a4\u09cd\u09b0 \u09a6\u09c7\u0996\u09c1\u09a8', hyperlink: url }
        sheet.getCell(rowNumber, column).font = { color: { argb: 'FF0563C1' }, underline: 'single' }
      }
      sheet.getCell(rowNumber, 14).value = { text: 'PDF ডাউনলোড', hyperlink: pdfUrl }
      sheet.getCell(rowNumber, 14).font = { color: { argb: 'FF0563C1' }, underline: 'single' }
    }
    sheet.autoFilter = { from: 'A1', to: 'N1' }
    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(Buffer.from(buffer), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="tea-garden-applications.xlsx"', 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[v0] Excel export failed', error)
    return NextResponse.json({ error: 'Excel ফাইল তৈরি করা যায়নি' }, { status: 500 })
  }
}
