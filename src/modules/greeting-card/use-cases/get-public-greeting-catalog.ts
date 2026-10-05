import { GreetingCardRepository } from "../infra/greeting-card-repository"
import type { GreetingCatalogProduct } from "../domain/greeting-card-types"
import { parseShippingConfig, type ShippingConfig } from "../domain/brochure-pricing"
import { collectImageAssetIds, toCatalogProduct } from "./brochure-product-mapper"
import { toPublicCatalogFilters } from "../domain/greeting-template-registry"
import type { ShopContact } from "../domain/shop-contact"
import { getShopContact } from "./get-shop-contact"

export type PublicGreetingCatalogResult =
  | {
      status: "ACTIVE"
      catalog: {
        id: string
        code: string
        name: string
        description: string | null
        orgSlug: string
        filters?: Record<string, unknown> | null
      }
      products: GreetingCatalogProduct[]
      shipping: ShippingConfig
      shop: ShopContact | null
    }
  | { status: "NOT_FOUND" }

type CatalogWithItems = NonNullable<Awaited<ReturnType<GreetingCardRepository["getPublicCatalogById"]>>>

/**
 * Hàm dùng chung: map catalog DB → PublicGreetingCatalogResult.
 * Dùng lại bởi cả lookup theo ID và lookup theo slug+code.
 */
export async function mapCatalogToPublicResult(
  catalog: CatalogWithItems,
  repo: GreetingCardRepository
): Promise<PublicGreetingCatalogResult> {
  // Batch resolve asset storage keys (chống N+1) — giá theo Product Master, không bịa giá
  const assetMap = await repo.getAssetsStorageMap(catalog.organization_id, collectImageAssetIds(catalog.items))
  const products: GreetingCatalogProduct[] = catalog.items.map((item) => toCatalogProduct(item, assetMap))

  const shop = await repo.getShopProfile(catalog.organization_id)

  return {
    status: "ACTIVE",
    shipping: parseShippingConfig(shop.settings),
    shop: await getShopContact(catalog.organization_id),
    catalog: {
      id: catalog.id,
      code: catalog.code,
      name: catalog.name,
      description: catalog.description,
      orgSlug: catalog.organization.slug,
      filters: toPublicCatalogFilters(catalog.filters, catalog.organization.settings),
    },
    products,
  }
}

/**
 * Lấy Bộ Sưu Tập Thẻ Chào theo ID để hiển thị công khai (route /g/[id]).
 * Không cần auth, không tạo session — chỉ đọc dữ liệu.
 */
export async function getPublicGreetingCatalog(
  catalogId: string,
  repo = new GreetingCardRepository()
): Promise<PublicGreetingCatalogResult> {
  const catalog = await repo.getPublicCatalogById(catalogId)
  if (!catalog) return { status: "NOT_FOUND" }
  return mapCatalogToPublicResult(catalog, repo)
}
