/**
 * Hợp nhất phần câu chữ bán hàng của M01b vào `products.attributes`.
 *
 * Duyệt phân tích (M01, `H3`) ghi `attributes` = `{ bom, confidence,
 * checklist, san_xuat }` — định mức vật tư mà M02 (giá) và M03 (tra cứu)
 * đọc. Duyệt dữ liệu bán hàng (M01b, `H6`) ghi thêm `salesData` vào CÙNG
 * một cột. Ghi đè nguyên cột ở bước sau sẽ xoá trắng định mức của bước
 * trước — một sản phẩm đi trọn hai cổng duyệt sẽ mất khả năng tính giá, im
 * lặng, và `audit_logs` không giữ lại bản cũ để dựng lại.
 *
 * Vì vậy bước sau chỉ được HỢP NHẤT NÔNG: giữ nguyên mọi khoá đã có, đặt
 * lại đúng khoá `salesData`. Cùng luật với `updateIdentity` của
 * `ProductRepository` (hợp nhất nông, khác PUT).
 *
 * Tệp thuần: không import hạ tầng, test không cần cơ sở dữ liệu.
 */

export type SalesData = {
  readonly description: string
  readonly tags: string[]
  /** Tên dịp như mô hình viết ra, để hiển thị. */
  readonly occasions: string[]
  /**
   * Mã dịp tương ứng trong danh mục của tổ chức.
   *
   * `ProductRepository.list` lọc theo `attributes.occasionCodes`. Ghi tên mà
   * không ghi mã thì bộ lọc dịp của màn tra cứu luôn rỗng — đúng tình trạng
   * trước đợt soát này.
   */
  readonly occasionCodes: string[]
  readonly priceSegment: string
}

/** Khoá mà M01b sở hữu trong `attributes`. Mọi khoá khác thuộc bước trước. */
export const SALES_DATA_KEY = "salesData" as const

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {}
}

/**
 * `current` là giá trị `products.attributes` đang nằm trong cơ sở dữ liệu
 * (có thể `null` với sản phẩm vừa tạo). Trả về bản mới giữ trọn khoá cũ.
 */
export function mergeSalesDataIntoAttributes(
  current: unknown,
  salesData: SalesData
): Record<string, unknown> {
  const next = asRecord(current)
  next[SALES_DATA_KEY] = {
    description: salesData.description,
    tags: salesData.tags,
    occasions: salesData.occasions,
    occasionCodes: salesData.occasionCodes,
    priceSegment: salesData.priceSegment,
  }
  // Khoá lọc ở mức trên cùng, đúng chỗ `ProductRepository.list` đọc.
  next.occasionCodes = salesData.occasionCodes
  return next
}

/**
 * Khoá của bước trước còn nguyên sau khi hợp nhất hay không — dùng cho ca
 * thử và cho nhật ký kiểm toán.
 */
export function preservedKeys(current: unknown): string[] {
  return Object.keys(asRecord(current)).filter((k) => k !== SALES_DATA_KEY)
}
