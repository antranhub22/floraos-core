/**
 * Khách duyệt ảnh thành phẩm trước khi giao (PO 15/10/2026 mục 4; sửa 17/10/2026). Thuần domain.
 * - BYPASS: không chờ khách.
 * - AUTO_PASS_10M: chờ số phút đã cài (xem `photo-review-timing.ts`); hết giờ tự coi như đồng ý NẾU công tắc
 *   "tự duyệt khi hết giờ" bật — tắt thì vẫn chờ khách bấm.
 * - REQUIRE_CUSTOMER: chờ khách bấm duyệt, KHÔNG tự qua.
 * Khách duyệt chỉ có giá trị cho lần tải ảnh mà khách đã xem: Điều phối tải ảnh mới sau khi khách duyệt
 * → phải duyệt lại.
 */
import type { CustomerApprovalMode } from "./brochure-workflow-policy"
import { DEFAULT_PHOTO_REVIEW_MINUTES, resolvePhotoReviewTiming } from "./photo-review-timing"

export { DEFAULT_PHOTO_REVIEW_MINUTES }

export type PhotoApprovalStatus = "NONE" | "BYPASSED" | "PENDING" | "APPROVED" | "AUTO_APPROVED"

export interface PhotoApprovalState {
  status: PhotoApprovalStatus
  uploadedAt: string | null
  /** Số phút chờ áp dụng cho đơn này */
  countdownMinutes: number
  /** Hết giờ có tự duyệt không — `false` = chờ khách bấm duyệt mãi */
  autoApprove: boolean
  approvedAt: string | null
  /** Còn bao lâu (ms) thì hết giờ chờ — chỉ khi PENDING; 0 khi đã quá giờ mà không tự duyệt */
  remainingMs: number
}

export function photoApprovalState(input: {
  mode: CustomerApprovalMode
  reviewMinutes?: number | null | undefined
  /** Hết giờ có tự duyệt không (chỉ áp dụng cho AUTO_PASS_10M); mặc định có */
  autoApprove?: boolean | undefined
  /** Lúc tải ảnh thành phẩm; `null` = chưa có ảnh (chưa tải hoặc đã bỏ qua ảnh) */
  uploadedAt: Date | null
  customerApprovedAt: Date | null
  now: Date
}): PhotoApprovalState {
  const countdownMinutes = input.reviewMinutes && input.reviewMinutes > 0 ? input.reviewMinutes : DEFAULT_PHOTO_REVIEW_MINUTES
  const autoApprove = input.mode === "AUTO_PASS_10M" && input.autoApprove !== false
  const base = { countdownMinutes, autoApprove, uploadedAt: input.uploadedAt?.toISOString() ?? null, approvedAt: null, remainingMs: 0 }
  if (!input.uploadedAt) return { ...base, status: "NONE" }
  if (input.mode === "BYPASS") return { ...base, status: "BYPASSED" }
  // Duyệt trước lần tải ảnh mới nhất không tính — khách chưa thấy ảnh mới
  if (input.customerApprovedAt && input.customerApprovedAt.getTime() >= input.uploadedAt.getTime()) {
    return { ...base, status: "APPROVED", approvedAt: input.customerApprovedAt.toISOString() }
  }
  const deadline = input.uploadedAt.getTime() + countdownMinutes * 60_000
  if (input.now.getTime() >= deadline) {
    return autoApprove ? { ...base, status: "AUTO_APPROVED", approvedAt: new Date(deadline).toISOString() } : { ...base, status: "PENDING" }
  }
  return { ...base, status: "PENDING", remainingMs: deadline - input.now.getTime() }
}

/**
 * Lý do chặn giao ship khi còn chờ khách duyệt ảnh, hoặc `null`. Tính theo giờ `nowMs` để giao diện
 * đếm ngược mà không cần tải lại; máy chủ gọi với giờ hiện tại.
 */
export function photoApprovalBlockerAt(state: Pick<PhotoApprovalState, "status" | "uploadedAt" | "countdownMinutes" | "autoApprove"> | null | undefined, nowMs: number): string | null {
  if (state?.status !== "PENDING" || !state.uploadedAt) return null
  const left = Date.parse(state.uploadedAt) + state.countdownMinutes * 60_000 - nowMs
  if (left > 0) {
    const minutes = Math.ceil(left / 60_000)
    return state.autoApprove
      ? `Đang chờ khách duyệt ảnh thành phẩm — còn ${minutes} phút (hết giờ tự duyệt)`
      : `Đang chờ khách duyệt ảnh thành phẩm — còn ${minutes} phút; tiệm không tự duyệt, cần khách bấm duyệt`
  }
  if (state.autoApprove) return null
  return "Khách chưa duyệt ảnh thành phẩm — tiệm yêu cầu khách bấm duyệt mới được giao. Hãy nhắc khách xem ảnh trên trang theo dõi đơn"
}

/** Lý do chặn giao ship (máy chủ) khi còn chờ khách duyệt ảnh, hoặc `null`. */
export function photoApprovalDispatchBlocker(state: PhotoApprovalState, now: Date = new Date()): string | null {
  return photoApprovalBlockerAt(state, now.getTime())
}

/**
 * Hoa đã qua bước ảnh mà KHÔNG có lần tải ảnh thành phẩm nào → Điều phối đã bỏ qua ảnh (tin nhắn nhắc
 * khách không mời "xem ảnh"). Gọi khi hoa đã xong; thiếu dữ liệu duyệt ảnh → coi như có ảnh.
 */
export function photoWasSkipped(state: Pick<PhotoApprovalState, "uploadedAt"> | null | undefined): boolean {
  return state ? state.uploadedAt === null : false
}

/** Đọc mốc ảnh từ `qc_records` của đơn. */
export function photoMilestonesOf(qcRecords: readonly { notes: string | null; created_at: Date }[]): { uploadedAt: Date | null; customerApprovedAt: Date | null } {
  // Lần tải ảnh MỚI NHẤT (Điều phối có thể chụp lại) — không phụ thuộc thứ tự truy vấn
  const latest = (note: string) =>
    qcRecords.filter((qc) => qc.notes === note).reduce<Date | null>((max, qc) => (!max || qc.created_at > max ? qc.created_at : max), null)
  return { uploadedAt: latest("PRODUCT_PHOTO_UPLOADED"), customerApprovedAt: latest("CUSTOMER_PHOTO_APPROVED") }
}

/** Trạng thái khách duyệt ảnh thành phẩm của một đơn theo cài đặt hiệu lực của tiệm / thẻ chào. */
export function orderPhotoApproval(
  order: { qc_records: { notes: string | null; created_at: Date }[]; greeting_sessions?: { catalog?: { filters: unknown } | null }[] | undefined },
  shopSettings: unknown,
  now: Date,
): PhotoApprovalState {
  const catalogFilters = order.greeting_sessions?.find((s) => s.catalog?.filters)?.catalog?.filters
  const timing = resolvePhotoReviewTiming(shopSettings, catalogFilters)
  return photoApprovalState({
    mode: timing.mode,
    reviewMinutes: timing.minutes,
    autoApprove: timing.autoApprove,
    ...photoMilestonesOf(order.qc_records),
    now,
  })
}
