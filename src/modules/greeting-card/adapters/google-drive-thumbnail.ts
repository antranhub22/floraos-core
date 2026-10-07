/**
 * Adapter Google Drive — phân giải folder công khai thành ảnh thumbnail đầu tiên.
 * Dùng cho route public (trang khách) nên mọi giới hạn phải chặt: id hợp lệ,
 * cache có trần, timeout, chỉ nhận ảnh và trần kích thước.
 */

const DRIVE_ID = /^[A-Za-z0-9_-]{10,128}$/
const FILE_ENTRY = /entry-([A-Za-z0-9_-]{25,128})/g
const CACHE_MAX = 500
const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 5_000
export const MAX_THUMB_BYTES = 5 * 1024 * 1024
const UA = "Mozilla/5.0 (compatible; FloraOS/1.0)"

export function isValidDriveId(id: string | null | undefined): id is string {
  return typeof id === "string" && DRIVE_ID.test(id)
}

/** Lấy file id đầu tiên trong HTML của embeddedfolderview. */
export function extractFirstFileId(html: string): { fileId: string | null; total: number } {
  const ids = [...html.matchAll(FILE_ENTRY)].map((m) => m[1] as string)
  return { fileId: ids[0] ?? null, total: ids.length }
}

/** Cache LRU có trần số phần tử + TTL — không để route public làm phình bộ nhớ. */
export class BoundedCache<V> {
  private readonly map = new Map<string, { value: V; at: number }>()
  constructor(private readonly max = CACHE_MAX, private readonly ttlMs = CACHE_TTL_MS) {}

  get(key: string, now = Date.now()): V | undefined {
    const hit = this.map.get(key)
    if (!hit) return undefined
    if (now - hit.at > this.ttlMs) {
      this.map.delete(key)
      return undefined
    }
    this.map.delete(key)
    this.map.set(key, hit)
    return hit.value
  }

  set(key: string, value: V, now = Date.now()): void {
    this.map.delete(key)
    this.map.set(key, { value, at: now })
    while (this.map.size > this.max) {
      const oldest = this.map.keys().next().value
      if (oldest === undefined) break
      this.map.delete(oldest)
    }
  }

  get size(): number {
    return this.map.size
  }
}

const fileIdCache = new BoundedCache<string | null>()

export async function resolveFirstFileId(folderId: string): Promise<string | null> {
  if (!isValidDriveId(folderId)) return null
  const cached = fileIdCache.get(folderId)
  if (cached !== undefined) return cached
  let fileId: string | null = null
  try {
    const resp = await fetch(`https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (resp.ok) fileId = extractFirstFileId(await resp.text()).fileId
  } catch {
    fileId = null
  }
  fileIdCache.set(folderId, fileId)
  return fileId
}

export function thumbnailUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w400`
}

/** Tải ảnh thumbnail; trả null nếu không phải ảnh, quá lớn, lỗi hoặc quá thời gian. */
export async function fetchThumbnail(fileId: string): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  if (!isValidDriveId(fileId)) return null
  try {
    const resp = await fetch(thumbnailUrl(fileId), {
      headers: { "User-Agent": UA, Accept: "image/*" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    const contentType = resp.headers.get("content-type") ?? ""
    if (!resp.ok || !contentType.startsWith("image/")) return null
    const declared = Number(resp.headers.get("content-length") ?? "0")
    if (declared > MAX_THUMB_BYTES) return null
    const body = await resp.arrayBuffer()
    if (body.byteLength > MAX_THUMB_BYTES) return null
    return { body, contentType }
  } catch {
    return null
  }
}
