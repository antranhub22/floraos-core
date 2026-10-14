/**
 * Pure TypeScript Domain Engine cho Bộ Sưu Tập Nhanh (Quick Collection Generator).
 *
 * Lọc & chấm điểm sản phẩm đã được chuyển vào SSOT `@/lib/product-filter`.
 * File này chỉ giữ:
 *   - Types riêng của Quick Collection (QuickCollectionCandidate, QuickCollectionResult…)
 *   - Hàm sinh metadata (tên BST, slug, tin nhắn gửi khách)
 *   - Hàm `generateQuickCollection` — orchestrator gọi SSOT rồi sinh metadata
 */

import { rankProducts, scoreProduct } from "@/lib/product-filter"
import type { ProductFilterCriteria, PriceRange, FilterableProduct } from "@/lib/product-filter"

// ─────────────────────────────────────────────────────────────────────────────
// Types đặc thù của Quick Collection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sản phẩm ứng viên cho Quick Collection.
 * Các optional field dùng `string | null | undefined` (tương thích với mọi caller).
 */
export interface QuickCollectionCandidate {
  id: string
  code: string
  name: string
  /** Giá tham chiếu (VND). null = Liên hệ báo giá. */
  price: number | null
  category?: string | null | undefined
  shape?: string | null | undefined
  colorTheme?: string | null | undefined
  occasions?: string[]
  flowerTypes?: string[]
  imageUrl?: string | null | undefined
  status?: string
  attributes?: Record<string, unknown> | null | undefined
}

export interface QuickCollectionResult {
  selectedProducts: QuickCollectionCandidate[]
  totalMatched: number
  generatedName: string
  suggestedSlug: string
  customerMessage: string
  personalizedGreeting?: string | undefined
}

/** Re-export để các caller không cần import thêm từ lib */
export type { PriceRange }

export interface QuickCollectionCriteria {
  occasion?: string | undefined
  category?: string | undefined
  flowerType?: string | undefined
  colorTone?: string | undefined
  priceMin?: number | undefined
  priceMax?: number | undefined
  priceRanges?: PriceRange[] | undefined
  productLimit?: number | undefined
  customerName?: string | undefined
  customerPhone?: string | undefined
  customTitle?: string | undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers sinh metadata
// ─────────────────────────────────────────────────────────────────────────────

/** Chuẩn hoá chuỗi để tạo slug (không dấu, thường, dấu-gạch). */
function toSlug(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function buildGeneratedName(criteria: QuickCollectionCriteria): string {
  if (criteria.customTitle?.trim()) return criteria.customTitle.trim()
  const parts: string[] = []
  if (criteria.customerName?.trim()) {
    parts.push(`Dành Riêng Cho ${criteria.customerName.trim()}`)
  } else {
    parts.push("Bộ Sưu Tập Hoa")
  }
  if (criteria.occasion) parts.push(criteria.occasion)
  if (criteria.category) parts.push(criteria.category)
  if (criteria.colorTone) parts.push(`Tone ${criteria.colorTone}`)
  return parts.join(" — ")
}

function buildCustomerMessage(
  products: QuickCollectionCandidate[],
  criteria: QuickCollectionCriteria
): string {
  const count = products.length
  const name = criteria.customerName?.trim()
  if (name) {
    return `Dạ em chào ${name} ạ! Tiệm gửi ${name} link xem ${count} mẫu hoa chọn riêng cho mình: {URL}\n${name} xem ưng mẫu nào báo em chuẩn bị ngay nhé ạ!`
  }
  return `Dạ tiệm gửi anh/chị link ${count} mẫu hoa theo yêu cầu: {URL}\nAnh/chị ưng mẫu nào nhắn tiệm hỗ trợ ngay nhé ạ!`
}

// ─────────────────────────────────────────────────────────────────────────────
// Main: generateQuickCollection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tuyển chọn sản phẩm phù hợp nhất và sinh metadata cho bộ sưu tập nhanh.
 *
 * Lọc + chấm điểm do SSOT `rankProducts()` xử lý.
 * File này chỉ chịu trách nhiệm sinh tên, slug, và tin nhắn gửi khách.
 */
export function generateQuickCollection(
  candidates: QuickCollectionCandidate[],
  criteria: QuickCollectionCriteria
): QuickCollectionResult {
  const limit = Math.max(1, Math.min(20, criteria.productLimit ?? 6))

  // Ánh xạ QuickCollectionCriteria → ProductFilterCriteria (SSOT format)
  // Dùng conditional spread để chấp exactOptionalPropertyTypes
  const filterCriteria: ProductFilterCriteria = {
    ...(criteria.occasion ? { occasion: criteria.occasion } : {}),
    ...(criteria.category ? { category: criteria.category } : {}),
    ...(criteria.flowerType ? { flowerType: criteria.flowerType } : {}),
    ...(criteria.colorTone ? { colorTone: criteria.colorTone } : {}),
    ...(criteria.priceMin !== undefined ? { priceMin: criteria.priceMin } : {}),
    ...(criteria.priceMax !== undefined ? { priceMax: criteria.priceMax } : {}),
    ...(criteria.priceRanges?.length ? { priceRanges: criteria.priceRanges } : {}),
  }

  // Gọi SSOT engine: lọc ACTIVE + chấm điểm + sort + giới hạn
  const ranked = rankProducts(candidates as FilterableProduct[], filterCriteria, { limit })
  const selectedProducts = ranked.map((s) => s.product as QuickCollectionCandidate)

  // Sinh metadata
  const generatedName = buildGeneratedName(criteria)
  const baseSlug = toSlug(
    criteria.customerName || criteria.occasion || criteria.category || "bst"
  ) || "bst"
  const suggestedSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`
  const customerMessage = buildCustomerMessage(selectedProducts, criteria)
  const personalizedGreeting = criteria.customerName?.trim()
    ? `Mẫu hoa chọn riêng cho ${criteria.customerName.trim()}`
    : undefined

  // totalMatched = số sản phẩm đạt ngưỡng điểm >= base (50)
  const allRanked = rankProducts(candidates as FilterableProduct[], filterCriteria)
  const totalMatched = allRanked.filter((s) => s.score >= 50).length

  return {
    selectedProducts,
    totalMatched,
    generatedName,
    suggestedSlug,
    customerMessage,
    personalizedGreeting,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export scoring types cho caller cần dùng
// ─────────────────────────────────────────────────────────────────────────────
export type { ScoredProduct } from "@/lib/product-filter"
export { scoreProduct, rankProducts } from "@/lib/product-filter"

/**
 * @deprecated Dùng `scoreProduct` từ `@/lib/product-filter` thay thế.
 * Giữ lại để tương thích ngược với test hiện tại.
 */
export function scoreProductForCollection(
  product: QuickCollectionCandidate,
  criteria: QuickCollectionCriteria
): { score: number; tags: string[] } {
  const filterCriteria: ProductFilterCriteria = {
    ...(criteria.occasion ? { occasion: criteria.occasion } : {}),
    ...(criteria.category ? { category: criteria.category } : {}),
    ...(criteria.flowerType ? { flowerType: criteria.flowerType } : {}),
    ...(criteria.colorTone ? { colorTone: criteria.colorTone } : {}),
    ...(criteria.priceMin !== undefined ? { priceMin: criteria.priceMin } : {}),
    ...(criteria.priceMax !== undefined ? { priceMax: criteria.priceMax } : {}),
    ...(criteria.priceRanges?.length ? { priceRanges: criteria.priceRanges } : {}),
  }
  const scored = scoreProduct(product as FilterableProduct, filterCriteria)
  return { score: scored.score, tags: scored.matchTags }
}
