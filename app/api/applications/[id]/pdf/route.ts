import { getBlob } from '@/lib/blob'
import { getApplication } from '@/lib/db'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

const ADMIN_PASS = 'lonewolf2026'
export const runtime = 'nodejs'

async function getImage(pathname: string | null) {
  if (!pathname) return null
  const result = await getBlob(pathname, { access: 'private' })
  return result?.buffer || null
}

function text(value: unknown) { return String(value ?? '').replace(/[\r\n]+/g, ' ').trim() }
function drawLine(page: any, font: any, label: string, value: string, y: number) {
  page.drawText(label, { x: 54, y, size: 10, font, color: rgb(0.38, 0.46, 0.42) })
  page.drawText(value || 'দেওয়া হয়নি', { x: 178, y, size: 11, font, color: rgb(0.09, 0.22, 0.17), maxWidth: 355 })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-admin-pass') !== ADMIN_PASS && request.nextUrl.searchParams.get('pass') !== ADMIN_PASS) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    const row = await getApplication(id)
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const fontBytes = await fs.readFile(path.join(process.cwd(), 'public/fonts/NotoSansBengali.ttf'))
    const pdf = await PDFDocument.create()
    pdf.registerFontkit(fontkit)
    const font = await pdf.embedFont(fontBytes, { subset: false })
    const marksheet = await getImage(row.marksheetPath)
    const proof = await getImage(row.proofPath)
    const green = rgb(0.10, 0.35, 0.25); const cream = rgb(0.97, 0.95, 0.89); const ink = rgb(0.09, 0.22, 0.17); const muted = rgb(0.38, 0.46, 0.42)
    const page = pdf.addPage([595, 842])
    page.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: green })
    page.drawText('চা-বাগান শিক্ষা সহায়তা', { x: 42, y: 790, size: 22, font, color: rgb(1, 1, 1) })
    page.drawText('শিক্ষার্থী আবেদনপত্র · পূর্ণাঙ্গ প্রতিবেদন', { x: 42, y: 766, size: 11, font, color: cream })
    page.drawText(text(row.name), { x: 42, y: 700, size: 20, font, color: ink })
    page.drawText(`রেফারেন্স: ${id}`, { x: 42, y: 678, size: 10, font, color: muted })
    page.drawText(`জমা: ${row.createdAt.toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}`, { x: 300, y: 678, size: 10, font, color: muted })
    page.drawRectangle({ x: 34, y: 220, width: 527, height: 420, color: rgb(0.97, 0.98, 0.97), borderColor: rgb(0.82, 0.88, 0.84), borderWidth: 1 })
    const fields: [string, string][] = [['মোবাইল', text(row.phone)], ['ইমেইল', text(row.email)], ['কলেজ', text(row.college)], ['চা-বাগান', text(row.garden)], ['অভিভাবকের পেশা', text(row.guardianJob)], ['GPA', text(row.gpa)], ['বিভাগ', text(row.department)], ['নির্বাচিত বই', row.books.map(text).join(', ')]]
    fields.forEach(([label, value], index) => drawLine(page, font, `${label}:`, value, 602 - index * 43))
    page.drawText('সংযুক্ত নথি', { x: 42, y: 178, size: 14, font, color: ink })
    page.drawText(`${marksheet ? 'মার্কশীট সংযুক্ত আছে' : 'মার্কশীট পাওয়া যায়নি'} · ${proof ? 'প্রমাণপত্র সংযুক্ত আছে' : 'প্রমাণপত্র পাওয়া যায়নি'}`, { x: 42, y: 154, size: 10, font, color: muted })
    const addImagePage = async (title: string, buffer: Buffer | null) => {
      if (!buffer) return
      const imagePage = pdf.addPage([595, 842])
      imagePage.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: green })
      imagePage.drawText('চা-বাগান শিক্ষা সহায়তা', { x: 42, y: 790, size: 22, font, color: rgb(1, 1, 1) })
      imagePage.drawText(title, { x: 42, y: 766, size: 11, font, color: cream })
      const image = buffer[0] === 0xff && buffer[1] === 0xd8 ? await pdf.embedJpg(buffer) : await pdf.embedPng(buffer)
      const scale = Math.min(480 / image.width, 600 / image.height, 1)
      imagePage.drawImage(image, { x: (595 - image.width * scale) / 2, y: 115, width: image.width * scale, height: image.height * scale })
    }
    await addImagePage('মার্কশীট', marksheet)
    await addImagePage('অভিভাবকের প্রমাণপত্র', proof)
    const pages = pdf.getPages()
    pages.forEach((item, index) => item.drawText(`Tea Garden Education Support · ${index + 1}/${pages.length}`, { x: 42, y: 32, size: 8, font, color: muted }))
    const output = await pdf.save()
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '') || 'application'
    return new NextResponse(output, { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(output.length), 'Content-Disposition': `attachment; filename="${safeId}.pdf"`, 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[v0] PDF generation failed', error)
    return NextResponse.json({ error: 'PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।' }, { status: 500 })
  }
}
