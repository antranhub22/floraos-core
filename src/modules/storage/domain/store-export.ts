/**
 * "Tải dữ liệu cửa hàng" — bản sao lưu ZIP do chính chủ tiệm tải về.
 * Pure TypeScript — No Prisma or external infrastructure imports.
 */

export const STORE_EXPORT_FEATURE = "store.export"
/** Link tải sống 24 giờ kể từ lúc tạo xong; tệp ZIP bị bộ dọn xoá sau mốc này. */
export const STORE_EXPORT_LINK_TTL_MS = 24 * 60 * 60 * 1000
/**
 * Trần dung lượng ảnh đưa vào một ZIP — tệp được dựng trong bộ nhớ tiến trình web,
 * ảnh vượt trần ghi tên vào `anh-bo-qua.txt` thay vì làm sập tiến trình.
 */
export const STORE_EXPORT_IMAGE_BUDGET_BYTES = 100 * 1024 * 1024
/** Mỗi bảng tối đa chừng này dòng — chặn vòng đọc vô hạn ở tiệm rất lớn. */
export const STORE_EXPORT_MAX_ROWS = 50_000

export type StoreExportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED"

export interface StoreExportOutput {
  storageKey: string
  sizeBytes: number
  imageCount: number
  skippedImageCount: number
  counts: Record<string, number>
}

export interface StoreExportView {
  id: string
  status: StoreExportStatus
  requestedAt: string
  completedAt: string | null
  expiresAt: string | null
  sizeBytes: number | null
  counts: Record<string, number> | null
  imageCount: number | null
  skippedImageCount: number | null
  error: string | null
  downloadUrl: string | null
}

export function storeExportKey(organizationId: string, jobId: string): string {
  return `org/${organizationId}/exports/${jobId}.zip`
}

export function storeExportExpiresAt(completedAt: Date): Date {
  return new Date(completedAt.getTime() + STORE_EXPORT_LINK_TTL_MS)
}

export function isStoreExportExpired(completedAt: Date | null, now: Date): boolean {
  return completedAt !== null && storeExportExpiresAt(completedAt).getTime() <= now.getTime()
}

export function readStoreExportOutput(output: unknown): StoreExportOutput | null {
  if (!output || typeof output !== "object" || Array.isArray(output)) return null
  const o = output as Record<string, unknown>
  if (typeof o["storageKey"] !== "string") return null
  return {
    storageKey: o["storageKey"],
    sizeBytes: typeof o["sizeBytes"] === "number" ? o["sizeBytes"] : 0,
    imageCount: typeof o["imageCount"] === "number" ? o["imageCount"] : 0,
    skippedImageCount: typeof o["skippedImageCount"] === "number" ? o["skippedImageCount"] : 0,
    counts: (o["counts"] && typeof o["counts"] === "object" ? o["counts"] : {}) as Record<string, number>,
  }
}

/** Decimal/Date/BigInt → JSON thuần, để `data.json` đọc được ở mọi nơi. */
export function toPlain(value: unknown): unknown {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "bigint") return value.toString()
  if (Array.isArray(value)) return value.map(toPlain)
  if (typeof value === "object") {
    const maybeDecimal = value as { toNumber?: () => number; constructor?: { name?: string } }
    if (typeof maybeDecimal.toNumber === "function" && maybeDecimal.constructor?.name !== "Object") {
      return maybeDecimal.toNumber()
    }
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, toPlain(v)]))
  }
  return value
}

/** Tên tệp an toàn trong ZIP: bỏ dấu gạch chéo và ký tự điều khiển. */
export function safeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-").replace(/\s+/g, " ").trim()
  return cleaned.slice(0, 120) || "tep"
}

export function extensionFor(mimeType: string, storageKey: string): string {
  const fromKey = /\.([a-z0-9]{2,5})$/i.exec(storageKey)?.[1]
  if (fromKey) return fromKey.toLowerCase()
  const map: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" }
  return map[mimeType] ?? "bin"
}

/**
 * Chọn ảnh vừa trần dung lượng, giữ thứ tự đầu vào. Ảnh chưa biết cỡ tính như 5 MB
 * để không vượt trần thật khi tải về.
 */
export function pickImagesWithinBudget<T extends { fileSize: number | null }>(
  images: T[],
  budgetBytes: number = STORE_EXPORT_IMAGE_BUDGET_BYTES
): { picked: T[]; skipped: T[] } {
  const picked: T[] = []
  const skipped: T[] = []
  let used = 0
  for (const image of images) {
    const size = image.fileSize ?? 5 * 1024 * 1024
    if (used + size > budgetBytes) {
      skipped.push(image)
      continue
    }
    used += size
    picked.push(image)
  }
  return { picked, skipped }
}

export const STORE_EXPORT_README = [
  "BẢN SAO LƯU DỮ LIỆU CỬA HÀNG — FloraOS",
  "",
  "du-lieu-cua-hang.xlsx  Bảng tính để xem nhanh: Sản phẩm, Khách hàng, Đơn hàng, Mã giảm giá.",
  "data.json              Toàn bộ dữ liệu có cấu trúc (giữ để khôi phục sau này).",
  "anh-goc/               Ảnh gốc cửa hàng đã tải lên.",
  "anh-bo-qua.txt         Ảnh không đưa vào vì vượt giới hạn dung lượng của một lần tải (nếu có).",
  "",
  "Tệp có thông tin khách hàng (tên, số điện thoại, địa chỉ). Hãy cất ở nơi an toàn, không chia sẻ công khai.",
  "Không chứa mật khẩu, khoá kết nối hay cấu hình thanh toán.",
].join("\n")
