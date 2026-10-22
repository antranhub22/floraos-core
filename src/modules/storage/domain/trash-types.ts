/**
 * Domain Types for Trash Bin (Thùng rác lưu trữ 30 ngày).
 * Pure TypeScript — No Prisma or external infrastructure imports.
 *
 * Nguồn sự thật "đang ở thùng rác" là cột `deleted_at` (+ `deleted_by`) trên
 * bảng gốc. Bản ghi cũ (trước khi có cột) đánh dấu bằng `trashed_at` trong JSON
 * `metadata`/`attributes` — vẫn đọc được qua `readLegacyTrashedAt`.
 */

export const TRASH_RETENTION_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export const TRASH_ITEM_TYPES = [
  "RAW_ASSET",
  "APPROVED_ANALYSIS",
  "PRODUCT",
  "CUSTOMER",
  "GREETING_CATALOG",
  "CATALOG_LINK",
  "CONTENT_DRAFT",
  "CAMPAIGN_PACKAGE",
  "VIDEO",
  "VOUCHER",
] as const

export type TrashItemType = (typeof TRASH_ITEM_TYPES)[number]

/** Nhãn hiển thị tiếng Việt cho từng loại mục trong thùng rác. */
export const TRASH_TYPE_LABELS: Record<TrashItemType, string> = {
  RAW_ASSET: "Ảnh gốc",
  APPROVED_ANALYSIS: "Ảnh duyệt",
  PRODUCT: "Mẫu hoa",
  CUSTOMER: "Khách hàng",
  GREETING_CATALOG: "Bộ sưu tập thẻ chào",
  CATALOG_LINK: "Catalog chia sẻ",
  CONTENT_DRAFT: "Bài đăng nháp",
  CAMPAIGN_PACKAGE: "Gói chiến dịch",
  VIDEO: "Video",
  VOUCHER: "Mã giảm giá",
}

export interface TrashItem {
  id: string
  type: TrashItemType
  name: string
  code?: string | null | undefined
  imageUrl?: string | null | undefined
  trashedAt: string
  trashedBy?: string | null | undefined
  expiresAt: string
  daysRemaining: number
  priceVnd?: number | null | undefined
  category?: string | null | undefined
  /** Quá hạn nhưng không xoá hẳn được (đã có giao dịch) — giữ ẩn để đối soát. */
  retained?: boolean | undefined
}

export function isTrashItemType(value: unknown): value is TrashItemType {
  return typeof value === "string" && (TRASH_ITEM_TYPES as readonly string[]).includes(value)
}

export function trashExpiresAt(trashedAt: Date): Date {
  return new Date(trashedAt.getTime() + TRASH_RETENTION_DAYS * DAY_MS)
}

/** Mọi mục bỏ vào thùng rác TRƯỚC mốc này đã hết hạn giữ. */
export function trashPurgeCutoff(now: Date): Date {
  return new Date(now.getTime() - TRASH_RETENTION_DAYS * DAY_MS)
}

export function calculateDaysRemaining(expiresAtIso: string, now = Date.now()): number {
  const diffMs = new Date(expiresAtIso).getTime() - now
  return Math.max(0, Math.ceil(diffMs / DAY_MS))
}

/** Bản ghi cũ: `trashed_at` nằm trong JSON metadata/attributes. */
export function readLegacyTrashedAt(json: unknown): Date | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null
  const raw = (json as Record<string, unknown>)["trashed_at"]
  if (typeof raw !== "string") return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Gỡ dấu thùng rác cũ khỏi JSON, giữ nguyên các khoá khác. */
export function stripTrashKeys(json: unknown): Record<string, unknown> {
  const base = json && typeof json === "object" && !Array.isArray(json) ? { ...(json as Record<string, unknown>) } : {}
  delete base["trashed_at"]
  delete base["trashed_by"]
  delete base["expires_at"]
  delete base[PREVIOUS_STATUS_KEY]
  return base
}

/** Trạng thái trước khi bỏ vào thùng rác — để khôi phục đúng như cũ. */
export const PREVIOUS_STATUS_KEY = "trash_previous_status"

export function readPreviousStatus<T extends string>(json: unknown, allowed: readonly T[], fallback: T): T {
  if (!json || typeof json !== "object" || Array.isArray(json)) return fallback
  const raw = (json as Record<string, unknown>)[PREVIOUS_STATUS_KEY]
  return typeof raw === "string" && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback
}

export function buildTrashItem(input: {
  id: string
  type: TrashItemType
  name: string
  trashedAt: Date
  trashedBy?: string | null | undefined
  code?: string | null | undefined
  imageUrl?: string | null | undefined
  priceVnd?: number | null | undefined
  category?: string | null | undefined
  retained?: boolean | undefined
  now?: number | undefined
}): TrashItem {
  const expiresAt = trashExpiresAt(input.trashedAt).toISOString()
  const item: TrashItem = {
    id: input.id,
    type: input.type,
    name: input.name,
    code: input.code ?? null,
    imageUrl: input.imageUrl ?? null,
    trashedAt: input.trashedAt.toISOString(),
    trashedBy: input.trashedBy ?? null,
    expiresAt,
    daysRemaining: calculateDaysRemaining(expiresAt, input.now),
    priceVnd: input.priceVnd ?? null,
    category: input.category ?? null,
  }
  if (input.retained) item.retained = true
  return item
}
