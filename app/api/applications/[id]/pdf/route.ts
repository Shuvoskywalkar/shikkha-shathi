import { getBlob } from '@/lib/blob'
import { getApplication } from '@/lib/db'
import PDFDocument from 'pdfkit'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

const ADMIN_PASS = 'lonewolf2026'
export const runtime = 'nodejs'

async function getImage(pathname: string | null) {
  if (!pathname) return null
  const blob = await getBlob(pathname, { access: 'private' })
  return blob?.buffer || null
}

function safeText(value: unknown) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim()
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-admin-pass') !== ADMIN_PASS && request.nextUrl.searchParams.get('pass') !== ADMIN_PASS) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    const row = await getApplication(id)
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const fontPath = path.join(process.cwd(), 'public/fonts/NotoSansBengali.ttf')
    await fs.access(fontPath)
    const font = await fs.readFile(fontPath)
    const marksheet = await getImage(row.marksheetPath)
    const proof = await getImage(row.proofPath)
    const doc = new PDFDocument({ size: 'A4', margin: 46, autoFirstPage: false, info: { Title: `আবেদন ${id}`, Author: 'Tea Garden Education Support' } })
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    const finished = new Promise<Buffer>((resolve, reject) => { doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject) })
    const green = '#19583f'; const ink = '#17382d'; const muted = '#66766f'; const cream = '#f5f1e5'
    const addHeader = (label: string) => {
      doc.rect(0, 0, 595, 92).fill(green)
      doc.font(font).fontSize(21).fillColor('#ffffff').text('চা-বাগান শিক্ষা সহায়তা', 46, 25)
      doc.fontSize(10).fillColor('#dbe9df').text(label, 46, 57)
      doc.fillColor(ink)
    }
    const field = (label: string, value: string) => {
      const y = doc.y
      doc.roundedRect(46, y, 503, 42, 6).fill('#f7faf7')
      doc.font(font).fontSize(9).fillColor(muted).text(label, 60, y + 8)
      doc.font(font).fontSize(12).fillColor(ink).text(value || 'দেওয়া হয়নি', 60, y + 22, { width: 475, lineBreak: false })
      doc.y = y + 52
    }
    doc.addPage(); addHeader('শিক্ষার্থী আবেদনপত্র · পূর্ণাঙ্গ প্রতিবেদন')
    doc.font(font).fontSize(10).fillColor(muted).text(`রেফারেন্স: ${id}`, 46, 116)
    doc.font(font).fontSize(16).fillColor(ink).text(safeText(row.name), 46, 140)
    doc.font(font).fontSize(10).fillColor(muted).text(`জমা: ${row.createdAt.toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}`, 46, 164)
    doc.y = 198
    field('মোবাইল', safeText(row.phone)); field('ইমেইল', safeText(row.email) || 'দেওয়া হয়নি'); field('কলেজ', safeText(row.college)); field('চা-বাগান', safeText(row.garden)); field('অভিভাবকের পেশা', safeText(row.guardianJob)); field('GPA', safeText(row.gpa)); field('বিভাগ', safeText(row.department)); field('নির্বাচিত বই', row.books.map(safeText).join(', '))
    const addImagePage = (title: string, image: Buffer | null) => {
      if (!image) return
      doc.addPage(); addHeader(title)
      doc.font(font).fontSize(15).fillColor(ink).text(title, 46, 120)
      doc.image(image, 65, 160, { fit: [465, 600], align: 'center', valign: 'center' })
    }
    addImagePage('মার্কশীট', marksheet); addImagePage('অভিভাবকের প্রমাণপত্র', proof)
    doc.bufferPages(); const range = doc.bufferedPageRange(); for (let index = range.start; index < range.start + range.count; index += 1) { doc.switchToPage(index); doc.font(font).fontSize(8).fillColor(muted).text(`Tea Garden Education Support  ·  ${index + 1}/${range.count}`, 46, 806, { align: 'center', width: 503 }) }
    doc.end()
    const output = await finished
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '') || 'application'
    return new NextResponse(new Uint8Array(output), { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(output.length), 'Content-Disposition': `attachment; filename="${safeId}.pdf"`, 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[v0] PDF generation failed', error)
    return NextResponse.json({ error: 'PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।' }, { status: 500 })
  }
}
