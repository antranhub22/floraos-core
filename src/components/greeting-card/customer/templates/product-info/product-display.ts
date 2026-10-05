import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"

/**
 * NGUỒN DUY NHẤT cho thông tin sản phẩm hiển thị trên mọi mẫu Thẻ chào.
 * Muốn thêm/bớt/đổi thứ tự/đổi nhãn một trường → chỉ sửa tệp này; cả 20 mẫu,
 * bảng chi tiết, màn so sánh và danh sách đã thích đều đổi theo.
 */

export function formatVnd(value: number): string {
  return value > 0 ? `${value.toLocaleString("vi-VN")} ₫` : "Liên hệ"
}

/** Các dòng thông số, theo đúng thứ tự hiển thị. Dòng không có dữ liệu sẽ tự ẩn. */
export const PRODUCT_SPEC_FIELDS: { label: string; get: (p: GreetingCatalogProduct) => string | null | undefined }[] = [
  { label: "Giá", get: (p) => formatVnd(p.price) },
  { label: "Thành phần", get: (p) => p.flowersSummary },
  { label: "Dịp tặng", get: (p) => p.occasion },
  { label: "Phong cách", get: (p) => p.style },
  { label: "Mã mẫu", get: (p) => p.code },
]

export interface ProductDisplay {
  title: string
  priceLabel: string
  /** Một dòng tóm tắt dưới tên (thành phần hoa, nếu không có thì mô tả) */
  summary: string | null
  /** Nhãn ngắn: dịp tặng, phong cách */
  tags: string[]
  /** Lời kể / ý nghĩa của mẫu hoa */
  story: string | null
  /** Bảng thông số đầy đủ (không gồm giá — giá đã hiện riêng) */
  specs: { label: string; value: string }[]
  /** Nhãn cho trình đọc màn hình */
  ariaLabel: string
}

const clean = (v: string | null | undefined): string | null => {
  const t = v?.trim()
  return t ? t : null
}

export function toProductDisplay(p: GreetingCatalogProduct): ProductDisplay {
  const priceLabel = formatVnd(p.price)
  const summary = clean(p.flowersSummary) ?? clean(p.description)
  const story = clean(p.meaning) ?? (clean(p.flowersSummary) ? clean(p.description) : null)
  return {
    title: p.name,
    priceLabel,
    summary,
    tags: [p.occasion, p.style].map(clean).filter((v): v is string => Boolean(v)),
    story,
    specs: PRODUCT_SPEC_FIELDS.filter((f) => f.label !== "Giá")
      .map((f) => ({ label: f.label, value: clean(f.get(p)) }))
      .filter((r): r is { label: string; value: string } => Boolean(r.value)),
    ariaLabel: `${p.name}, ${priceLabel}`,
  }
}
