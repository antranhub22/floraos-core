import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { conflict, notFound } from "@/core/http/errors"
import { Prisma } from "@/generated/prisma/client"
import { signStorageUrl } from "@/modules/assets/infra/storage-signing"
import type { GreetingCatalogType } from "../domain/greeting-card-types"

const SIGNED_URL_TTL_MS = 7 * 86_400_000

/** Dòng catalog kèm sản phẩm — ảnh chính + tối đa 10 biến thể (size) theo giá tăng dần. */
export const CATALOG_ITEMS_INCLUDE = {
  items: {
    include: {
      product: {
        include: {
          images: { where: { role: "MAIN" as const }, take: 1 },
          variants: { orderBy: { multiplier: "asc" as const }, take: 10 },
        },
      },
    },
    orderBy: { sort_order: "asc" as const },
  },
}

function signedStorageUrl(storageKey: string, exp: number): string {
  return `/api/v1/storage/${storageKey}?exp=${exp}&sig=${signStorageUrl(storageKey, exp)}`
}

/**
 * Bộ sưu tập Thẻ chào (CRUD trong phạm vi tổ chức) + ký URL ảnh.
 * `GreetingCardRepository` kế thừa lớp này và thêm phiên/link công khai.
 */
export class GreetingCatalogRepository {
  constructor(protected readonly db = prisma) {}

  /** Mọi `productIds` phải thuộc tổ chức hiện tại — bản cũ gắn được sản phẩm của tiệm khác. */
  private async assertProductsOwned(ctx: TenantContext, productIds: string[]) {
    const unique = [...new Set(productIds)]
    if (unique.length === 0) return unique
    const owned = await this.db.products.count({ where: scopedWhere(ctx, { id: { in: unique } }) })
    if (owned !== unique.length) throw notFound()
    return unique
  }


  async createCatalog(
    ctx: TenantContext,
    input: {
      code: string
      name: string
      type?: GreetingCatalogType | undefined
      description?: string | null | undefined
      filters?: Record<string, unknown> | null | undefined
      productIds?: string[] | undefined
      createdBy: string
    }
  ) {
    const productIds = await this.assertProductsOwned(ctx, input.productIds ?? [])

    const code = input.code.toLowerCase().trim()
    const taken = await this.db.greeting_catalogs.findFirst({
      where: scopedWhere(ctx, { code }),
      select: { id: true },
    })
    if (taken) throw conflict(`Mã bộ sưu tập "${code}" đã tồn tại, vui lòng chọn mã khác`)

    return this.db.$transaction(async (tx) => {
      const catalog = await tx.greeting_catalogs.create({
        data: {
          organization_id: ctx.organizationId,
          code,
          name: input.name.trim(),
          type: input.type || "STANDARD",
          description: input.description ?? null,
          filters: (input.filters ?? Prisma.DbNull) as Prisma.InputJsonValue,
          created_by: input.createdBy,
        },
      })

      if (productIds.length > 0) {
        await tx.greeting_catalog_products.createMany({
          data: productIds.map((productId, index) => ({
            organization_id: ctx.organizationId,
            catalog_id: catalog.id,
            product_id: productId,
            sort_order: index,
          })),
          skipDuplicates: true,
        })
      }

      return catalog
    })
  }


  async getCatalogByCode(ctx: TenantContext, code: string) {
    return this.db.greeting_catalogs.findFirst({
      where: scopedWhere(ctx, { code: code.toLowerCase().trim(), is_active: true }),
      select: { id: true },
    })
  }


  async listCatalogs(ctx: TenantContext) {
    return this.db.greeting_catalogs.findMany({
      where: scopedWhere(ctx, { is_active: true }),
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { items: true, sessions: true } },
      },
      orderBy: { created_at: "desc" },
      take: 100,
    })
  }


  async getCatalogById(ctx: TenantContext, id: string) {
    const catalog = await this.db.greeting_catalogs.findFirst({
      where: scopedWhere(ctx, { id }),
      include: { ...CATALOG_ITEMS_INCLUDE, _count: { select: { sessions: true } } },
    })
    if (!catalog) return null

    // Resolve storage_key → signed URL for each product's main image (chống N+1)
    const assetIds = catalog.items.flatMap((item) => item.product.images.map((img) => img.asset_id))
    const urls = await this.getAssetsStorageMap(ctx.organizationId, assetIds)

    return {
      ...catalog,
      items: catalog.items.map((item) => {
        const mainImg = item.product.images[0]
        return {
          ...item,
          product: { ...item.product, masterImageUrl: mainImg ? urls.get(mainImg.asset_id) : undefined },
        }
      }),
    }
  }


  async updateCatalog(
    ctx: TenantContext,
    id: string,
    data: {
      name?: string | undefined
      description?: string | null | undefined
      type?: GreetingCatalogType | undefined
      isActive?: boolean | undefined
    }
  ) {
    const result = await this.db.greeting_catalogs.updateMany({
      where: scopedWhere(ctx, { id }),
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.isActive !== undefined ? { is_active: data.isActive } : {}),
      },
    })
    if (result.count === 0) throw notFound()
  }


  async deleteCatalog(ctx: TenantContext, id: string) {
    // Soft delete: đặt is_active=false, không xóa thật
    const result = await this.db.greeting_catalogs.updateMany({
      where: scopedWhere(ctx, { id }),
      data: { is_active: false },
    })
    if (result.count === 0) throw notFound()
  }


  async addProductToCatalog(ctx: TenantContext, catalogId: string, productId: string) {
    const catalog = await this.db.greeting_catalogs.findFirst({
      where: scopedWhere(ctx, { id: catalogId }),
      select: { id: true },
    })
    if (!catalog) throw notFound()
    await this.assertProductsOwned(ctx, [productId])

    const maxOrder = await this.db.greeting_catalog_products.aggregate({
      where: { catalog_id: catalogId },
      _max: { sort_order: true },
    })

    return this.db.greeting_catalog_products.upsert({
      where: { catalog_id_product_id: { catalog_id: catalogId, product_id: productId } },
      create: {
        organization_id: ctx.organizationId,
        catalog_id: catalogId,
        product_id: productId,
        sort_order: (maxOrder._max.sort_order ?? -1) + 1,
      },
      update: {},
    })
  }


  async removeProductFromCatalog(ctx: TenantContext, catalogId: string, productId: string) {
    const catalog = await this.db.greeting_catalogs.findFirst({
      where: scopedWhere(ctx, { id: catalogId }),
      select: { id: true },
    })
    if (!catalog) throw notFound()

    return this.db.greeting_catalog_products.deleteMany({
      where: { organization_id: ctx.organizationId, catalog_id: catalogId, product_id: productId },
    })
  }


  /** Ký URL ảnh — chỉ ký asset của đúng tổ chức sở hữu thẻ. */
  async getAssetsStorageMap(organizationId: string, assetIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>()
    if (assetIds.length === 0) return map
    const assets = await this.db.assets.findMany({
      where: { id: { in: [...new Set(assetIds)] }, organization_id: organizationId },
      select: { id: true, storage_key: true },
    })
    const exp = Date.now() + SIGNED_URL_TTL_MS
    for (const a of assets) map.set(a.id, signedStorageUrl(a.storage_key, exp))
    return map
  }


  async getAssetStorageUrl(organizationId: string, assetId: string): Promise<string | null> {
    const map = await this.getAssetsStorageMap(organizationId, [assetId])
    return map.get(assetId) ?? null
  }
}
