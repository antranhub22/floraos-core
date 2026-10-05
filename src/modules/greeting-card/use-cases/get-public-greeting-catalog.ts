import { GreetingCardRepository } from "../infra/greeting-card-repository"
import type { GreetingCatalogProduct } from "../domain/greeting-card-types"
import { toPublicCatalogFilters } from "../domain/greeting-template-registry"

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
  // Batch resolve asset storage keys (chống N+1)
  const assetIds = catalog.items.flatMap((item) =>
    item.product.images.map((img) => img.asset_id)
  )
  const assetMap = await repo.getAssetsStorageMap(assetIds)

  const products: GreetingCatalogProduct[] = catalog.items.map((item) => {
    const p = item.product
    const mainImg = p.images[0]
    const imageUrl = mainImg ? assetMap.get(mainImg.asset_id) ?? null : null

    const attrs = (p.attributes as Record<string, unknown>) ?? {}
    const variant = p.variants[0]
    const variantAttrs = (variant?.attributes as Record<string, unknown>) ?? {}
    const price =
      (typeof attrs.price === "number" && attrs.price > 0 ? attrs.price : null) ??
      (typeof variantAttrs.price === "number" && variantAttrs.price > 0 ? variantAttrs.price : null) ??
      500000

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      price,
      imageUrl,
      description: p.category ? `Danh mục: ${p.category}` : null,
      sortOrder: item.sort_order,
    }
  })

  return {
    status: "ACTIVE",
    catalog: {
      id: catalog.id,
      code: catalog.code,
      name: catalog.name,
      description: catalog.description,
      orgSlug: catalog.organization.slug,
      filters: toPublicCatalogFilters(catalog.filters),
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
