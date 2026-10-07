import type { ParsedProductRow } from "./types"

/** Lưu tạm dòng đã đọc vào sessionStorage — khoá gắn organization_id để không lộ giữa các tổ chức. */
function keys(orgId: string) {
  return { rowsKey: `floraos_bulk_import_rows_v1__${orgId}`, metaKey: `floraos_bulk_import_meta_v1__${orgId}` } as const
}

export function saveImportSession(rows: ParsedProductRow[], excelFileName: string, orgId: string): void {
  const { rowsKey, metaKey } = keys(orgId)
  try {
    // File không tuần tự hoá được; blob URL mất hiệu lực sau reload — chỉ giữ ảnh Drive
    const serializable = rows.map((r) => ({ ...r, matchedFile: null, previewUrl: r.previewUrl?.startsWith("blob:") ? null : r.previewUrl }))
    sessionStorage.setItem(rowsKey, JSON.stringify(serializable))
    sessionStorage.setItem(metaKey, JSON.stringify({ excelFileName }))
  } catch {
    // sessionStorage đầy hoặc bị chặn — chỉ mất tính năng khôi phục
  }
}

export function loadImportSession(orgId: string): { rows: ParsedProductRow[]; excelFileName: string } | null {
  const { rowsKey, metaKey } = keys(orgId)
  try {
    const rows = JSON.parse(sessionStorage.getItem(rowsKey) ?? "[]") as ParsedProductRow[]
    if (!Array.isArray(rows) || rows.length === 0) return null
    const meta = JSON.parse(sessionStorage.getItem(metaKey) ?? "{}") as { excelFileName?: string }
    return { rows, excelFileName: meta.excelFileName ?? "" }
  } catch {
    return null
  }
}

export function clearImportSession(orgId: string): void {
  const { rowsKey, metaKey } = keys(orgId)
  try {
    sessionStorage.removeItem(rowsKey)
    sessionStorage.removeItem(metaKey)
  } catch {
    // bỏ qua
  }
}
