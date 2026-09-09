import { handle, jsonResponse } from "@/core/http/response"
import { validationFailed } from "@/core/http/errors"
import { LocalDiskStorageProvider } from "@/modules/assets/adapters/local-disk-storage-provider"
import { verifyStorageSignature } from "@/modules/assets/infra/storage-signing"

/**
 * Đích của URL ký sẵn do `LocalDiskStorageProvider.signedUrl` sinh ra — xem
 * ghi chú nợ kỹ thuật ở tệp đó. Route này KHÔNG đọc phiên đăng nhập: chữ ký
 * HMAC theo `key` + hạn dùng (`exp`) là cơ chế xác thực duy nhất, đúng tinh
 * thần "URL ký sẵn, client tải thẳng lên kho" (đặc tả 06 mục 6) — con đường
 * này không đi qua cookie phiên dù chạy trên cùng máy chủ.
 */
function verifyOrThrow(key: string, url: URL): void {
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
  await new LocalDiskStorageProvider().put(key, body, contentType)

  return jsonResponse({ ok: true, key })
})

export const GET = handle(async (request, context: { params: Promise<{ key: string[] }> }) => {
  const { key: segments } = await context.params
  const key = segments.join("/")
  verifyOrThrow(key, new URL(request.url))

  const bytes = await new LocalDiskStorageProvider().get(key)
  // `Uint8Array<ArrayBufferLike>` (kiểu trả về của `fs/promises.readFile`) không khớp
  // generic `BodyInit` của lib.dom trong TS gần đây (`Uint8Array<ArrayBuffer>` cụ thể) —
  // ép kiểu qua `unknown`, không đổi byte nào.
  return new Response(bytes as unknown as BodyInit, {
    status: 200,
    headers: { "content-type": "application/octet-stream" },
  })
})
