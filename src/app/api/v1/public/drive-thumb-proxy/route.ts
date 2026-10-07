import { handle } from "@/core/http/response"
import { validationFailed } from "@/core/http/errors"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { NextResponse } from "next/server"
import {
  fetchThumbnail,
  isValidDriveId,
  resolveFirstFileId,
} from "@/modules/greeting-card/adapters/google-drive-thumbnail"

/**
 * GET /api/v1/public/drive-thumb-proxy?folder_id=...
 * Proxy ảnh thumbnail đầu tiên của folder Google Drive công khai (trang khách xem catalog).
 * Public nên có rate limit, kiểm tra id, timeout và trần kích thước trong adapter.
 */
export const GET = handle(async (request) => {
  await enforceRateLimit(request, { scope: "drive-thumb-proxy", limit: 120, windowMs: 60_000 })
  const folderId = new URL(request.url).searchParams.get("folder_id")?.trim()
  if (!isValidDriveId(folderId)) {
    throw validationFailed({ issues: [{ path: ["folder_id"], message: "folder_id không hợp lệ" }] })
  }

  const fileId = await resolveFirstFileId(folderId)
  if (!fileId) return new NextResponse(null, { status: 404 })

  const thumb = await fetchThumbnail(fileId)
  if (!thumb) return new NextResponse(null, { status: 404 })

  return new NextResponse(thumb.body, {
    status: 200,
    headers: {
      "Content-Type": thumb.contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      "Content-Length": String(thumb.body.byteLength),
      "X-Content-Type-Options": "nosniff",
    },
  })
})

export const dynamic = "force-dynamic"
