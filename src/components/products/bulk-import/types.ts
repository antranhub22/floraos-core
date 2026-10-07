export interface ParsedProductRow {
  index: number
  code: string
  loviCode?: string | undefined
  siinCode?: string | undefined
  name: string
  price: number | null
  category: string
  shape: string
  facing: string
  container: string
  color: string
  description: string
  flowersText: string
  driveLink?: string | undefined
  imageFileName: string
  matchedFile: File | null
  previewUrl: string | null
  uploadedAssetId?: string | null | undefined
  status: "MATCHED" | "DRIVE_SYNC" | "NO_IMAGE" | "ERROR"
  errorMsg?: string | undefined
}

export interface ImportResult {
  /** false = có lô không gửi được; các con số vẫn phản ánh phần ĐÃ lưu trước đó. */
  success: boolean
  createdCount: number
  skippedCount: number
  failedCount: number
  failedItems: Array<{ code: string; error: string }>
}

export interface ImportProgress {
  current: number
  total: number
  phase: string
}

/** Folder id trong link Drive dạng `.../folders/<id>`. */
export function driveFolderId(link: string | undefined): string | undefined {
  return link?.match(/folders\/([a-zA-Z0-9_-]{20,})/)?.[1]
}
