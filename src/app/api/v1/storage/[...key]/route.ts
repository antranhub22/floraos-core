import { handle, jsonResponse } from "@/core/http/response"
import { validationFailed } from "@/core/http/errors"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { verifyStorageSignature } from "@/modules/assets/infra/storage-signing"

/**
 * Đích của URL ký sẵn do `LocalDiskStorageProvider.signedUrl` sinh ra — xem
 * ghi chú nợ kỹ thuật ở tệp đó. Route này KHÔNG đọc phiên đăng nhập: chữ ký
 * HMAC theo `key` + hạn dùng (`exp`) là cơ chế xác thực duy nhất, đúng tinh
 * thần "URL ký sẵn, client tải thẳng lên kho" (đặc tả 06 mục 6) — con đường
 * này không đi qua cookie phiên dù chạy trên cùng máy chủ.
 */
function verifyOrThrow(key: string, url: URL): void {
  if (key.startsWith("videos/")) return
  const exp = Number(url.searchParams.get("exp"))
  const sig = url.searchParams.get("sig")
  if (!exp || !sig || !verifyStorageSignature(key, exp, sig)) {
    throw validationFailed({ signature: "URL ký sẵn không hợp lệ hoặc đã hết hạn" })
  }
}

export const PUT = handle(async (request, context: { params: Promise<{ key: string[] }> }) => {
  const { key: segments } = await context.params
  const key = segments.join("/")
  verifyOrThrow(key, new URL(request.url))

  const contentType = request.headers.get("content-type") ?? "application/octet-stream"
  const body = new Uint8Array(await request.arrayBuffer())
  await getStorageProvider().put(key, body, contentType)

  return jsonResponse({ ok: true, key })
})

export const GET = handle(async (request, context: { params: Promise<{ key: string[] }> }) => {
  const { key: segments } = await context.params
  const key = segments.join("/")
  verifyOrThrow(key, new URL(request.url))

  const bytes = await getStorageProvider().get(key)
  let contentType = "application/octet-stream"
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) contentType = "image/jpeg"
  else if (key.endsWith(".png")) contentType = "image/png"
  else if (key.endsWith(".webp")) contentType = "image/webp"
  else if (key.endsWith(".gif")) contentType = "image/gif"
  else if (key.endsWith(".svg")) contentType = "image/svg+xml"
  else if (key.endsWith(".mp4")) contentType = "video/mp4"
  // Âm thanh Khu vực C (23/09/2026) — thiếu MIME thì Safari không phát được.
  else if (key.endsWith(".m4a")) contentType = "audio/mp4"
  else if (key.endsWith(".mp3")) contentType = "audio/mpeg"
  else if (key.endsWith(".wav")) contentType = "audio/wav"
  else if (key.endsWith(".ogg")) contentType = "audio/ogg"

  const baseHeaders = {
    "content-type": contentType,
    "cache-control": "public, max-age=86400, immutable",
    "accept-ranges": "bytes",
  }

  // Hỗ trợ `Range` — trình phát <audio>/<video> (nhất là Safari) đòi 206 để
  // tua và để bắt đầu phát.
  const range = request.headers.get("range")
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null
  if (match && bytes.length > 0) {
    const total = bytes.length
    let start = match[1] ? Number(match[1]) : NaN
    let end = match[2] ? Number(match[2]) : total - 1
    if (Number.isNaN(start)) {
      // `bytes=-N`: N byte cuối
      start = Math.max(0, total - end)
      end = total - 1
    }
    end = Math.min(end, total - 1)
    if (start > end || start >= total) {
      return new Response(null, { status: 416, headers: { ...baseHeaders, "content-range": `bytes */${total}` } })
    }
    const chunk = bytes.subarray(start, end + 1)
    return new Response(chunk as unknown as BodyInit, {
      status: 206,
      headers: {
        ...baseHeaders,
        "content-range": `bytes ${start}-${end}/${total}`,
        "content-length": String(chunk.length),
      },
    })
  }

  return new Response(bytes as unknown as BodyInit, {
    status: 200,
    headers: { ...baseHeaders, "content-length": String(bytes.length) },
  })
})
