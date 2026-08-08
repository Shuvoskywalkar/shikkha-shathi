import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getApplication } from '@/lib/db'

const ADMIN_PASS = 'lonewolf2026'
export const runtime = 'nodejs'

async function imageBytes(pathname: string | null) {
  if (!pathname) return null
  const blob = await get(pathname, { access: 'private' })
  return blob ? Buffer.from(await new Response(blob.stream).arrayBuffer()) : null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-admin-pass') !== ADMIN_PASS && request.nextUrl.searchParams.get('pass') !== ADMIN_PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const row = await getApplication(id)
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
    let page = pdf.addPage([595, 842]); let y = 790
    const draw = (text: string, size = 11, isBold = false) => { if (y < 60) { page = pdf.addPage([595, 842]); y = 790 }; page.drawText(text.replace(/[\r\n]/g, ' ').slice(0, 100), { x: 48, y, size, font: isBold ? bold : font, color: rgb(0.1, 0.2, 0.14), maxWidth: 500 }); y -= size + 15 }
    draw('Tea Garden Education Support Application', 18, true); draw(`Reference: ${row.id}`, 11, true); y -= 8
    draw(`Name: ${row.name}`); draw(`Phone: ${row.phone}`); draw(`Email: ${row.email || 'Not provided'}`); draw(`College: ${row.college}`); draw(`Tea garden: ${row.garden}`); draw(`Guardian job: ${row.guardianJob}`); draw(`GPA: ${row.gpa}`); draw(`Department: ${row.department}`); draw(`Books: ${row.books.join(', ')}`); draw(`Submitted: ${row.createdAt.toISOString()}`)
    for (const [label, pathname] of [['Marksheet', row.marksheetPath], ['Guardian proof', row.proofPath]] as const) {
      const bytes = await imageBytes(pathname); if (!bytes) continue
      page = pdf.addPage([595, 842]); page.drawText(label, { x: 48, y: 800, size: 16, font: bold, color: rgb(0.1, 0.2, 0.14) })
      try { const image = pathname.toLowerCase().endsWith('.png') ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes); const scale = Math.min(500 / image.width, 700 / image.height); page.drawImage(image, { x: (595 - image.width * scale) / 2, y: 60, width: image.width * scale, height: image.height * scale }) } catch { page.drawText('Image could not be embedded.', { x: 48, y: 760, size: 11, font }) }
    }
    const bytes = await pdf.save(); const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '') || 'application'
    return new NextResponse(new Uint8Array(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(bytes.length), 'Content-Disposition': `attachment; filename="${safeId}.pdf"`, 'Cache-Control': 'no-store' } })
  } catch (error) { console.error('[v0] PDF generation failed', error); return NextResponse.json({ error: 'PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।' }, { status: 500 }) }
}
