import { resolveProductPriceVnd } from "../domain/brochure-commerce-rules"
import { createProductSnapshot } from "../domain/greeting-card-rules"
import { resolvePricedVariants } from "../domain/brochure-pricing"
import type { GreetingCatalogProduct, ProductSnapshot } from "../domain/greeting-card-types"

/** Hình dạng tối thiểu của một dòng `greeting_catalog_products` kèm sản phẩm. */
export interface CatalogItemRow {
  sort_order: number
  product: {
    id: string
    code: string
    name: string
    category: string | null
    attributes: unknown
    images: Array<{ asset_id: string }>
    variants: Array<{ id: string; name: string; size: string | null; multiplier: number; attributes: unknown }>
  }
}

/** Dòng catalog → mẫu hiển thị cho khách. Giá luôn lấy từ Product Master ở server. */
export function toCatalogProduct(item: CatalogItemRow, imageUrls: Map<string, string>): GreetingCatalogProduct {
  const p = item.product
  const mainImg = p.images[0]
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    price: resolveProductPriceVnd(p.attributes, p.variants[0]?.attributes),
    imageUrl: mainImg ? imageUrls.get(mainImg.asset_id) ?? null : null,
    description: p.category ? `Danh mục: ${p.category}` : null,
    sortOrder: item.sort_order,
    variants: resolvePricedVariants(p.attributes, p.variants),
  }
}

export function collectImageAssetIds(items: CatalogItemRow[]): string[] {
  return items.flatMap((item) => item.product.images.map((img) => img.asset_id))
}

/** Đóng băng mẫu đã chọn; chỉ gọi với mẫu đã có giá. */
export function snapshotOf(product: GreetingCatalogProduct & { price: number }, now = new Date()): ProductSnapshot {
  return createProductSnapshot(product, now.toISOString())
}
