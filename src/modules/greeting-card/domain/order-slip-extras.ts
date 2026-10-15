/**
 * Phần bổ sung cho Thẻ Đơn Khách hàng: mã mẫu, ảnh gốc, ghi chú khách nhập lúc đặt.
 * Thuần domain.
 */

export interface OrderSlipExtras {
  productCode: string | null
  /** Ảnh gốc của mẫu (URL ký trong kho) — null nếu mẫu chỉ có ảnh Drive */
  productImageUrl: string | null
  /** Link Google Drive của mẫu (sản phẩm nhập Excel) */
  productDriveLink: string | null
  /** Ghi chú khách gửi cửa hàng / thợ cắm hoa */
  customerNote: string | null
  /** Ghi chú khách gửi người giao hoa */
  deliveryNote: string | null
}

/**
 * Ghi chú khách nhập lúc đặt nằm ở đầu `internal_note`; các dòng nhân viên/hệ thống ghi sau đều
 * bắt đầu bằng thẻ `[...]` ([Báo giá], [Huỷ], [Florist]…) → chỉ lấy phần trước dòng thẻ đầu tiên.
 */
export function customerNoteOf(internalNote: string | null | undefined): string | null {
  if (!internalNote) return null
  const kept: string[] = []
  for (const line of internalNote.split("\n")) {
    if (/^\s*\[[^\]]+\]/.test(line)) break
    kept.push(line)
  }
  const note = kept.join("\n").trim()
  return note || null
}

export function deliveryNoteOf(deliveryAddress: unknown): string | null {
  if (!deliveryAddress || typeof deliveryAddress !== "object") return null
  const notes = (deliveryAddress as { notes?: unknown }).notes
  return typeof notes === "string" && notes.trim() ? notes.trim() : null
}

/** Mã/ảnh lúc khách chốt mẫu (bản chụp trên dòng đơn). */
export function snapshotOf(metadata: unknown): { code: string | null; imageUrl: string | null; driveLink: string | null } {
  const m = (metadata && typeof metadata === "object" ? metadata : {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)
  return { code: str(m.code), imageUrl: str(m.imageUrl), driveLink: str(m.driveLink) }
}
