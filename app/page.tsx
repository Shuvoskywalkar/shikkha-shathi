'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, Check, ChevronDown, Leaf, LockKeyhole, Phone, Upload, X } from 'lucide-react'

type Department = 'science' | 'arts' | 'commerce'
type FileState = { name: string; dataUrl: string; error?: string } | null
type FormErrors = Record<string, string>

type StoredFile = { name: string }


type Application = {
  id: string
  submittedAt: string
  name: string
  phone: string
  garden: string
  guardianJob: string
  college: string
  dept: Department
  gpa: string
  books: string[]
  bookWriters?: Record<string, string>
  marksheet: FileState | StoredFile
  proof: FileState | StoredFile
}

const books: Record<Department, string[]> = {
  science: ['বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'পদার্থবিজ্ঞান ১ম পত্র', 'পদার্থবিজ্ঞান ২য় পত্র', 'রসায়ন ১ম পত্র', 'রসায়ন ২য় পত্র', 'জীববিজ্ঞান ১ম পত্র', 'জীববিজ্ঞান ২য় পত্র', 'উচ্চতর গণিত ১ম পত্র', 'উচ্চতর গণিত ২য় পত্র'],
  arts: ['বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'ইতিহাস ১ম পত্র', 'ইতিহাস ২য় পত্র', 'পৌরনীতি ও সুশাসন ১ম পত্র', 'পৌরনীতি ও সুশাসন ২য় পত্র', 'অর্থনীতি ১ম পত্র', 'অর্থনীতি ২য় পত্র', 'ভূগোল ১ম পত্র', 'ভূগোল ২য় পত্র', 'সমাজকর্ম ১ম পত্র', 'যুক্তিবিদ্যা ১ম পত্র'],
  commerce: ['বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'হিসাববিজ্ঞান ১ম পত্র', 'হিসাববিজ্ঞান ২য় পত্র', 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ১ম পত্র', 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ২য় পত্র', 'ফিনান্স, ব্যাংকিং ও বিমা ১ম পত্র', 'ফিনান্স, ব্যাংকিং ও বিমা ২য় পত্র', 'উৎপাদন ব্যবস্থাপনা ও বিপণন ১ম পত্র'],
}

const deptLabels: Record<Department, string> = { science: 'বিজ্ঞান বিভাগ', arts: 'মানবিক বিভাগ', commerce: 'ব্যবসায় শিক্ষা বিভাগ' }
const nctbBooks = new Set(['বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'তথ্য ও যোগাযোগ প্রযুক্তি'])
const writersByBook: Record<string, string> = {
  'বাংলা ১ম পত্র': 'NCTB', 'বাংলা ২য় পত্র': 'হায়াৎ সাইফ', 'ইংরেজি ১ম পত্র': 'M. A. Hamid', 'ইংরেজি ২য় পত্র': 'M. A. Hamid', 'তথ্য ও যোগাযোগ প্রযুক্তি': 'মো. আব্দুর রহমান', 'পদার্থবিজ্ঞান ১ম পত্র': 'এস. আর. খান', 'পদার্থবিজ্ঞান ২য় পত্র': 'এস. আর. খান', 'রসায়ন ১ম পত্র': 'হাজারী ও নাগ', 'রসায়ন ২য় পত্র': 'হাজারী ও নাগ', 'জীববিজ্ঞান ১ম পত্র': 'আবুল হাসান', 'জীববিজ্ঞান ২য় পত্র': 'আবুল হাসান', 'উচ্চতর গণিত ১ম পত্র': 'কে. বি. শাহ', 'উচ্চতর গণিত ২য় পত্র': 'কে. বি. শাহ', 'ইতিহাস ১ম পত্র': 'এ. কে. এম. শাহনাওয়াজ', 'ইতিহাস ২য় পত্র': 'এ. কে. এম. শাহনাওয়াজ', 'পৌরনীতি ও সুশাসন ১ম পত্র': 'মো. মোজাম্মেল হক', 'পৌরনীতি ও সুশাসন ২য় পত্র': 'মো. মোজাম্মেল হক', 'অর্থনীতি ১ম পত্র': 'ড. মো. শামসুল আলম', 'অর্থনীতি ২য় পত্র': 'ড. মো. শামসুল আলম', 'ভূগোল ১ম পত্র': 'ড. হুমায়ুন কবির', 'ভূগোল ২য় পত্র': 'ড. হুমায়ুন কবির', 'সমাজকর্ম ১ম পত্র': 'মো. শহীদুজ্জামান', 'যুক্তিবিদ্যা ১ম পত্র': 'ড. মো. আবদুর রাজ্জাক', 'হিসাববিজ্ঞান ১ম পত্র': 'মো. জাকির হোসেন', 'হিসাববিজ্ঞান ২য় পত্র': 'মো. জাকির হোসেন', 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ১ম পত্র': 'মো. সাইফুল ইসলাম', 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ২য় পত্র': 'মো. সাইফুল ইসলাম', 'ফিনান্স, ব্যাংকিং ও বিমা ১ম পত্র': 'মো. আবদুল্লাহ আল মামুন', 'ফিনান্স, ব্যাংকিং ও বিমা ২য় পত্র': 'মো. আবদুল্লাহ আল মামুন', 'উৎপাদন ব্যবস্থাপনা ও বিপণন ১ম পত্র': 'মো. জাহাঙ্গীর আলম'
}
const publisherOptions: Record<string, string[]> = {
  'পদার্থবিজ্ঞান ১ম পত্র': ['রয়েল', 'লেকচার', 'পাঞ্জেরী'], 'পদার্থবিজ্ঞান ২য় পত্র': ['রয়েল', 'লেকচার', 'পাঞ্জেরী'],
  'রসায়ন ১ম পত্র': ['রয়েল', 'লেকচার', 'পাঞ্জেরী'], 'রসায়ন ২য় পত্র': ['রয়েল', 'লেকচার', 'পাঞ্জেরী'],
  'জীববিজ্ঞান ১ম পত্র': ['রয়েল', 'লেকচার', 'পাঞ্জেরী'], 'জীববিজ্ঞান ২য় পত্র': ['রয়েল', 'লেকচার', 'পাঞ্জেরী'],
  'উচ্চতর গণিত ১ম পত্র': ['রয়েল', 'লেকচার', 'পাঞ্জেরী'], 'উচ্চতর গণিত ২য় পত্র': ['রয়েল', 'লেকচার', 'পাঞ্জেরী'],
  'ইতিহাস ১ম পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'], 'ইতিহাস ২য় পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'],
  'পৌরনীতি ও সুশাসন ১ম পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'], 'পৌরনীতি ও সুশাসন ২য় পত্র': ['লেকচার', 'পাঞ্�������েরী', 'অক্ষরপত্র'],
  'অর্থনীতি ১ম পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'], 'অর্থনীতি ২য় পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'],
  'ভূগোল ১ম পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'], 'ভূগোল ২য় পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'],
  'সমাজকর্ম ১ম পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'], 'যুক্তিবিদ্যা ১ম পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'],
  'হিসাববিজ্ঞান ১ম পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'], 'হিসাববিজ্ঞান ২য় পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'],
  'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ১ম পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'], 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ২য় পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'],
  'ফিনান্স, ব্যাংকিং ও বিমা ১ম পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'], 'ফিনান্স, ব্যাংকিং ও বিমা ২য় পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র'],
  'উৎপাদন ব্যবস্থাপনা ও বিপণন ১ম পত্র': ['লেকচার', 'পাঞ্জেরী', 'অক্ষরপত্র']
}
const bn = (value: number) => String(value).replace(/[0-9]/g, (n) => '০১২৩৪৫৬৭৮৯'[Number(n)])

function FilePicker({ label, value, error, onChange }: { label: string; value: FileState; error?: string; onChange: (file: FileState) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handle = (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { onChange({ name: file.name, dataUrl: '', error: 'JPG, PNG বা WEBP ছবি দিন' }); return }
    if (file.size > 8 * 1024 * 1024) { onChange({ name: file.name, dataUrl: '', error: 'ফাইলটি ৮ এমবির নিচে হতে হবে' }); return }
    const reader = new FileReader()
    reader.onload = () => onChange({ name: file.name, dataUrl: String(reader.result) })
    reader.readAsDataURL(file)
  }
  return <div className="field">
    <label>{label} <span className="req">*</span></label>
    <button type="button" className="file-drop" onClick={() => inputRef.current?.click()}>
      <span className="file-ico"><Upload size={18} /></span>
      <span className="file-meta"><b>{value?.name || 'ফাইল বেছে নিতে ক্লিক করো'}</b> ছবি (JPG/PNG) — সর্বোচ্চ ৮ এমবি</span>
    </button>
    <input ref={inputRef} hidden type="file" accept="image/*" onChange={(e) => handle(e.target.files?.[0])} />
    {value?.dataUrl && <div className="file-status ok"><Check size={14} /> সংযুক্ত হয়েছে</div>}
    {value && !value.dataUrl && <div className="file-status err"><X size={14} /> {value.error || value.name}</div>}
    {error && <div className="file-status err" role="alert"><X size={14} /> {error}</div>}
  </div>
}

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [dept, setDept] = useState<Department | ''>('')
  const [selected, setSelected] = useState<string[]>([])
  const [customWriters, setCustomWriters] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<{ marksheet: FileState; proof: FileState }>({ marksheet: null, proof: null })
  const [submitted, setSubmitted] = useState<Application | null>(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [showScrollButton, setShowScrollButton] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminAction, setAdminAction] = useState('')

  const readResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) return response.json()
    const message = await response.text()
    return { error: message || `সার্ভার ত্রুটি (${response.status})` }
  }

  const downloadAdminFile = async (url: string, filename: string) => {
    setAdminError(''); setAdminAction('ফাইল প্রস্তুত করা হচ্ছে...')
    try {
      const response = await fetch(url, { headers: { 'x-admin-pass': 'lonewolf2026' }, cache: 'no-store' })
      if (!response.ok) { const result = await readResponse(response); setAdminError(result.error || 'ফাইলটি ডাউনলোড করা যায়নি'); return }
      const blob = await response.blob(); const objectUrl = URL.createObjectURL(blob); const link = document.createElement('a')
      link.href = objectUrl; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch { setAdminError('সার্ভারের সাথে যোগাযোগ করা যায়নি') } finally { setAdminAction('') }
  }

  const openAdminFile = async (url: string, filename: string) => {
    setAdminError(''); setAdminAction('ডকুমেন্ট খোলা হচ্ছে...')
    try {
      const response = await fetch(url, { headers: { 'x-admin-pass': 'lonewolf2026' }, cache: 'no-store' })
      if (!response.ok) { const result = await readResponse(response); setAdminError(result.error || 'ফাইলটি খোলা যায়নি'); return }
      const blob = await response.blob(); const objectUrl = URL.createObjectURL(blob); window.open(objectUrl, '_blank', 'noopener,noreferrer'); window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
    } catch { setAdminError('সার্ভারের সাথে যোগাযোগ করা যায���নি') } finally { setAdminAction('') }
  }

  const unlockAdmin = async () => {
    const pass = (document.getElementById('admin-pass') as HTMLInputElement)?.value.trim()
    setAdminError(''); setAdminAction('আবেদনসমূহ লোড হচ্ছে...')
    if (!pass) { setAdminError('পাসকোড লিখুন'); setAdminAction(''); return }
    try {
      const response = await fetch('/api/applications', { headers: { 'x-admin-pass': pass }, cache: 'no-store' })
      const result = await readResponse(response)
      if (!response.ok) { setAdminError(result.error || 'পাসকোড সঠিক নয়'); return }
      setApplications(result.applications || []); setAdminUnlocked(true)
    } catch { setAdminError('সার্ভারের সাথে যোগাযোগ করা যায়নি') } finally { setAdminAction('') }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 900)
    const onScroll = () => setShowScrollButton(window.scrollY < Math.max(220, window.innerHeight * 0.72))
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => { window.clearTimeout(timer); window.removeEventListener('scroll', onScroll) }
  }, [])

  const toggleBook = (title: string) => setSelected((current) => { if (current.includes(title)) { setWriters((value) => { const next = { ...value }; delete next[title]; return next }); return current.filter((item) => item !== title) } return current.length < 10 ? [...current, title] : current })
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const phone = String(data.get('phone') || '').trim()
    const errors: FormErrors = {}
    const requiredText = (key: string, label: string) => { if (!String(data.get(key) || '').trim()) errors[key] = `${label} পূরণ করুন` }
    requiredText('name', 'নাম'); requiredText('garden', 'চা-বাগানের নাম'); requiredText('guardianJob', 'অভিভাবকের পেশা'); requiredText('college', 'কলেজের নাম')
    if (!/^01[0-9]{9}$/.test(phone)) errors.phone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন'
    const gpa = Number(data.get('gpa')); if (!Number.isFinite(gpa) || gpa < 1 || gpa > 5) errors.gpa = 'GPA ১ থেকে ৫-এর মধ্যে ��িন'
    if (!dept) errors.department = 'বিভাগ নির্বাচন করুন'
    if (!selected.length) errors.books = 'কমপক্ষে একটি বই নির্বাচন করুন'
    if (files.marksheet?.error || !files.marksheet?.dataUrl) errors.marksheet = files.marksheet?.error || 'মার্কশীট আপলোড করুন'
    if (files.proof?.error || !files.proof?.dataUrl) errors.proof = files.proof?.error || 'অভিভাবকের প্রমাণপত্র আপলোড করুন'
    setFieldErrors(errors)
    if (Object.keys(errors).length) { setError(`অনুগ্রহ করে ${Object.keys(errors).length}টি বিষয় ঠিক করুন`); document.querySelector<HTMLElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus(); return }
    setError(''); setSubmitting(true)
    try {
      const payload = new FormData(); for (const [key, value] of data.entries()) payload.append(key, value)
      payload.set('department', dept); payload.set('books', JSON.stringify(selected)); payload.set('bookWriters', JSON.stringify(Object.fromEntries(selected.filter((book) => !nctbBooks.has(book)).map((book) => [book, customWriters[book] || '']))))
      if (files.marksheet?.dataUrl) payload.set('marksheet', await (await fetch(files.marksheet.dataUrl)).blob(), files.marksheet.name)
      if (files.proof?.dataUrl) payload.set('proof', await (await fetch(files.proof.dataUrl)).blob(), files.proof.name)
      const response = await fetch('/api/applications', { method: 'POST', body: payload }); const result = await readResponse(response)
      if (!response.ok) { setFieldErrors(result.fields || {}); setError(result.error || 'আবেদন জমা দেওয়া যায়নি'); return }
      setSubmitted(result.application); setApplications((current) => [result.application, ...current]); window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.getElementById('form-card')?.scrollIntoView({ behavior: 'auto', block: 'start' })))
    } catch { setError('সার্ভারের সাথে যোগাযোগ করা যায়নি। ই��্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন') } finally { setSubmitting(false) }
  }
  const reset = () => { setSubmitted(null); setDept(''); setSelected([]); setCustomWriters({}); setFiles({ marksheet: null, proof: null }); setError(''); setFieldErrors({}) }

  return <main>
    {loading && <div className="page-loader" role="status" aria-label="লোড হচ্ছে"><div className="loader-leaf" aria-hidden="true"><Leaf size={34} strokeWidth={1.7} /></div></div>}
    <section className="hero">
      <div className="hero-inner">
        <h1 className="hero-title">চা-বাগানের সুবিধাবঞ্চিত উচ্চ-মাধ্যমিক শিক্ষার্থীদের জন্য বিনামূল্যে শিক্ষা-উপকরণ সহায়তা কর্মসূচি ২০২৬</h1>
        <p className="hero-description">এসএসসি পাশ করে একাদশ শ্রেণিতে ভর্তি হতে যাচ্ছ? তথ্য যাচাই ও বাছাই করে সবচেয়ে যোগ্য কয়েকজনকে বই, ক্যালকুলেটর ও জ্যামিতি বক্স কিনে দেওয়া হবে। আমাদের লক্ষ্য ৫০ জন শিক্ষার্থীকে এই কর্মসূচির আওতায় সহযোগিতা করা।</p>
      </div>
      {showScrollButton && <button className="scroll-indicator" aria-label="ফর্মে যান" onClick={() => { document.getElementById('form-card')?.scrollIntoView({ behavior: 'smooth' }); setShowScrollButton(false) }}><ArrowDown size={24} /></button>}
    </section>

    <div className="wrap">
      <section className="card" id="form-card">
        <div className="supervisor"><b>তত্ত্বাবধানে</b><span>শুভ কৈরী, স্নাতকোত্তর, ঢাকা বিশ্ববিদ্যালয়</span><a href="mailto:shuvokoiri0@gmail.com">Email: shuvokoiri0@gmail.com</a><a href="tel:01791751501">Mobile: 01791751501</a></div>
        {submitted ? <div className="confirm" id="confirmation-message" tabIndex={-1} role="status" aria-live="polite"><div className="confirm-badge"><Check size={32} /></div><h2>আবেদন সফলভাবে জমা হয়েছে</h2><p>তোমার তথ্য যাচাই করে আঞ্চলিক প্রতিনিধিরা প্রয়োজনে তোমার সাথে ফোনে যোগাযোগ করবেন। ধন্যবাদ!</p><div className="ref">{submitted.id}</div><button className="primary" onClick={reset}>আরেকটি আবেদন জমা দাও</button></div> : <form onSubmit={submit} noValidate>
          {error && <div className="err-box" role="alert" aria-live="assertive">{error}{Object.entries(fieldErrors).length > 0 && <ul>{Object.values(fieldErrors).map((message) => <li key={message}>{message}</li>)}</ul>}</div>}
          <input type="hidden" name="department" value={dept} />
          <section className="section"><SectionHead num="১" title="ব্যক্তিগত তথ্য" /><div className="field"><label>আবেদনকারীর নাম <span className="req">*</span></label><input name="name" placeholder="পূর্ণ নাম লিখুন" /></div><div className="grid2"><div className="field"><label>আবেদনকারীর মোবাইল নাম্বার <span className="req">*</span></label><input name="phone" type="tel" placeholder="01XXXXXXXXX" /><div className="hint">১১ ডিজিটের সচল নম্বর দিন</div></div><div className="field"><label>আবেদনকারী কোন চা-বাগানের অধিবাসী? <span className="req">*</span></label><input name="garden" placeholder="চা-বাগানের নাম" /></div></div><div className="field"><label>আবেদনকারীর অভিভাবকের পেশা <span className="req">*</span></label><input name="guardianJob" placeholder="যেমনঃ চা-শ্রমিক, দিনমজুর ইত্যাদি" /></div></section>
          <section className="section"><SectionHead num="২" title="শিক্ষা সংক্রান্ত তথ্য" /><div className="field"><label>আবেদনকারীর কলেজের নাম <span className="req">*</span></label><input name="college" placeholder="কলেজের পূর্ণ নাম" /></div><div className="grid2"><div className="field"><label>আবেদনকারী কলেজে কোন বিভাগে অধ্যয়নরত? <span className="req">*</span></label><select value={dept} onChange={(e) => { setDept(e.target.value as Department); setSelected([]) }}><option value="">বিভাগ নির্বাচন করুন</option><option value="science">বিজ্ঞান বিভাগ</option><option value="arts">মানবিক বিভাগ</option><option value="commerce">ব্যবসায় শিক্ষা বিভাগ</option></select></div><div className="field"><label>SSC পরীক্ষার ফলাফল (GPA) <span className="req">*</span></label><input name="gpa" type="number" min="1" max="5" step=".01" placeholder="যেমনঃ 4.50" /></div></div></section>
          <section className="section"><SectionHead num="৩" title="বই নির্বাচন" /><p className="section-sub">তোমার বিভাগের সিলেবাস অনুযায়ী তালিকা থেকে সর্বোচ্চ ১০টি বই বেছে নাও</p>{!dept ? <div className="dept-empty">প্রথমে উপরে থেকে তোমার বিভাগ নির্বাচন করো — তারপর এখানে বইয়ের তালিকা দেখা যাবে।</div> : <><div className="book-progress"><div className="book-progress-track"><div className="book-progress-fill" style={{ width: `${selected.length * 10}%` }} /></div><span>{bn(selected.length)} / ১০ নির্বাচিত</span></div><div className="book-grid">{books[dept].map((book) => <div key={book} className={`book-item ${selected.includes(book) ? 'checked' : ''} ${!selected.includes(book) && selected.length >= 10 ? 'disabled' : ''}`}><label><input type="checkbox" checked={selected.includes(book)} onChange={() => toggleBook(book)} /><span><b>{book}</b></span></label>{selected.includes(book) && !nctbBooks.has(book) && <input className="writer-input" value={customWriters[book] || ''} onChange={(event) => setCustomWriters((value) => ({ ...value, [book]: event.target.value }))} placeholder="লেখক বা প্রকাশনীর নাম লিখুন" aria-label={`${book} লেখক বা প্রকাশনীর নাম`} />}</div>)}</div></>}</section>
          <section className="section"><SectionHead num="৪" title="প্রয়োজনীয় কাগজপত্র" /><FilePicker label="নিজের SSC পরীক্ষার মার্কশীট আপলোড করো" value={files.marksheet} error={fieldErrors.marksheet} onChange={(value) => setFiles((current) => ({ ...current, marksheet: value }))} /><FilePicker label="অভিভাবকের পেশার প্রমাণপত্র / চা-বাগানের অধিবাসী প্রত্যয়নপত্র আপলোড করো" value={files.proof} error={fieldErrors.proof} onChange={(value) => setFiles((current) => ({ ...current, proof: value }))} /></section>
          <div className="submit-row"><button type="submit" className="primary" disabled={submitting}>{submitting ? <><span className="submit-spinner" aria-hidden="true" /> আবেদন প্রক্রিয়াধীন...</> : 'আবেদন জমা দাও'}</button><span>{submitting ? 'তথ্য ও ফাইল নিরাপদে সংরক্ষণ করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন...' : 'জমা দেওয়ার পর একটি রেফারেন্স নম্বর পাবে'}</span></div>
        </form>}
      </section>

      <section className="card contact-card"><h2>যোগাযোগ</h2><div className="contact-list">{[['গোপাল কালোয়ার', 'মৌলভীবাজার সরকারি কলেজ', '০১৭৬৫-৪২৮৩৮৭'], ['আকাশ নায়েক', 'শ্রীমঙ্গল সরকারি কলেজ', '০১৩২৭-৭৫৬৪৯৫'], ['রুহিত বোনার্জি', 'ইনস্টিটিউট অফ হেলথ টেকনোলজি', '০১৫৮০-৬৮৪৫৮১']].map(([name, org, phone]) => <div className="contact-item" key={name}><b>{name}</b><small>{org}</small><a href={`tel:${phone.replace(/[^0-9]/g, '')}`}><Phone size={15} />{phone}</a></div>)}</div></section>
      <footer><button className="admin-link" aria-label="প্রশাসন প্যানেল" onClick={() => setShowAdmin((value) => !value)}><LockKeyhole size={16} /></button></footer>
      {showAdmin && <section className="card admin-panel">{!adminUnlocked ? <div className="admin-login"><h2>প্রশাসন প্যানেল</h2><input id="admin-pass" type="password" placeholder="পাসকোড দিন" /><button className="primary" onClick={unlockAdmin}>প্রবেশ করুন</button>{adminAction && <div className="admin-progress" role="status" aria-live="polite"><span className="submit-spinner" aria-hidden="true" />{adminAction}</div>}{adminError && <div className="err-box" role="alert">{adminError}</div>}</div> : <div><div className="admin-heading"><h2>আবেদনসমূহ ({applications.length})</h2>{adminAction && <div className="admin-progress" role="status" aria-live="polite"><span className="submit-spinner" aria-hidden="true" />{adminAction}</div>}<button className="export-btn" disabled={Boolean(adminAction)} onClick={async () => { setAdminError(''); setAdminAction('Excel তৈরি হচ্ছে...'); try { const response = await fetch('/api/applications/export', { headers: { 'x-admin-pass': 'lonewolf2026' }, cache: 'no-store' }); if (!response.ok) { const result = await readResponse(response); setAdminError(result.error || `Excel তৈরি করা যায়নি (${response.status})`); return } const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'tea-garden-applications.xlsx'; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) } catch { setAdminError('সার্ভারের সাথে যোগাযোগ করা যায়নি') } finally { setAdminAction('') } }}>সব আবেদন Excel</button></div>{adminError && <div className="err-box" role="alert">{adminError}</div>}{applications.length === 0 ? <p className="hint">এখনও কোনো আবেদন নেই।</p> : applications.map((app) => <details className="app-card" key={app.id}><summary>{app.name}<span>{deptLabels[app.dept]} · {new Date(app.submittedAt).toLocaleDateString('bn-BD')} <ChevronDown size={15} /></span></summary><p>ফোন: {app.phone}<br />কলেজ: {app.college}<br />চা-বাগান: {app.garden}<br />অভিভাবকের পেশা: {app.guardianJob}<br />GPA: {app.gpa}<br />বই: {app.books.join(', ')}<br />মার্কশীট: {app.marksheet?.name || 'নেই'}<br />প্রমাণপত্র: {app.proof?.name || 'নেই'}</p><div className="document-links"><button type="button" disabled={Boolean(adminAction)} onClick={() => openAdminFile(`/api/applications/${app.id}/files/marksheet`, `${app.id}-marksheet`)}>মার্কশীট দেখুন</button><button type="button" disabled={Boolean(adminAction)} onClick={() => openAdminFile(`/api/applications/${app.id}/files/proof`, `${app.id}-proof`)}>প্রমাণপত্র দেখুন</button><button type="button" disabled={Boolean(adminAction)} onClick={() => downloadAdminFile(`/api/applications/${app.id}/pdf`, `${app.id}.pdf`)}>PDF ডাউনলোড</button></div></details>)}</div>}</section>}
    </div>
  </main>
}

function SectionHead({ num, title }: { num: string; title: string }) { return <div className="section-head"><span className="section-num">{num}</span><h2>{title}</h2></div> }

