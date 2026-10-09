import type { InputJsonValue, product_status, products } from "./entities"

import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy"
import { signStorageUrl } from "@/modules/assets/infra/storage-signing"

import type { DbClient } from "./db-client"
import { attachMainImageIfMissing, linkMainImage } from "./product-main-image"

/** Kết quả trả về từ `listWithPreview` — bản ghi sản phẩm kèm ảnh chính và giá. */
export type ProductPreviewRow = products & {
  masterImageUrl?: string | undefined
  price_vnd: number | null
  /** Link Google Drive từ `attributes.drive_link` — fallback thumbnail khi chưa có ảnh lưu trữ. */
  driveLink?: string | undefined
}

export type CreateProductInput = {
  code: string
  name: string
  branchId?: string | null | undefined
  category?: string | null | undefined
  shape?: string | null | undefined
  facing?: string | null | undefined
  container?: string | null | undefined
  status?: product_status | undefined
  attributes?: Record<string, unknown> | null | undefined
  imageAssetId?: string | null | undefined
}

export type UpdateProductIdentityInput = {
  category: string | null
  shape: string | null
  facing: string | null
  container: string | null
  attributes: Record<string, unknown>
}

/** `PATCH /products/:id` (`L3`, đặc tả 06 mục 6) — sửa tay, tách khỏi
 *  `updateIdentity` (chỉ dùng nội bộ khi duyệt phân tích ảnh, `H3`). Mọi
 *  trường tuỳ chọn — hợp nhất nông với bản ghi hiện có (khác PUT). */
export type UpdateProductInput = {
  code?: string | undefined
  name?: string | undefined
  branchId?: string | null | undefined
  category?: string | null | undefined
  shape?: string | null | undefined
  facing?: string | null | undefined
  container?: string | null | undefined
  status?: product_status | undefined
  attributes?: Record<string, unknown> | null | undefined
}

export type ListProductsFilters = {
  branchId?: string | null | undefined
  status?: product_status | undefined
  category?: string | undefined
  occasionCode?: string | undefined
  color?: string | undefined
  collection?: string | undefined
  priceMin?: number | undefined
  priceMax?: number | undefined
  /** Tìm theo tên hoặc mã SKU (ILIKE, không phân biệt hoa-thường). */
  search?: string | undefined
}

export type ListProductsPage = {
  limit: number
  cursor?: string | null | undefined
}

/**
 * Product Master — đặc tả 07 mục 9, P5. `create`/`updateIdentity` nhận `db`
 * tuỳ chọn để `approveAnalysis` ghi cùng giao dịch với chính lượt duyệt
 * (giống quy ước `AuditLogRepository`/`GenerationJobRepository` của P3).
 */
export class ProductRepository {
  constructor(private readonly db: DbClient = prisma) {}

  findById(ctx: TenantContext, id: string): Promise<products | null> {
    return this.db.products.findFirst({ where: scopedWhere(ctx, { id }) })
  }

  findByCode(ctx: TenantContext, code: string): Promise<products | null> {
    return this.db.products.findFirst({ where: scopedWhere(ctx, { code }) })
  }

  /**
   * Tập mã đã tồn tại trong tổ chức, trong SỐ mã được hỏi — dùng cho lượt
   * nạp hàng loạt (P8): 1.316 lần `findByCode` là 1.316 lượt round-trip,
   * một lần `findMany` với `code IN (…)` là một lượt.
   *
   * Cắt thành lô để câu SQL không phình vô hạn khi danh mục lớn dần. Chỉ
   * `select` cột `code` — không kéo về `attributes` (tới 4KB mỗi dòng) chỉ
   * để hỏi "đã có chưa".
   */
  async listExistingCodes(ctx: TenantContext, codes: string[]): Promise<Set<string>> {
    const found = new Set<string>()
    const CHUNK = 500
    for (let i = 0; i < codes.length; i += CHUNK) {
      const rows = await this.db.products.findMany({
        where: scopedWhere(ctx, { code: { in: codes.slice(i, i + CHUNK) } }),
        select: { code: true },
      })
      for (const row of rows) found.add(row.code)
    }
    return found
  }

  /**
   * `GET /products` (`L1`, đặc tả 06 mục 6) — M03, tra cứu chạy trên
   * Postgres. Lọc theo `branch_id`/`status`/`category`, phân trang kiểu con
   * trỏ giống `GenerationJobRepository.list` (`limit + 1` để biết còn trang
   * sau, không đếm `COUNT(*)` riêng).
   */
  list(
    ctx: TenantContext,
    filters: ListProductsFilters,
    page: ListProductsPage
  ): Promise<products[]> {
    const where = scopedWhere(ctx, {
      ...(filters.branchId !== undefined ? { branch_id: filters.branchId } : {}),
      ...(filters.status !== undefined ? { status: filters.status } : {}),
      ...(filters.category !== undefined ? { category: filters.category } : {}),
      ...(filters.occasionCode !== undefined
        ? { attributes: { path: ["occasionCodes"], array_contains: filters.occasionCode } }
        : {}),
      ...(filters.color !== undefined
        ? { attributes: { path: ["color"], equals: filters.color } }
        : {}),
      ...(filters.collection !== undefined
        ? { attributes: { path: ["collection"], equals: filters.collection } }
        : {}),
    })

    return this.db.products.findMany({
      where,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: page.limit,
      ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
    })
  }

  /**
   * Phần mở rộng của `list` cho màn hình Kho Sản Phẩm và modal chọn mẫu hoa.
   * Được include `product_images` (MAIN) và `product_variants` rồi giải asset URL
   * bằng 1 query `IN(asset_ids)` tập trung — không N+1 (cùng kỹ thuật đã dùng
   * trong `ProductMasterIndexRepository`).
   *
   * Giá `price_vnd`: ưu tiên `products.attributes.price`, fallback `product_variants[0].attributes.price`.
   * Đây là giá THAM CHIẾU hiển thị — giá bán thật vẫn phải qua `quotePrice()` (M02).
   */
  async listWithPreview(
    ctx: TenantContext,
    filters: ListProductsFilters,
    page: ListProductsPage
  ): Promise<ProductPreviewRow[]> {
    const where = scopedWhere(ctx, {
      ...(filters.branchId !== undefined ? { branch_id: filters.branchId } : {}),
      // Không lọc status → ẩn sản phẩm đã vào thùng rác (ARCHIVED); xem lại ở Kho dữ liệu → Thùng rác.
      status: filters.status ?? { not: "ARCHIVED" as product_status },
      ...(filters.category !== undefined ? { category: filters.category } : {}),
      ...(filters.occasionCode !== undefined
        ? { attributes: { path: ["occasionCodes"], array_contains: filters.occasionCode } }
        : {}),
      ...(filters.color !== undefined
        ? { attributes: { path: ["color"], equals: filters.color } }
        : {}),
      ...(filters.collection !== undefined
        ? { attributes: { path: ["collection"], equals: filters.collection } }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" as const } },
              { code: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    })

    // `prisma` singleton (không phải `this.db`) vì `include` cần full PrismaClient type;
    // `listWithPreview` không được gọi trong transaction (không có use-case nào cần).
    const rows = await prisma.products.findMany({
      where,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: page.limit,
      ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
      include: {
        images: { where: { role: "MAIN" }, take: 1 },
        variants: { take: 1 },
      },
    })

    if (rows.length === 0) return []

    // 1 query IN(asset_ids) thay vì N lượt — chống N+1.
    const assetIds = rows.flatMap((r) => r.images.map((img) => img.asset_id))
    const storageKeyById = new Map<string, string>()
    if (assetIds.length > 0) {
      const assets = await prisma.assets.findMany({
        where: { id: { in: assetIds } },
        select: { id: true, storage_key: true },
      })
      for (const a of assets) storageKeyById.set(a.id, a.storage_key)
    }

    return rows.map((row) => {
      const mainImg = row.images[0]
      const masterImageUrl = mainImg
        ? (() => {
            const key = storageKeyById.get(mainImg.asset_id)
            if (!key) return undefined
            const exp = Date.now() + 86_400_000 // 24h
            return `/api/v1/storage/${key}?exp=${exp}&sig=${signStorageUrl(key, exp)}`
          })()
        : undefined

      const attrs = (row.attributes as Record<string, unknown>) ?? {}
      const priceFromAttrs = typeof attrs.price === "number" && attrs.price > 0 ? attrs.price : null
      const variantAttrs = (row.variants[0]?.attributes as Record<string, unknown>) ?? {}
      const priceFromVariant = typeof variantAttrs.price === "number" && variantAttrs.price > 0 ? variantAttrs.price : null
      const price_vnd = priceFromAttrs ?? priceFromVariant
      const driveLink = typeof attrs.drive_link === "string" && attrs.drive_link ? attrs.drive_link : undefined

      const { images: _img, variants: _var, ...base } = row
      return { ...base, masterImageUrl, price_vnd, driveLink }
    })
  }

  /** Bù ảnh chính cho mã đã có (nhập lại kèm ảnh) — không thay ảnh sẵn có. */
  attachMainImageIfMissing(ctx: TenantContext, code: string, assetId: string): Promise<boolean> {
    return attachMainImageIfMissing(this.db, ctx, code, assetId)
  }

  async create(ctx: TenantContext, input: CreateProductInput): Promise<products> {
    const product = await this.db.products.create({
      data: scopedData(ctx, {
        code: input.code,
        name: input.name,
        branch_id: input.branchId ?? null,
        category: input.category ?? null,
        shape: input.shape ?? null,
        facing: input.facing ?? null,
        container: input.container ?? null,
        status: input.status ?? "DRAFT",
        attributes: (input.attributes ?? null) as InputJsonValue,
      }),
    })

    if (input.imageAssetId) await linkMainImage(this.db, ctx, product.id, input.imageAssetId)

    return product
  }

  /**
   * `PATCH /products/:id` (`L3`). Hợp nhất nông — chỉ trường có mặt trong
   * `input` mới bị ghi đè, khác `updateIdentity` (thay toàn bộ bốn trường
   * nhận dạng mỗi lượt duyệt).
   *
   * `updateMany` + đọc lại — cùng lý do `updateIdentity`: `where` của
   * `update()` phải là khoá duy nhất, `scopedWhere` không còn khớp hình dạng
   * đó sau khi thêm `organization_id`.
   */
  async update(
    ctx: TenantContext,
    id: string,
    input: UpdateProductInput
  ): Promise<products | null> {
    const result = await this.db.products.updateMany({
      where: scopedWhere(ctx, { id }),
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.branchId !== undefined ? { branch_id: input.branchId } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.shape !== undefined ? { shape: input.shape } : {}),
        ...(input.facing !== undefined ? { facing: input.facing } : {}),
        ...(input.container !== undefined ? { container: input.container } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.attributes !== undefined
          ? { attributes: input.attributes as InputJsonValue }
          : {}),
      },
    })
    if (result.count === 0) return null
    return this.findById(ctx, id)
  }

  /**
   * Ghi kết quả đã duyệt vào Product Master. Thay toàn bộ bốn trường nhận
   * dạng và `attributes` bằng bản đọc mới nhất — mỗi lượt duyệt là nguồn sự
   * thật hiện hành, không hợp nhất với `attributes` cũ (một giả định đơn
   * giản hoá, ghi ở `TECHNICAL_DEBT.md`).
   *
   * `updateMany` + đọc lại, không `update({where: scopedWhere(...)})` —
   * `where` của `update()` phải là khoá duy nhất; `scopedWhere` thêm
   * `organization_id` vào mệnh đề nên không còn khớp hình dạng đó (cùng lý
   * do `GenerationJobRepository.cancelIfPending` dùng `updateMany`).
   */
  async updateIdentity(
    ctx: TenantContext,
    id: string,
    input: UpdateProductIdentityInput
  ): Promise<products | null> {
    const result = await this.db.products.updateMany({
      where: scopedWhere(ctx, { id }),
      data: {
        category: input.category,
        shape: input.shape,
        facing: input.facing,
        container: input.container,
        attributes: input.attributes as InputJsonValue,
      },
    })
    if (result.count === 0) return null
    return this.findById(ctx, id)
  }
}
