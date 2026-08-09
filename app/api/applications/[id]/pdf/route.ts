import { getBlob } from '@/lib/blob'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import 'regenerator-runtime/runtime'
import { getApplication } from '@/lib/db'
import fs from 'node:fs/promises'
import path from 'node:path'

const ADMIN_PASS = 'lonewolf2026'
export const runtime = 'nodejs'

async function imageBytes(pathname: string | null) {
  if (!pathname) return null
  const blob = await getBlob(pathname, { access: 'private' })
  return blob ? blob.buffer : null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-admin-pass') !== ADMIN_PASS && request.nextUrl.searchParams.get('pass') !== ADMIN_PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const row = await getApplication(id)
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const pdf = await PDFDocument.create()
    pdf.registerFontkit(fontkit)
    const bengaliFont = await fs.readFile(path.join(process.cwd(), 'public/fonts/NotoSansBengali.ttf'))
    const font = await pdf.embedFont(bengaliFont)
    const bold = font
    let page = pdf.addPage([595, 842]); let y = 760
    page.drawRectangle({ x: 34, y: 718, width: 526, height: 96, color: rgb(0.12, 0.39, 0.24), borderColor: rgb(0.93, 0.88, 0.74), borderWidth: 1.5, borderRadius: 10 })
    page.drawText('Tea Garden Education Support', { x: 48, y: 784, size: 18, font: bold, color: rgb(1, 1, 1) })
    page.drawText('Application summary with attached documents', { x: 48, y: 766, size: 11, font, color: rgb(0.94, 0.94, 0.94) })
    const draw = (text: string, size = 11, isBold = false) => { if (y < 140) { page = pdf.addPage([595, 842]); y = 760 }; page.drawText(text.replace(/[\r\n]/g, ' ').slice(0, 120), { x: 48, y, size, font: isBold ? bold : font, color: rgb(0.1, 0.2, 0.14), maxWidth: 500 }); y -= size + 18 }
    y = 680
    draw(`Reference: ${row.id}`, 12, true); y -= 6
    draw(`Name: ${row.name}`)
    draw(`Phone: ${row.phone}`)
    draw(`Email: ${row.email || 'Not provided'}`)
    draw(`College: ${row.college}`)
    draw(`Tea garden: ${row.garden}`)
    draw(`Guardian job: ${row.guardianJob}`)
    draw(`GPA: ${row.gpa}`)
    draw(`Department: ${row.department}`)
    draw(`Books: ${row.books.join(', ')}`)
    draw(`Submitted: ${row.createdAt.toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}`)
    for (const [label, pathname] of [['Marksheet', row.marksheetPath], ['Guardian proof', row.proofPath]] as const) {
      const bytes = await imageBytes(pathname); if (!bytes) continue
      page = pdf.addPage([595, 842]); page.drawRectangle({ x: 34, y: 720, width: 526, height: 90, color: rgb(0.96, 0.97, 0.94), borderColor: rgb(0.82, 0.86, 0.8), borderWidth: 1, borderRadius: 10 })
      page.drawText(label, { x: 48, y: 782, size: 14, font: bold, color: rgb(0.1, 0.2, 0.14) })
      try { const image = pathname.toLowerCase().endsWith('.png') ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes); const scale = Math.min(520 / image.width, 620 / image.height); page.drawImage(image, { x: (595 - image.width * scale) / 2, y: 72, width: image.width * scale, height: image.height * scale }) } catch { page.drawText('Image could not be embedded.', { x: 48, y: 742, size: 11, font }) }
    }
    const bytes = await pdf.save(); const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '') || 'application'
    return new NextResponse(new Uint8Array(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(bytes.length), 'Content-Disposition': `attachment; filename="${safeId}.pdf"`, 'Cache-Control': 'no-store' } })
  } catch (error) { console.error('[v0] PDF generation failed', error); return NextResponse.json({ error: 'PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।' }, { status: 500 }) }
}
