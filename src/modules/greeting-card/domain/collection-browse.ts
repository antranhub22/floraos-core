/**
 * Trợ giúp lướt bộ sưu tập phía khách: khoảng giá, mẫu tương tự, tin nhắn hỏi tiệm kèm mẫu.
 * Pure TypeScript. Khoảng giá lấy từ bộ chung của cửa hàng (`@/lib/product-filter`).
 */

import { DEFAULT_PRICE_BUDGETS, inPriceBudget, type PriceBudget } from "@/lib/product-filter"

export interface BrowseProduct {
  id: string
  code: string
  name: string
  price: number | null
  category?: string | null | undefined
  occasion?: string | null | undefined
  color?: string | null | undefined
  available?: boolean | undefined
}

export interface PriceRange {
  key: string
  label: string
  min: number
  /** `null` = không giới hạn trên */
  max: number | null
}

const toRanges = (budgets: readonly PriceBudget[]): PriceRange[] =>
  budgets.map((b) => ({ key: b.id, label: b.label, min: b.min, max: b.max }))

export function inPriceRange(price: number | null, range: PriceRange): boolean {
  return inPriceBudget(price, range)
}

/** Các khoảng giá (theo cấu hình cửa hàng) có ít nhất một mẫu, kèm số mẫu. */
export function priceRangesOf(
  products: readonly BrowseProduct[],
  budgets: readonly PriceBudget[] = DEFAULT_PRICE_BUDGETS,
): Array<PriceRange & { count: number }> {
  return toRanges(budgets)
    .map((r) => ({ ...r, count: products.filter((p) => inPriceRange(p.price, r)).length }))
    .filter((r) => r.count > 0)
}

export function findPriceRange(
  key: string | null | undefined,
  budgets: readonly PriceBudget[] = DEFAULT_PRICE_BUDGETS,
): PriceRange | null {
  return toRanges(budgets).find((r) => r.key === key) ?? null
}

/** Mẫu còn hàng giống nhất (cùng loại / dịp / màu, giá gần) — dùng khi mẫu đang xem tạm hết. */
export function similarProducts<T extends BrowseProduct>(target: BrowseProduct, products: readonly T[], limit = 3): T[] {
  const score = (p: BrowseProduct) => {
    let s = 0
    if (target.category && p.category === target.category) s += 3
    if (target.occasion && p.occasion === target.occasion) s += 2
    if (target.color && p.color === target.color) s += 1
    if (target.price !== null && p.price !== null) s += Math.max(0, 2 - Math.abs(p.price - target.price) / Math.max(target.price, 1) * 4)
    return s
  }
  return products
    .filter((p) => p.id !== target.id && p.available !== false)
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p)
}

export function formatPriceVnd(price: number | null): string {
  return price === null || price <= 0 ? "giá liên hệ" : `${price.toLocaleString("vi-VN")}đ`
}

/** Tin nhắn Zalo soạn sẵn: "Tôi muốn hỏi về mẫu FL-8075 – 650.000đ." */
export function productInquiryMessage(product: Pick<BrowseProduct, "code" | "name" | "price">): string {
  const label = product.code ? `${product.code} (${product.name})` : product.name
  return `Tôi muốn hỏi về mẫu ${label} – ${formatPriceVnd(product.price)}.`
}

export function customDesignMessage(collectionName: string): string {
  return `Tôi đã xem bộ sưu tập "${collectionName}" nhưng chưa chọn được mẫu. Shop có nhận thiết kế riêng theo yêu cầu không?`
}
