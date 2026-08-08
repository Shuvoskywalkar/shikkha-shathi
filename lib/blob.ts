import { put, get } from '@vercel/blob'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { dirname, join, extname } from 'node:path'
import { Readable } from 'node:stream'

const localBlobRoot = join(process.cwd(), '.blob-data')
const canUseBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_OIDC_TOKEN || process.env.BLOB_STORE_ID)
const mimeByExt: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}
const defaultContentType = 'application/octet-stream'

function localPath(pathname: string) {
  return join(localBlobRoot, pathname)
}

async function ensureDir(pathname: string) {
  await mkdir(dirname(pathname), { recursive: true })
}

export type BlobGetResult = {
  pathname: string
  stream: Readable
  buffer: Buffer
  contentType: string
}

export async function putBlob(pathname: string, file: File, opts: { access: 'private'; addRandomSuffix: boolean }) {
  if (canUseBlob) {
    return put(pathname, file as any, opts)
  }

  const target = localPath(pathname)
  await ensureDir(target)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(target, buffer)
  return { pathname }
}

export async function getBlob(pathname: string, opts: { access: 'private' }): Promise<BlobGetResult | null> {
  if (canUseBlob) {
    const result = await get(pathname, opts)
    if (!result) return null
    const buffer = Buffer.from(await new Response(result.stream).arrayBuffer())
    return {
      pathname,
      stream: result.stream as any,
      buffer,
      contentType: result.blob.contentType || defaultContentType,
    }
  }

  try {
    const target = localPath(pathname)
    const buffer = await readFile(target)
    const contentType = mimeByExt[extname(pathname).toLowerCase()] || defaultContentType
    return {
      pathname,
      stream: Readable.from(buffer),
      buffer,
      contentType,
    }
  } catch {
    return null
  }
}
