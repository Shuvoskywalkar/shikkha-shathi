import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; kind: string }> }) {
  if (request.headers.get('x-admin-pass') !== 'lonewolf2026' && request.nextUrl.searchParams.get('pass') !== 'lonewolf2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, kind } = await params
  const column = kind === 'marksheet' ? 'marksheet_path' : kind === 'proof' ? 'proof_path' : null
  if (!column) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const result = await pool.query(`SELECT ${column} AS path FROM applications WHERE id = $1`, [id])
  const pathname = result.rows[0]?.path
  if (!pathname) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const blob = await get(pathname, { access: 'private' })
  if (!blob) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return new NextResponse(blob.stream, { headers: { 'Content-Type': blob.blob.contentType || 'application/octet-stream', 'Content-Disposition': `inline; filename="${kind}-${id}"`, 'Cache-Control': 'private, no-cache' } })
}
