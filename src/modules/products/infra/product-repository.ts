import type { InputJsonValue, product_status, products } from "./entities"

import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy"

import type { DbClient } from "./db-client"

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
    })

    return this.db.products.findMany({
      where,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: page.limit,
      ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
    })
  }

  create(ctx: TenantContext, input: CreateProductInput): Promise<products> {
    return this.db.products.create({
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
