'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, Check, ChevronDown, Leaf, LockKeyhole, Phone, Upload, X } from 'lucide-react'

type Department = 'science' | 'arts' | 'commerce'
type FileState = { name: string; dataUrl: string } | null

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
  marksheet: FileState | StoredFile
  proof: FileState | StoredFile
}

const books: Record<Department, string[]> = {
  science: ['বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'পদার্থবিজ্ঞান ১ম পত্র', 'পদার্থবিজ্ঞান ২য় পত্র', 'রসায়ন ১ম পত্র', 'রসায়ন ২য় পত্র', 'জীববিজ্ঞান ১ম পত্র', 'জীববিজ্ঞান ২য় পত্র', 'উচ্চতর গণিত ১ম পত্র', 'উচ্চতর গণিত ২য় পত্র'],
  arts: ['বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'ইতিহাস ১ম পত্র', 'ইতিহাস ২য় পত্র', 'পৌরনীতি ও সুশাসন ১ম পত্র', 'পৌরনীতি ও সুশাসন ২য় পত্র', 'অর্থনীতি ১ম পত্র', 'অর্থনীতি ২য় পত্র', 'ভূগোল ১ম পত্র', 'ভূগোল ২য় পত্র', 'সমাজকর্ম ১ম পত্র', 'যুক্তিবিদ্যা ১ম পত্র'],
  commerce: ['বাংলা ১ম পত্র', 'বাংলা ২য় পত্র', 'ইংরেজি ১ম পত্র', 'ইংরেজি ২য় পত্র', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'হিসাববিজ্ঞান ১ম পত্র', 'হিসাববিজ্ঞান ২য় পত্র', 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ১ম পত্র', 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ২য় পত্র', 'ফিনান্স, ব্যাংকিং ও বিমা ১ম পত্র', 'ফিনান্স, ব্যাংকিং ও বিমা ২য় পত্র', 'উৎপাদন ব্যবস্থাপনা ও বিপণন ১ম পত্র'],
}

const deptLabels: Record<Department, string> = { science: 'বিজ্ঞান বিভাগ', arts: 'মানবিক বিভাগ', commerce: 'ব্যবসায় শিক্ষা বিভাগ' }
const bn = (value: number) => String(value).replace(/[0-9]/g, (n) => '০১২৩৪৫৬৭৮৯'[Number(n)])

function FilePicker({ label, value, onChange }: { label: string; value: FileState; onChange: (file: FileState) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handle = (file?: File) => {
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { onChange({ name: 'ফাইলটি ৮ এমবির নিচে হতে হবে', dataUrl: '' }); return }
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
    {value && !value.dataUrl && <div className="file-status err"><X size={14} /> {value.name}</div>}
  </div>
}

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [dept, setDept] = useState<Department | ''>('')
  const [selected, setSelected] = useState<string[]>([])
  const [files, setFiles] = useState<{ marksheet: FileState; proof: FileState }>({ marksheet: null, proof: null })
  const [submitted, setSubmitted] = useState<Application | null>(null)
  const [error, setError] = useState('')
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [showScrollButton, setShowScrollButton] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 900)
    const onScroll = () => setShowScrollButton(window.scrollY < Math.max(220, window.innerHeight * 0.72))
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => { window.clearTimeout(timer); window.removeEventListener('scroll', onScroll) }
  }, [])

  const toggleBook = (title: string) => setSelected((current) => current.includes(title) ? current.filter((item) => item !== title) : current.length < 10 ? [...current, title] : current)
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const phone = String(data.get('phone') || '').trim()
    const required = [data.get('name'), phone, data.get('garden'), data.get('guardianJob'), data.get('college'), dept, data.get('gpa'), selected.length, files.marksheet?.dataUrl, files.proof?.dataUrl]
    if (!data.get('name')) setError('নাম দিতে হবে')
    else if (!/^01[0-9]{9}$/.test(phone)) setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিতে হবে')
    else if (!dept) setError('বিভাগ নির্বাচন করতে হবে')
    else if (!selected.length) setError('কমপক্ষে একটি বই নির্বাচন করতে হবে')
    else if (!files.marksheet?.dataUrl || !files.proof?.dataUrl) setError('দুটি প্রয়োজনীয় কাগজপত্র আপলোড করতে হবে')
    else if (!required.every(Boolean)) setError('সবগুলো প্রয়োজনীয় তথ্য পূরণ করতে হবে')
    else {
      setError('')
      setSubmitting(true)
      const payload = new FormData()
      for (const [key, value] of data.entries()) payload.append(key, value)
      payload.set('department', dept)
      payload.set('books', JSON.stringify(selected))
      if (files.marksheet?.dataUrl && files.marksheet.name) payload.set('marksheet', await (await fetch(files.marksheet.dataUrl)).blob(), files.marksheet.name)
      if (files.proof?.dataUrl && files.proof.name) payload.set('proof', await (await fetch(files.proof.dataUrl)).blob(), files.proof.name)
      const response = await fetch('/api/applications', { method: 'POST', body: payload })
      const result = await response.json()
      if (!response.ok) { setSubmitting(false); setError(result.error || 'আবেদন জমা দেওয়া যায়নি'); return }
      setSubmitting(false); setSubmitted(result.application); setApplications((current) => [result.application, ...current])
    }
  }
  const reset = () => { setSubmitted(null); setDept(''); setSelected([]); setFiles({ marksheet: null, proof: null }); setError('') }

  return <main>
    {loading && <div className="page-loader" role="status" aria-label="লোড হচ্ছে"><div className="loader-leaf" aria-hidden="true"><Leaf size={34} strokeWidth={1.7} /></div></div>}
    <section className="hero">
      <div className="hero-inner">
        <div className="eyebrow">আয়োজনে: চা-বাগানের বিশ্ববিদ্যালয় পড়ুয়া শিক্ষার্থীবৃন্দ</div>
        <h1 className="hero-title">চা-বাগানের সুবিধাবঞ্চিত উচ্চ-মাধ্যমিক শিক্ষার্থীদের জন্য বিনামূল্যে শিক্ষা-উপকরণ সহায়তা কর্মসূচি</h1>
        <p className="hero-description">এসএসসি পাশ করে একাদশ শ্রেণিতে ভর্তি হতে যাচ্ছ? তথ্য যাচাই করে সবচেয়ে যোগ্য কয়েকজনকে বই, ক্যালকুলেটর ও জ্যামিতি বক্স কিনে দেওয়া হবে। আমাদের লক্ষ্য ৫০ জন শিক্ষার্থীকে এই কর্মসূচির আওতায় সহযোগিতা করা।</p>
      </div>
      {showScrollButton && <button className="scroll-indicator" aria-label="ফর্মে যান" onClick={() => { document.getElementById('form-card')?.scrollIntoView({ behavior: 'smooth' }); setShowScrollButton(false) }}><ArrowDown size={24} /></button>}
    </section>

    <div className="wrap">
      <section className="card" id="form-card">
        <div className="supervisor"><b>তত্ত্বাবধানে</b><span>শুভ কৈরী, স্নাতকোত্তর, ঢাকা বিশ্ববিদ্যালয়</span><a href="mailto:shuvokoiri0@gmail.com">Email: shuvokoiri0@gmail.com</a><a href="tel:01791751501">Mobile: ০১৭৯১৭৫১৫০১</a></div>
        {submitted ? <div className="confirm"><div className="confirm-badge"><Check size={32} /></div><h2>আবেদন সফলভাবে জমা হয়েছে</h2><p>তোমার তথ্য যাচাই করে আঞ্চলিক প্রতিনিধিরা প্রয়োজনে তোমার সাথে ফোনে যোগাযোগ করবেন। ধন্যবাদ!</p><div className="ref">{submitted.id}</div><button className="primary" onClick={reset}>আরেকটি আবেদন জমা দাও</button></div> : <form onSubmit={submit} noValidate>
          {error && <div className="err-box">{error}</div>}
          <section className="section"><SectionHead num="১" title="ব্যক্তিগত তথ্য" /><div className="field"><label>আবেদনকারীর নাম <span className="req">*</span></label><input name="name" placeholder="পূর্ণ নাম লিখুন" /></div><div className="grid2"><div className="field"><label>আবেদনকারীর মোবাইল নাম্বার <span className="req">*</span></label><input name="phone" type="tel" placeholder="01XXXXXXXXX" /><div className="hint">১১ ডিজিটের সচল নম্বর দিন</div></div><div className="field"><label>আবেদনকারী কোন চা-বাগানের অধিবাসী? <span className="req">*</span></label><input name="garden" placeholder="চা-বাগানের নাম" /></div></div><div className="field"><label>আবেদনকারীর অভিভাবকের পেশা <span className="req">*</span></label><input name="guardianJob" placeholder="যেমনঃ চা-শ্রমিক, দিনমজুর ইত্যাদি" /></div></section>
          <section className="section"><SectionHead num="২" title="শিক্ষা সংক্রান্ত তথ্য" /><div className="field"><label>আবেদনকারীর কলেজের নাম <span className="req">*</span></label><input name="college" placeholder="কলেজের পূর্ণ নাম" /></div><div className="grid2"><div className="field"><label>আবেদনকারী কলেজে কোন বিভাগে অধ্যয়নরত? <span className="req">*</span></label><select value={dept} onChange={(e) => { setDept(e.target.value as Department); setSelected([]) }}><option value="">বিভাগ নির্বাচন করুন</option><option value="science">বিজ্ঞান বিভাগ</option><option value="arts">মানবিক বিভাগ</option><option value="commerce">ব্যবসায় শিক্ষা বিভাগ</option></select></div><div className="field"><label>SSC পরীক্ষার ফলাফল (GPA) <span className="req">*</span></label><input name="gpa" type="number" min="1" max="5" step=".01" placeholder="যেমনঃ 4.50" /></div></div></section>
          <section className="section"><SectionHead num="৩" title="বই নির্বাচন" /><p className="section-sub">তোমার বিভাগের সিলেবাস অনুযায়ী তালিকা থেকে সর্বোচ্চ ১০টি বই বেছে নাও</p>{!dept ? <div className="dept-empty">প্রথমে উপরে থেকে তোমার বিভাগ নির্বাচন করো — তারপর এখানে বইয়ের তালিকা দেখা যাবে।</div> : <><div className="book-progress"><div className="book-progress-track"><div className="book-progress-fill" style={{ width: `${selected.length * 10}%` }} /></div><span>{bn(selected.length)} / ১০ নির্বাচিত</span></div><div className="book-grid">{books[dept].map((book) => <label key={book} className={`book-item ${selected.includes(book) ? 'checked' : ''} ${!selected.includes(book) && selected.length >= 10 ? 'disabled' : ''}`}><input type="checkbox" checked={selected.includes(book)} onChange={() => toggleBook(book)} /><span>{book}</span></label>)}</div></>}</section>
          <section className="section"><SectionHead num="৪" title="প্রয়োজনীয় কাগজপত্র" /><FilePicker label="নিজের SSC পরীক্ষার মার্কশীট আপলোড করো" value={files.marksheet} onChange={(value) => setFiles((current) => ({ ...current, marksheet: value }))} /><FilePicker label="অভিভাবকের পেশার প্রমাণপত্র / চা-বাগানের অধিবাসী প্রত্যয়নপত্র আপলোড করো" value={files.proof} onChange={(value) => setFiles((current) => ({ ...current, proof: value }))} /></section>
          <div className="submit-row"><button type="submit" className="primary" disabled={submitting}>{submitting ? <><span className="submit-spinner" aria-hidden="true" /> আবেদন প্রক্রিয়াধীন...</> : 'আবেদন জমা দাও'}</button><span>{submitting ? 'তথ্য ও ফাইল নিরাপদে সংরক্ষণ করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন...' : 'জমা দেওয়ার পর একটি রেফারেন্স নম্বর পাবে'}</span></div>
        </form>}
      </section>

      <section className="card contact-card"><h2>যোগাযোগ</h2><div className="contact-list">{[['সাগর বৈদ্য', 'সিলেট ইন্টারন্যাশনাল ইউনিভার্সিটি', '০১৭৭৯-৮২৯৮৫০'], ['গোপাল কালোয়ার', 'মৌলভীবাজার সরকারি কলেজ', '০১৭৬৫-৪২৮৩৮৭'], ['আকাশ নায়েক', 'শ্রীমঙ্গল সরকারি কলেজ', '০১৩২৭-৭৫৬৪৯৫'], ['রুহিত বোনার্জি', 'ইনস্টিটিউট অফ হেলথ টেকনোলজি', '০১৫৮০-৬৮৪৫৮১']].map(([name, org, phone]) => <div className="contact-item" key={name}><b>{name}</b><small>{org}</small><a href={`tel:${phone.replace(/[^0-9]/g, '')}`}><Phone size={15} />{phone}</a></div>)}</div></section>
      <footer><button className="admin-link" aria-label="প্রশাসন প্যানেল" onClick={() => setShowAdmin((value) => !value)}><LockKeyhole size={16} /></button></footer>
      {showAdmin && <section className="card admin-panel">{!adminUnlocked ? <div className="admin-login"><h2>প্রশাসন প্যানেল</h2><input id="admin-pass" type="password" placeholder="পাসকোড দিন" /><button className="primary" onClick={async () => { const pass = (document.getElementById('admin-pass') as HTMLInputElement).value; if (pass === 'lonewolf2026') { const response = await fetch('/api/applications', { headers: { 'x-admin-pass': pass } }); const result = await response.json(); setApplications(result.applications || []); setAdminUnlocked(true) } }}>প্রবেশ করুন</button></div> : <div><div className="admin-heading"><h2>আবেদনসমূহ ({applications.length})</h2><button className="export-btn" onClick={async () => { const response = await fetch('/api/applications/export', { headers: { 'x-admin-pass': 'lonewolf2026' } }); const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'tea-garden-applications.xlsx'; link.click(); URL.revokeObjectURL(url) }}>সব আবেদন Excel</button></div>{applications.length === 0 ? <p className="hint">এখনও কোনো আবেদন নেই।</p> : applications.map((app) => <details className="app-card" key={app.id}><summary>{app.name}<span>{deptLabels[app.dept]} · {new Date(app.submittedAt).toLocaleDateString('bn-BD')} <ChevronDown size={15} /></span></summary><p>ফোন: {app.phone}<br />কলেজ: {app.college}<br />চা-বাগান: {app.garden}<br />অভিভাবকের পেশা: {app.guardianJob}<br />GPA: {app.gpa}<br />বই: {app.books.join(', ')}<br />মার্কশীট: {app.marksheet?.name || 'নেই'}<br />প্রমাণপত্র: {app.proof?.name || 'নেই'}</p><div className="document-links"><a href={`/api/applications/${app.id}/files/marksheet?pass=lonewolf2026`} target="_blank" rel="noreferrer" download>মার্কশীট দেখুন</a><a href={`/api/applications/${app.id}/files/proof?pass=lonewolf2026`} target="_blank" rel="noreferrer" download>প্রমাণপত্র দেখুন</a><a href={`/api/applications/${app.id}/pdf?pass=lonewolf2026`} target="_blank" rel="noreferrer" download>PDF ডাউনলোড</a></div></details>)}</div>}</section>}
    </div>
  </main>
}

function SectionHead({ num, title }: { num: string; title: string }) { return <div className="section-head"><span className="section-num">{num}</span><h2>{title}</h2></div> }

