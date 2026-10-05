import type { GreetingCatalogProduct } from "./greeting-card-types"
import {
  readDescription,
  readDimensions,
  readFlowerNames,
  readOccasions,
  readPrimaryColor,
  readStyle,
  readWrapStyle,
} from "@/modules/products/domain/master-index-fields"

/**
 * Giá niêm yết của một mẫu hoa trong thẻ chào: `attributes.price` của sản phẩm,
 * nếu không có thì của biến thể đầu tiên. Trả `null` khi chưa khai báo giá.
 * Dùng chung cho link công khai, link gửi riêng và khung xem trước để cùng
 * một mẫu luôn hiện cùng một giá.
 */
export function resolveCatalogProductPrice(product: {
  attributes?: unknown
  variants?: ReadonlyArray<{ attributes?: unknown }> | null | undefined
}): number | null {
  const pick = (attrs: unknown): number | null => {
    if (!attrs || typeof attrs !== "object") return null
    const price = (attrs as Record<string, unknown>).price
    return typeof price === "number" && price > 0 ? price : null
  }
  return pick(product.attributes) ?? pick(product.variants?.[0]?.attributes)
}

/**
 * Sản phẩm chưa khai báo giá: 0 = "Liên hệ" trên giao diện; đơn hàng được nhận
 * nhưng không hiện QR, cửa hàng báo giá sau. (Trước đây tự gán 500.000 ₫.)
 */
export const FALLBACK_CATALOG_PRICE = 0

interface CatalogItemLike {
  sort_order: number
  product: {
    id: string
    code: string
    name: string
    category?: string | null
    attributes?: unknown
    variants?: ReadonlyArray<{ attributes?: unknown }> | null
    /** Lượt phân tích APPROVED mới nhất (nguồn Master Index) */
    analyses?: ReadonlyArray<{ raw?: unknown; edited?: unknown }> | null
  }
}

/**
 * Dựng thông tin mẫu hoa từ dữ liệu bộ sưu tập phía máy chủ. Giá luôn lấy từ
 * sản phẩm — không bao giờ tin giá do trình duyệt gửi lên.
 */
export function catalogItemToProduct(item: CatalogItemLike, imageUrl: string | null = null): GreetingCatalogProduct {
  const p = item.product
  const analysis = p.analyses?.[0]
  // Cùng quy tắc với Product Master Index; chỉ lấy trường được phép công khai (không giá vốn, không dữ liệu bán hàng)
  const src = { category: p.category ?? null, attributes: p.attributes, analysis: analysis?.edited ?? analysis?.raw ?? null }
  const flowers = readFlowerNames(src)
  const occasions = readOccasions(src)
  const dims = readDimensions(src)
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    price: resolveCatalogProductPrice(p) ?? FALLBACK_CATALOG_PRICE,
    imageUrl,
    description: readDescription(src),
    flowersSummary: flowers.length > 0 ? flowers.join(", ") : null,
    occasion: occasions.length > 0 ? occasions.join(", ") : null,
    style: readStyle(src),
    category: p.category ?? null,
    color: readPrimaryColor(src),
    dimensions: dims ? `Cao ${dims.heightCm} cm · Rộng ${dims.widthCm} cm` : null,
    wrapStyle: readWrapStyle(src),
    sortOrder: item.sort_order,
  }
}
