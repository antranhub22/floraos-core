import { handle } from "@/core/http/response"
import { validationFailed } from "@/core/http/errors"
import { NextResponse } from "next/server"

/** Cache in-memory: folderId → fileId (file đầu tiên trong folder) */
const fileIdCache = new Map<string, string | null>()

/**
 * GET /api/v1/public/drive-thumb-proxy?folder_id=...
 * Proxy ảnh thumbnail từ Google Drive về client.
 * Server fetch lh3.googleusercontent.com rồi stream ảnh — browser không cần auth Google.
 */
export const GET = handle(async (request) => {
  const url = new URL(request.url)
  const folderId = url.searchParams.get("folder_id")?.trim()

  if (!folderId || folderId.length < 10) {
    throw validationFailed({ issues: [{ path: ["folder_id"], message: "Thiếu folder_id" }] })
  }

  // 1. Lấy fileId từ cache hoặc fetch Drive HTML
  let fileId: string | null | undefined = fileIdCache.get(folderId)

  if (fileId === undefined) {
    try {
      const driveUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`
      const resp = await fetch(driveUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; FloraOS/1.0)" },
        next: { revalidate: 86400 },
      })
      if (resp.ok) {
        const html = await resp.text()
        const m = [...html.matchAll(/entry-([a-zA-Z0-9_-]{25,})/g)]
        fileId = m[0]?.[1] ?? null
      } else {
        fileId = null
      }
    } catch {
      fileId = null
    }
    fileIdCache.set(folderId, fileId)
  }

  if (!fileId) {
    return new NextResponse(null, { status: 404 })
  }

  // 2. Proxy ảnh từ lh3 — server fetch để bypass browser CORS/auth
  const thumbUrl = `https://lh3.googleusercontent.com/d/${fileId}=w400`
  try {
    const imgResp = await fetch(thumbUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FloraOS/1.0)",
        Accept: "image/*",
      },
    })

    if (!imgResp.ok) {
      return new NextResponse(null, { status: 404 })
    }

    const contentType = imgResp.headers.get("content-type") ?? "image/jpeg"
    const buffer = await imgResp.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "Content-Length": String(buffer.byteLength),
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
})
