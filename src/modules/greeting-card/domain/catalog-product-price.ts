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
  }
}

/**
 * Dựng thông tin mẫu hoa từ dữ liệu bộ sưu tập phía máy chủ. Giá luôn lấy từ
 * sản phẩm — không bao giờ tin giá do trình duyệt gửi lên.
 */
export function catalogItemToProduct(item: CatalogItemLike, imageUrl: string | null = null) {
  return {
    id: item.product.id,
    code: item.product.code,
    name: item.product.name,
    price: resolveCatalogProductPrice(item.product) ?? FALLBACK_CATALOG_PRICE,
    imageUrl,
    description: item.product.category ? `Danh mục: ${item.product.category}` : null,
    sortOrder: item.sort_order,
  }
}
