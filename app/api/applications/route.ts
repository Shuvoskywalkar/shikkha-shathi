import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { insertApplication, queryApplications } from '@/lib/db'

const ADMIN_PASS = 'lonewolf2026'
const allowed = (file: File | null) => !!file && file.size <= 8 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)

export async function GET(request: NextRequest) {
  if (request.headers.get('x-admin-pass') !== ADMIN_PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryApplications()
  return NextResponse.json({ applications: rows.map((row) => ({ id: row.id, submittedAt: row.createdAt, name: row.name, phone: row.phone, garden: row.garden, guardianJob: row.guardianJob, college: row.college, dept: row.department, gpa: row.gpa, books: row.books, marksheet: row.marksheetPath ? { name: 'মার্কশীট' } : null, proof: row.proofPath ? { name: 'প্রমাণপত্র' } : null })) })
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const marksheet = form.get('marksheet') as File | null
    const proof = form.get('proof') as File | null
    const name = String(form.get('name') || '').trim()
    const phone = String(form.get('phone') || '').trim()
    const department = String(form.get('department') || '')
    const books = JSON.parse(String(form.get('books') || '[]')) as string[]
    if (!name || !/^01[0-9]{9}$/.test(phone) || !['science', 'arts', 'commerce'].includes(department) || books.length < 1 || books.length > 10 || !allowed(marksheet) || !allowed(proof)) return NextResponse.json({ error: 'তথ্য বা ফাইল সঠিক নয়। JPG, PNG বা WEBP ফাইল সর্বোচ্চ ৮ এমবি হতে হবে।' }, { status: 400 })
    const id = `TG-${Date.now().toString(36).toUpperCase()}`
    const [markBlob, proofBlob] = await Promise.all([
      put(`applications/${id}/marksheet-${marksheet!.name}`, marksheet!, { access: 'private', addRandomSuffix: false }),
      put(`applications/${id}/proof-${proof!.name}`, proof!, { access: 'private', addRandomSuffix: false }),
    ])
    await insertApplication({ id, name, phone, email: String(form.get('email') || ''), guardianJob: String(form.get('guardianJob') || ''), college: String(form.get('college') || ''), garden: String(form.get('garden') || ''), gpa: String(form.get('gpa') || ''), department, books, marksheetPath: markBlob.pathname, proofPath: proofBlob.pathname })
    return NextResponse.json({ application: { id, submittedAt: new Date().toISOString(), name, phone, garden: String(form.get('garden') || ''), guardianJob: String(form.get('guardianJob') || ''), college: String(form.get('college') || ''), dept: department, gpa: String(form.get('gpa') || ''), books, marksheet: { name: marksheet!.name }, proof: { name: proof!.name } } })
  } catch (error) {
    console.error('[v0] application submission failed', error)
    return NextResponse.json({ error: 'আবেদন জমা দেওয়া যায়নি। আবার চেষ্টা করুন।' }, { status: 500 })
  }
}
