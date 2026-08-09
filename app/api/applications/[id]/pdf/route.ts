import { getBlob } from '@/lib/blob'
import { getApplication } from '@/lib/db'
import fs from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, rgb } from 'pdf-lib'
import { Resvg } from '@resvg/resvg-js'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASS = 'lonewolf2026'
export const runtime = 'nodejs'

function esc(value: unknown) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function wrap(value: string, width = 62) { const words = value.split(/\s+/); const lines: string[] = []; let line = ''; for (const word of words) { if ((line + ' ' + word).trim().length > width) { if (line) lines.push(line); line = word } else line = `${line} ${word}`.trim() } if (line) lines.push(line); return lines }
function text(value: unknown) { return String(value ?? '').replace(/[\r\n]+/g, ' ').trim() }

async function svgText(body: string, fontData: Buffer) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1500"><defs><style>@font-face{font-family:NotoBengali;src:url(data:font/woff;base64,${fontData.toString('base64')})}text{font-family:NotoBengali,Arial,sans-serif}</style></defs>${body}</svg>`
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: 1100 } }).render().asPng())
}

async function getImage(pathname: string | null) { if (!pathname) return null; const result = await getBlob(pathname, { access: 'private' }); return result?.buffer || null }

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-admin-pass') !== ADMIN_PASS && request.nextUrl.searchParams.get('pass') !== ADMIN_PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const row = await getApplication(id); if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const fontData = await fs.readFile(path.join(process.cwd(), 'node_modules/@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-400-normal.woff'))
    const pdf = await PDFDocument.create(); const green = rgb(0.10, 0.35, 0.25); const cream = rgb(0.97, 0.95, 0.89)
    const marksheet = await getImage(row.marksheetPath); const proof = await getImage(row.proofPath)
    const lines: string[] = []; const add = (label: string, value: string) => { lines.push(`<text x="80" y="${300 + lines.length * 62}" font-size="28" fill="#61766d">${esc(label)}:</text><text x="350" y="${300 + lines.length * 62}" font-size="30" fill="#17382b">${esc(value || 'দেওয়া হয়নি')}</text>`) }
    add('মোবাইল', text(row.phone)); add('ইমেইল', text(row.email)); add('কলেজ', text(row.college)); add('চা-বাগান', text(row.garden)); add('অভিভাবকের পেশা', text(row.guardianJob)); add('GPA', text(row.gpa)); add('বিভাগ', text(row.department));
    const writerText = row.books.map((book) => row.bookWriters?.[book] ? `${book} — ${row.bookWriters[book]}` : book).join(', ')
    wrap(writerText, 48).forEach((line, index) => lines.push(`<text x="350" y="${790 + index * 42}" font-size="25" fill="#17382b">${esc(line)}</text>`))
    const svgBody = `<rect width="1100" height="1500" fill="#ffffff"/><rect width="1100" height="230" fill="#1a5940"/><text x="80" y="105" font-size="52" fill="#ffffff">চা-বাগান শিক্ষা সহায়তা</text><text x="80" y="165" font-size="26" fill="#f7f1e3">শিক্ষার্থী আবেদনপত্র · পূর্ণাঙ্গ প্রতিবেদন</text><text x="80" y="270" font-size="48" fill="#17382b">${esc(text(row.name))}</text><text x="80" y="335" font-size="23" fill="#61766d">রেফারেন্স: ${esc(id)}</text><text x="700" y="335" font-size="23" fill="#61766d">জমা: ${esc(row.createdAt.toLocaleDateString('bn-BD'))}</text><rect x="55" y="390" width="990" height="720" rx="18" fill="#f4f8f5" stroke="#c7dbd0" stroke-width="3"/><text x="80" y="470" font-size="30" fill="#17382b">আবেদনকারীর তথ্য</text>${lines.join('')}<text x="80" y="1240" font-size="30" fill="#17382b">সংযুক্ত নথি</text><text x="80" y="1295" font-size="25" fill="#61766d">${marksheet ? 'মার্কশীট সংযুক্ত আছে' : 'মার্কশীট পাওয়া যায়নি'} · ${proof ? 'প্রমাণপত্র সংযুক্ত আছে' : 'প্রমাণপত্র পাওয়া যায়নি'}</text>`
    const firstPage = pdf.addPage([595, 842]); const rendered = await svgText(svgBody, fontData); const image = await pdf.embedPng(rendered); firstPage.drawImage(image, { x: 0, y: 0, width: 595, height: 810 })
    const addImagePage = async (title: string, buffer: Buffer | null) => { if (!buffer) return; const page = pdf.addPage([595, 842]); page.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: green }); const titlePng = await svgText(`<rect width="1100" height="1500" fill="#1a5940"/><text x="80" y="120" font-size="42" fill="#ffffff">চা-বাগান শিক্ষা সহায়তা</text><text x="80" y="180" font-size="26" fill="#f7f1e3">${esc(title)}</text>`, fontData); const titleImage = await pdf.embedPng(titlePng); page.drawImage(titleImage, { x: 0, y: 742, width: 595, height: 100 }); const embedded = buffer[0] === 0xff && buffer[1] === 0xd8 ? await pdf.embedJpg(buffer) : await pdf.embedPng(buffer); const scale = Math.min(480 / embedded.width, 600 / embedded.height, 1); page.drawImage(embedded, { x: (595 - embedded.width * scale) / 2, y: 115, width: embedded.width * scale, height: embedded.height * scale }) }
    await addImagePage('মার্কশীট', marksheet); await addImagePage('অভিভাবকের প্রমাণপত্র', proof)
    const pages = pdf.getPages(); pages.forEach((page, index) => page.drawText(`Tea Garden Education Support · ${index + 1}/${pages.length}`, { x: 42, y: 32, size: 8, color: rgb(0.38, 0.46, 0.42) }))
    const output = await pdf.save(); return new NextResponse(output, { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(output.length), 'Content-Disposition': `attachment; filename="${id.replace(/[^a-zA-Z0-9_-]/g, '') || 'application'}.pdf'`, 'Cache-Control': 'no-store' } })
  } catch (error) { console.error('[v0] PDF generation failed', error); return NextResponse.json({ error: 'PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।' }, { status: 500 }) }
}
