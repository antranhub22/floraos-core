import { handle, jsonResponse } from "@/core/http/response"
import { validationFailed } from "@/core/http/errors"
import { z } from "zod"

const querySchema = z.object({
  folder_id: z.string().min(10),
})

/** Cache in-memory để không request lại Google Drive nhiều lần */
const thumbCache = new Map<string, string>()

/**
 * GET /api/v1/public/drive-thumbnail?folder_id=...
 * Tự động phân giải Google Drive folder ID thành direct thumbnail URL
 */
export const GET = handle(async (request) => {
  const url = new URL(request.url)
  const folderId = url.searchParams.get("folder_id")?.trim()

  if (!folderId) {
    throw validationFailed({ issues: [{ path: ["folder_id"], message: "Thiếu folder_id" }] })
  }

  // 1. Kiểm tra cache
  if (thumbCache.has(folderId)) {
    return jsonResponse({
      folder_id: folderId,
      thumbnail_url: thumbCache.get(folderId),
      cached: true,
    })
  }

  try {
    const driveUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`
    const resp = await fetch(driveUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      next: { revalidate: 86400 }, // Cache 24 giờ
    })

    if (!resp.ok) {
      return jsonResponse({ folder_id: folderId, thumbnail_url: null, error: "Drive folder not accessible" }, { status: 404 })
    }

    const html = await resp.text()
    const matches = [...html.matchAll(/entry-([a-zA-Z0-9_-]{25,})/g)].map((m) => m[1])

    if (matches.length > 0 && matches[0]) {
      const fileId = matches[0]
      // Dùng trực tiếp lh3 CDN của Google để tải ảnh tức thì không qua redirect 302
      const thumbUrl = `https://lh3.googleusercontent.com/d/${fileId}=w400`
      thumbCache.set(folderId, thumbUrl)

      return jsonResponse({
        folder_id: folderId,
        file_id: fileId,
        thumbnail_url: thumbUrl,
        total_files: matches.length,
      })
    }

    return jsonResponse({ folder_id: folderId, thumbnail_url: null, message: "No files found in folder" })
  } catch (err) {
    return jsonResponse(
      { folder_id: folderId, thumbnail_url: null, error: err instanceof Error ? err.message : "Error resolving Drive thumbnail" },
      { status: 500 }
    )
  }
})
