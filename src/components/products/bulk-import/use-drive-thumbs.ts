"use client"

import { useEffect, useState } from "react"
import { driveFolderId, type ParsedProductRow } from "./types"

const BATCH_SIZE = 20

/** Phân giải link folder Drive của các dòng thành URL thumbnail (từng cụm 20, bỏ qua lỗi lẻ). */
export function useDriveThumbs(rows: ParsedProductRow[]): Map<string, string> {
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const folderIds = [...new Set(rows.filter((r) => !r.previewUrl).map((r) => driveFolderId(r.driveLink)).filter((id): id is string => Boolean(id)))]
    if (folderIds.length === 0) return
    let alive = true

    void (async () => {
      for (let i = 0; i < folderIds.length && alive; i += BATCH_SIZE) {
        const results = await Promise.allSettled(
          folderIds.slice(i, i + BATCH_SIZE).map(async (folderId) => {
            const res = await fetch(`/api/v1/public/drive-thumbnail?folder_id=${encodeURIComponent(folderId)}`)
            const data = res.ok ? ((await res.json()) as { thumbnail_url?: string | null }) : null
            return data?.thumbnail_url ? ([folderId, data.thumbnail_url] as const) : null
          }),
        )
        const found = results.flatMap((r) => (r.status === "fulfilled" && r.value ? [r.value] : []))
        if (alive && found.length > 0) {
          setThumbs((prev) => {
            const next = new Map(prev)
            for (const [id, url] of found) next.set(id, url)
            return next
          })
        }
      }
    })()

    return () => {
      alive = false
    }
  }, [rows])

  return thumbs
}
