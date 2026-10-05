import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { conflict, notFound } from "@/core/http/errors"
import { log } from "@/core/observability/log"
import { Prisma } from "@/generated/prisma/client"
import { signStorageUrl } from "@/modules/assets/infra/storage-signing"
import { isUniqueViolation } from "@/modules/coordinator/infra/transaction"
import { generateSendCode, linkAvailability } from "../domain/greeting-card-rules"
import type {
  GreetingCatalogType,
  GreetingSessionStatus,
  ProductSnapshot,
} from "../domain/greeting-card-types"

const SEND_CODE_ATTEMPTS = 5
const SIGNED_URL_TTL_MS = 7 * 86_400_000

const CATALOG_ITEMS_INCLUDE = {
  items: {
    include: {
      product: {
        include: { images: { where: { role: "MAIN" as const }, take: 1 }, variants: { take: 1 } },
      },
    },
    orderBy: { sort_order: "asc" as const },
  },
}

function signedStorageUrl(storageKey: string, exp: number): string {
  return `/api/v1/storage/${storageKey}?exp=${exp}&sig=${signStorageUrl(storageKey, exp)}`
}

export class GreetingCardRepository {
  constructor(private readonly db = prisma) {}

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

  /**
   * Tạo phiên với mã gửi ngẫu nhiên, duy nhất TOÀN HỆ THỐNG (link công khai
   * tra không theo tổ chức). Trùng thì sinh lại — xác suất trùng ~1/10^12.
   */
  private async createSessionWithFreshCode(
    prefix: string | undefined,
    build: (sendCode: string) => Prisma.greeting_sessionsUncheckedCreateInput
  ) {
    for (let attempt = 0; attempt < SEND_CODE_ATTEMPTS; attempt++) {
      const sendCode = generateSendCode(prefix)
      const taken = await this.db.greeting_sessions.findFirst({
        where: { send_code: sendCode },
        select: { id: true },
      })
      if (taken) continue
      try {
        return await this.db.greeting_sessions.create({ data: build(sendCode) })
      } catch (error) {
        if (!isUniqueViolation(error)) throw error
      }
    }
    throw new Error("Không sinh được mã gửi Thẻ chào duy nhất")
  }

  async createSession(
    ctx: TenantContext,
    input: {
      catalogId: string
      prefix?: string | undefined
      saleId: string
      customerName?: string | null | undefined
      customerPhone?: string | null | undefined
      expiresAt?: Date | null | undefined
    }
  ) {
    const catalog = await this.db.greeting_catalogs.findFirst({
      where: scopedWhere(ctx, { id: input.catalogId, is_active: true }),
      select: { id: true },
    })
    if (!catalog) throw notFound()

    return this.createSessionWithFreshCode(input.prefix, (sendCode) => ({
      organization_id: ctx.organizationId,
      catalog_id: catalog.id,
      send_code: sendCode,
      sale_id: input.saleId,
      customer_name: input.customerName ?? null,
      customer_phone: input.customerPhone ?? null,
      expires_at: input.expiresAt ?? null,
      status: "CREATED",
    }))
  }

  async createPublicSession(input: {
    organizationId: string
    catalogId: string
    customerName?: string | null
    customerPhone?: string | null
    productId: string
    snapshot: ProductSnapshot
  }) {
    return this.createSessionWithFreshCode("PUB", (sendCode) => ({
      organization_id: input.organizationId,
      catalog_id: input.catalogId,
      send_code: sendCode,
      sale_id: "public",
      customer_name: input.customerName ?? null,
      customer_phone: input.customerPhone ?? null,
      status: "SELECTED",
      selected_product_id: input.productId,
      product_snapshot: input.snapshot as unknown as Prisma.InputJsonValue,
      selected_at: new Date(),
    }))
  }

  /**
   * Tra phiên theo mã gửi cho trang công khai. Mã cũ dạng `T01-001` có thể
   * trùng giữa hai tiệm — khi đó KHÔNG đoán: trả `null` (404) thay vì mở
   * nhầm thẻ của tiệm khác.
   */
  async getPublicSessionBySendCode(sendCode: string) {
    const matches = await this.db.greeting_sessions.findMany({
      where: { send_code: sendCode.toUpperCase().trim() },
      include: {
        catalog: { include: CATALOG_ITEMS_INCLUDE },
        order: true,
      },
      take: 2,
    })
    if (matches.length > 1) {
      log.warn("greeting_card.send_code_ambiguous", { feature: "greeting-card", sendCode })
      return null
    }
    return matches[0] ?? null
  }

  /** Lấy catalog công khai theo ID — không cần auth, dùng cho route /g/[id]. */
  async getPublicCatalogById(catalogId: string) {
    return this.db.greeting_catalogs.findFirst({
      where: { id: catalogId, is_active: true },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        ...CATALOG_ITEMS_INCLUDE,
      },
    })
  }

  /**
   * Lấy catalog công khai theo slug tổ chức + code catalog.
   * Dùng cho route /g/[orgSlug]/[catalogCode] — URL thân thiện, có ý nghĩa.
   */
  async getPublicCatalogBySlugAndCode(orgSlug: string, catalogCode: string) {
    return this.db.greeting_catalogs.findFirst({
      where: {
        code: catalogCode.toLowerCase().trim(),
        is_active: true,
        organization: { slug: orgSlug.toLowerCase().trim() },
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        ...CATALOG_ITEMS_INCLUDE,
      },
    })
  }

  /** Tên hiển thị + cài đặt của tiệm cho trang công khai (không lộ gì khác). */
  async getShopProfile(organizationId: string) {
    const org = await this.db.organizations.findUnique({
      where: { id: organizationId },
      select: { name: true, settings: true, business_profile: { select: { display_name: true, phone: true } } },
    })
    return {
      name: org?.business_profile?.display_name || org?.name || "Tiệm hoa",
      phone: org?.business_profile?.phone ?? null,
      settings: org?.settings ?? null,
    }
  }

  async updateSession(
    sessionId: string,
    data: {
      status?: GreetingSessionStatus | undefined
      selectedProductId?: string | null | undefined
      productSnapshot?: ProductSnapshot | null | undefined
      openedAt?: Date | undefined
      selectedAt?: Date | undefined
    }
  ) {
    return this.db.greeting_sessions.update({
      where: { id: sessionId },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.selectedProductId !== undefined ? { selected_product_id: data.selectedProductId } : {}),
        ...(data.productSnapshot !== undefined
          ? { product_snapshot: data.productSnapshot as unknown as Prisma.InputJsonValue }
          : {}),
        ...(data.openedAt !== undefined ? { opened_at: data.openedAt } : {}),
        ...(data.selectedAt !== undefined ? { selected_at: data.selectedAt } : {}),
        last_active_at: new Date(),
      },
    })
  }

  /** Thu hồi link chưa có đơn. Trả `false` khi không có link nào đổi (không tồn tại/đã thu hồi/đã có đơn). */
  async revokeSession(ctx: TenantContext, sessionId: string): Promise<boolean> {
    const result = await this.db.greeting_sessions.updateMany({
      where: scopedWhere(ctx, { id: sessionId, revoked_at: null, order_id: null }),
      data: { revoked_at: new Date(), revoked_by: ctx.userId },
    })
    return result.count > 0
  }

  async findSessionState(ctx: TenantContext, sessionId: string) {
    return this.db.greeting_sessions.findFirst({
      where: scopedWhere(ctx, { id: sessionId }),
      select: { id: true, order_id: true, revoked_at: true },
    })
  }

  async recordJourneyEvent(
    organizationId: string,
    sessionId: string,
    eventType: string,
    metadata?: Record<string, unknown> | null | undefined
  ) {
    return this.db.greeting_journey_events.create({
      data: {
        organization_id: organizationId,
        session_id: sessionId,
        event_type: eventType,
        metadata: (metadata ?? Prisma.DbNull) as Prisma.InputJsonValue,
      },
    })
  }

  /**
   * Danh sách link đã gửi, phân trang con trỏ (mới nhất trước). Lấy dư 1 dòng
   * để bên gọi biết còn trang sau (`toPage`). Kèm trạng thái hiệu lực link.
   */
  async listSessions(
    ctx: TenantContext,
    options: {
      saleId?: string | undefined
      catalogId?: string | undefined
      status?: string | undefined
      limit: number
      cursor?: string | undefined
    }
  ) {
    const rows = await this.db.greeting_sessions.findMany({
      where: scopedWhere(ctx, {
        ...(options.saleId ? { sale_id: options.saleId } : {}),
        ...(options.catalogId ? { catalog_id: options.catalogId } : {}),
        ...(options.status ? { status: options.status } : {}),
      }),
      select: {
        id: true,
        send_code: true,
        sale_id: true,
        customer_name: true,
        customer_phone: true,
        status: true,
        order_id: true,
        expires_at: true,
        revoked_at: true,
        last_active_at: true,
        created_at: true,
        catalog: { select: { id: true, name: true, code: true } },
        order: { select: { id: true, code: true, status: true, total_vnd: true, paid_vnd: true } },
      },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: options.limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    })
    // Decimal → number: JSON của Decimal là chuỗi, UI cần số để định dạng/so sánh
    return rows.map((r) => ({
      ...r,
      link_state: linkAvailability({ expiresAt: r.expires_at, revokedAt: r.revoked_at, hasOrder: r.order_id !== null }),
      order: r.order ? { ...r.order, total_vnd: Number(r.order.total_vnd), paid_vnd: Number(r.order.paid_vnd) } : null,
    }))
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
