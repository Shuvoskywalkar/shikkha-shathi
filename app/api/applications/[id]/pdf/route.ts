import 'regenerator-runtime/runtime'
import { getBlob } from '@/lib/blob'
import { getApplication } from '@/lib/db'
import fs from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASS = 'lonewolf2026'
export const runtime = 'nodejs'

function esc(value: unknown) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function wrap(value: string, width = 62) { const words = value.split(/\s+/); const lines: string[] = []; let line = ''; for (const word of words) { if ((line + ' ' + word).trim().length > width) { if (line) lines.push(line); line = word } else line = `${line} ${word}`.trim() } if (line) lines.push(line); return lines }
function text(value: unknown) { return String(value ?? '').replace(/[\r\n]+/g, ' ').trim() }


async function getImage(pathname: string | null) { if (!pathname) return null; const result = await getBlob(pathname, { access: 'private' }); return result?.buffer || null }

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('x-admin-pass') !== ADMIN_PASS && request.nextUrl.searchParams.get('pass') !== ADMIN_PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params; const row = await getApplication(id); if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const fontData = await fs.readFile(path.join(process.cwd(), 'node_modules/@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-400-normal.woff'))
    const pdf = await PDFDocument.create(); pdf.registerFontkit(fontkit); const bengaliFont = await pdf.embedFont(fontData); const latinFont = await pdf.embedFont(StandardFonts.Helvetica); const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold); const green = rgb(0.10, 0.35, 0.25); const cream = rgb(0.97, 0.95, 0.89)
    const marksheet = await getImage(row.marksheetPath); const proof = await getImage(row.proofPath)
    const lines: string[] = []; const add = (label: string, value: string) => { lines.push(`<text x="80" y="${300 + lines.length * 62}" font-size="28" fill="#61766d">${esc(label)}:</text><text x="350" y="${300 + lines.length * 62}" font-size="30" fill="#17382b">${esc(value || 'দেওয়া হয়নি')}</text>`) }
    add('মোবাইল', text(row.phone)); add('ইমেইল', text(row.email)); add('কলেজ', text(row.college)); add('চা-বাগান', text(row.garden)); add('অভিভাবকের পেশা', text(row.guardianJob)); add('GPA', text(row.gpa)); add('বিভাগ', text(row.department));
    const writerText = row.books.map((book) => row.bookWriters?.[book] ? `${book} — ${row.bookWriters[book]}` : book).join(', ')
    wrap(writerText, 48).forEach((line, index) => lines.push(`<text x="350" y="${790 + index * 42}" font-size="25" fill="#17382b">${esc(line)}</text>`))
    const firstPage = pdf.addPage([595, 842]); firstPage.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: green }); firstPage.drawText('চা-বাগান শিক্ষা সহায়তা', { x: 42, y: 790, size: 24, font: bengaliFont, color: rgb(1, 1, 1) }); firstPage.drawText('শিক্ষার্থী আবেদনপত্র · পূর্ণাঙ্গ প্রতিবেদন', { x: 42, y: 765, size: 12, font: bengaliFont, color: cream }); firstPage.drawText(text(row.name), { x: 42, y: 705, size: 22, font: bengaliFont, color: green }); firstPage.drawText(`রেফারেন্স: ${id}`, { x: 42, y: 680, size: 11, font: bengaliFont, color: rgb(0.38, 0.46, 0.42) }); firstPage.drawText(`জমা: ${row.createdAt.toLocaleDateString('bn-BD')}`, { x: 380, y: 680, size: 11, font: bengaliFont, color: rgb(0.38, 0.46, 0.42) }); firstPage.drawRectangle({ x: 28, y: 150, width: 539, height: 490, color: rgb(0.96, 0.98, 0.97), borderColor: rgb(0.78, 0.86, 0.82), borderWidth: 1 }); firstPage.drawText('আবেদনকারীর তথ্য', { x: 42, y: 610, size: 16, font: bengaliFont, color: green }); let y = 580; for (const [label, value] of [['মোবাইল', text(row.phone)], ['ইমেইল', text(row.email)], ['কলেজ', text(row.college)], ['চা-বাগান', text(row.garden)], ['অভিভাবকের পেশা', text(row.guardianJob)], ['GPA', text(row.gpa)], ['বিভাগ', text(row.department)]]) { firstPage.drawText(`${label}:`, { x: 42, y, size: 12, font: bengaliFont, color: rgb(0.38, 0.46, 0.42) }); wrap(value, 42).slice(0, 2).forEach((line, index) => firstPage.drawText(line, { x: 170, y: y - index * 17, size: 12, font: bengaliFont, color: green })); y -= 42 } firstPage.drawText('বই ও লেখক/প্রকাশনী', { x: 42, y: 275, size: 15, font: bengaliFont, color: green }); wrap(writerText, 58).slice(0, 4).forEach((line, index) => firstPage.drawText(line, { x: 42, y: 250 - index * 17, size: 11, font: bengaliFont, color: green })); firstPage.drawText('সংযুক্ত নথি', { x: 42, y: 165, size: 14, font: bengaliFont, color: green }); firstPage.drawText(`${marksheet ? 'মার্কশীট সংযুক্ত আছে' : 'মার্কশীট পাওয়া যায়নি'} · ${proof ? 'প্রমাণপত্র সংযুক্ত আছে' : 'প্রমাণপত্র পাওয়া যায়নি'}`, { x: 42, y: 145, size: 11, font: bengaliFont, color: green })
    const addImagePage = async (title: string, buffer: Buffer | null) => { if (!buffer) return; const page = pdf.addPage([595, 842]); page.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: green }); page.drawText(`চা-বাগান শিক্ষা সহায়তা · ${title}`, { x: 42, y: 785, size: 18, font: bengaliFont, color: rgb(1, 1, 1) }); const embedded = buffer[0] === 0xff && buffer[1] === 0xd8 ? await pdf.embedJpg(buffer) : await pdf.embedPng(buffer); const scale = Math.min(480 / embedded.width, 600 / embedded.height, 1); page.drawImage(embedded, { x: (595 - embedded.width * scale) / 2, y: 115, width: embedded.width * scale, height: embedded.height * scale }) }
    await addImagePage('মার্কশীট', marksheet); await addImagePage('অভিভাবকের প্রমাণপত্র', proof)
    const pages = pdf.getPages(); pages.forEach((page, index) => page.drawText(`Tea Garden Education Support · ${index + 1}/${pages.length}`, { x: 42, y: 32, size: 8, color: rgb(0.38, 0.46, 0.42) }))
    const output = await pdf.save(); return new NextResponse(output, { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(output.length), 'Content-Disposition': `attachment; filename="${id.replace(/[^a-zA-Z0-9_-]/g, '') || 'application'}.pdf'`, 'Cache-Control': 'no-store' } })
  } catch (error) { console.error('[v0] PDF generation failed', error); return NextResponse.json({ error: 'PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।' }, { status: 500 }) }
}
