import { putBlob } from '@/lib/blob'
import { NextRequest, NextResponse } from 'next/server'
import { insertApplication, queryApplications } from '@/lib/db'

const ADMIN_PASS = 'ShinzoWoSassageyo2026'
const MAX_FILE_SIZE = 8 * 1024 * 1024
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
const fieldError = (fields: Record<string, string>, key: string, message: string) => { if (!fields[key]) fields[key] = message }

export async function GET(request: NextRequest) {
  if (request.headers.get('x-admin-pass') !== ADMIN_PASS) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await queryApplications()
  return NextResponse.json({ applications: rows.map((row) => ({ id: row.id, submittedAt: row.createdAt, name: row.name, phone: row.phone, garden: row.garden, guardianJob: row.guardianJob, college: row.college, gpa: row.gpa, dept: row.department, futurePlan: row.futurePlan, books: row.books, bookWriters: row.bookWriters, calculatorNeed: ['yes', 'হ্যাঁ', 'প্রয়োজন'].includes(row.bookWriters?.__calculator || '') ? 'হ্যাঁ' : 'না', geometryBoxNeed: ['yes', 'হ্যাঁ', 'প্রয়োজন'].includes(row.bookWriters?.__geometryBox || '') ? 'হ্যাঁ' : 'না', marksheet: row.marksheetPath ? { name: 'কলেজে ভর্তির কাগজ' } : null, proof: row.proofPath ? { name: 'অভিভাবকের কাগজ' } : null })) })
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData(); const fields: Record<string, string> = {}
    const text = (key: string) => String(form.get(key) || '').trim()
    const name = text('name'); const phone = text('phone'); const garden = text('garden'); const guardianJob = text('guardianJob'); const college = text('college'); const email = text('email'); const gpa = text('gpa'); const futurePlan = text('futurePlan'); const department = text('department')
    for (const [key, label] of [['name', 'নাম'], ['garden', 'চা-বাগানের নাম'], ['guardianJob', 'অভিভাবকের পেশা'], ['college', 'কলেজের নাম']] as const) if (!text(key)) fieldError(fields, key, `${label} পূরণ করুন`)
    if (!/^01[0-9]{9}$/.test(phone)) fieldError(fields, 'phone', 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন')
    const numericGpa = Number(gpa); if (!Number.isFinite(numericGpa) || numericGpa < 1 || numericGpa > 5) fieldError(fields, 'gpa', 'GPA ১ থেকে ৫-এর মধ্যে দিন')
  if (!futurePlan) fieldError(fields, 'futurePlan', 'উচ্চশিক্ষা ও ভবিষ্যৎ পরিকল্পনা লিখুন')
    if (!['science', 'arts', 'commerce'].includes(department)) fieldError(fields, 'department', 'বিভাগ নির্বাচন করুন')
    let books: string[] = []; let bookWriters: Record<string, string> = {}; try { const parsed = JSON.parse(String(form.get('books') || '[]')); if (Array.isArray(parsed)) books = parsed.filter((book): book is string => typeof book === 'string' && book.trim()).map((book) => book.trim()) } catch { fieldError(fields, 'books', 'বইয়ের তালিকা সঠিক নয়') }
    if (books.length < 1 || books.length > 10) fieldError(fields, 'books', '১ থেকে ১০টি বই নির্বাচন করুন')
    try { const parsedWriters = JSON.parse(String(form.get('bookWriters') || '{}')); if (parsedWriters && typeof parsedWriters === 'object' && !Array.isArray(parsedWriters)) { bookWriters = { ...Object.fromEntries(books.map((book) => [book, typeof parsedWriters[book] === 'string' ? parsedWriters[book].trim() : ''])), __calculator: parsedWriters.__calculator === 'yes' ? 'yes' : 'no', __geometryBox: parsedWriters.__geometryBox === 'yes' ? 'yes' : 'no' }; const calculator = bookWriters.__calculator; const geometryBox = bookWriters.__geometryBox; if (department === 'science' && !['yes', 'no'].includes(calculator)) fieldError(fields, 'calculator', 'বৈজ্ঞানিক ক্যালকুলেটরের প্রয়োজন নির্বাচন করুন'); if (['science', 'commerce'].includes(department) && !['yes', 'no'].includes(geometryBox)) fieldError(fields, 'geometryBox', 'জ্যামিতি বক্সের প্রয়োজন নির্বাচন করুন') } } catch { fieldError(fields, 'books', 'বইয়ের লেখকের তথ্য সঠিক নয়') }
    const files = { admission: form.get('admission') as File | null, guardianProof: form.get('guardianProof') as File | null }
    for (const [key, file] of Object.entries(files)) { if (!file || file.size === 0) fieldError(fields, key, 'প্রয়োজনীয় ফাইল আপলোড করুন'); else if (!allowedTypes.includes(file.type)) fieldError(fields, key, 'JPG, PNG বা WEBP ছবি দিন'); else if (file.size > MAX_FILE_SIZE) fieldError(fields, key, 'ফাইলটি ৮ এমবির নিচে হতে হবে') }
    if (Object.keys(fields).length) return NextResponse.json({ error: 'তথ্যগুলো ঠিক করে আবার চেষ্টা করুন', fields }, { status: 400 })
    const id = `TG-${Date.now().toString(36).toUpperCase()}`
    const [admissionBlob, guardianBlob] = await Promise.all([
      putBlob(`applications/${id}/admission-${files.admission!.name}`, files.admission!, { access: 'private', addRandomSuffix: false }),
      putBlob(`applications/${id}/guardian-proof-${files.guardianProof!.name}`, files.guardianProof!, { access: 'private', addRandomSuffix: false }),
    ])
    await insertApplication({ id, name, phone, email, guardianJob, college, garden, gpa, futurePlan, department, books, bookWriters, marksheetPath: admissionBlob.pathname, proofPath: guardianBlob.pathname })
    return NextResponse.json({ application: { id, submittedAt: new Date().toISOString(), name, phone, garden, guardianJob, college, dept: department, futurePlan, books, calculatorNeed: bookWriters.__calculator === 'yes' ? 'হ্যাঁ' : 'না', geometryBoxNeed: bookWriters.__geometryBox === 'yes' ? 'হ্যাঁ' : 'না', admission: { name: files.admission!.name }, guardianProof: { name: files.guardianProof!.name } } })
  } catch (error) { console.error('[v0] application submission failed', error); return NextResponse.json({ error: 'আবেদন জমা দেওয়া যায়নি। আবার চেষ্টা করুন।' }, { status: 500 }) }
}
