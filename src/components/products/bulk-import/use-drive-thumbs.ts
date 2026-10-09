"use client"

import { useEffect, useState } from "react"
import { loadDriveThumbs } from "./drive-thumb-loader"
import { driveFileThumbnail, parseDriveLink, type DriveRef, type ParsedProductRow } from "./types"

export type DriveThumbState = {
  /** Drive id (folder hoặc file) → URL thumbnail. */
  thumbs: Map<string, string>
  /** Drive id đã thử nhưng không lấy được ảnh (folder khoá quyền, trống, lỗi). */
  missing: Set<string>
}

/** Phân giải link Drive của các dòng thành thumbnail: link file dùng thẳng, link folder gom lô hỏi server. */
export function useDriveThumbs(rows: ParsedProductRow[]): DriveThumbState {
  const [state, setState] = useState<DriveThumbState>({ thumbs: new Map(), missing: new Set() })

  useEffect(() => {
    const refs = rows.filter((r) => !r.previewUrl).map((r) => parseDriveLink(r.driveLink)).filter((r): r is DriveRef => r !== undefined)
    const fileThumbs = new Map(refs.filter((r) => r.kind === "file").map((r) => [r.id, driveFileThumbnail(r.id)] as const))
    const folderIds = [...new Set(refs.filter((r) => r.kind === "folder").map((r) => r.id))]
    setState({ thumbs: fileThumbs, missing: new Set() })
    if (folderIds.length === 0) return
    let alive = true

    void loadDriveThumbs(
      folderIds,
      (found, missing) =>
        setState((prev) => ({
          thumbs: new Map([...prev.thumbs, ...found]),
          missing: new Set([...prev.missing, ...missing]),
        })),
      { isAlive: () => alive },
    )

    return () => {
      alive = false
    }
  }, [rows])

  return state
}
