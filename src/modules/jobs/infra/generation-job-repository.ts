import type { generation_jobs } from "./entities"

import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy"

import type { DbClient } from "./db-client"

export type CreateJobInput = {
  workspaceId: string
  branchId: string | null
  userId: string
  productId: string | null
  feature: string
  payload: unknown
  idempotencyKey: string
}

/**
 * `generation_jobs` — đặc tả 07 mục 6. Bộ gác tổ chức ở tầng này
 * (`scopedWhere`/`scopedData`), giống mọi repository khác của core.
 */
export class GenerationJobRepository {
  constructor(private readonly db: DbClient = prisma) {}

  findById(ctx: TenantContext, id: string): Promise<generation_jobs | null> {
    return this.db.generation_jobs.findFirst({ where: scopedWhere(ctx, { id }) })
  }

  /** Idempotency (`YC-U7`) — duy nhất theo (`organization_id`, `feature`, `idempotency_key`). */
  findByIdempotencyKey(
    ctx: TenantContext,
    feature: string,
    idempotencyKey: string
  ): Promise<generation_jobs | null> {
    return this.db.generation_jobs.findFirst({
      where: scopedWhere(ctx, { feature, idempotency_key: idempotencyKey }),
    })
  }

  create(ctx: TenantContext, input: CreateJobInput): Promise<generation_jobs> {
    return this.db.generation_jobs.create({
      data: scopedData(ctx, {
        workspace_id: input.workspaceId,
        branch_id: input.branchId,
        user_id: input.userId,
        product_id: input.productId,
        feature: input.feature,
        status: "PENDING" as const,
        idempotency_key: input.idempotencyKey,
        payload: input.payload as never,
        attempts: 0,
      }),
    })
  }

  /**
   * `GET /jobs` (`G4` chỉ job của mình, `G5` toàn tổ chức — đặc tả 06 mục
   * 7). `onlyMine` khi ngữ cảnh có `G4` mà không có `G5`; route quyết định
   * giá trị này, repository chỉ lọc theo nó.
   */
  list(
    ctx: TenantContext,
    options: { onlyUserId?: string | undefined; limit: number; cursor?: string | null }
  ): Promise<generation_jobs[]> {
    return this.db.generation_jobs.findMany({
      where: scopedWhere(ctx, options.onlyUserId ? { user_id: options.onlyUserId } : {}),
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: options.limit,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    })
  }

  /**
   * Huỷ — chỉ job còn `PENDING` (`YC-J4`). `updateMany` với điều kiện
   * `status: "PENDING"` ngay trong `where` là chốt chặn đua: hai lời gọi huỷ
   * đồng thời chỉ một cái thắng, cái còn lại thấy `count === 0`.
   */
  async cancelIfPending(ctx: TenantContext, id: string): Promise<generation_jobs | null> {
    const result = await this.db.generation_jobs.updateMany({
      where: scopedWhere(ctx, { id, status: "PENDING" as const }),
      data: { status: "CANCELLED" as const, cancelled_at: new Date() },
    })
    if (result.count === 0) return null
    return this.findById(ctx, id)
  }

  /**
   * Chạy lại — chỉ job `FAILED` (`YC-J3`). Trả về `generation_jobs` mới hay
   * `null` nếu job không còn ở trạng thái `FAILED` lúc ghi (đua hoặc đã
   * không phải `FAILED` từ đầu) — tầng use-case dịch `null` thành 409.
   */
  async retryIfFailed(ctx: TenantContext, id: string): Promise<generation_jobs | null> {
    const current = await this.findById(ctx, id)
    if (!current) return null

    const result = await this.db.generation_jobs.updateMany({
      where: scopedWhere(ctx, { id, status: "FAILED" as const }),
      data: {
        status: "PENDING" as const,
        stage: null,
        result: null,
        error: null,
        attempts: current.attempts + 1,
        started_at: null,
        completed_at: null,
      },
    })
    if (result.count === 0) return null
    return this.findById(ctx, id)
  }

  /**
   * Lấy việc của worker (`YC-J7`, đặc tả 07 mục 6): `SELECT … FOR UPDATE SKIP
   * LOCKED` trên `generation_jobs`, lọc theo `feature`. Hai worker gọi đồng
   * thời không bao giờ nhận cùng một dòng — dòng đang bị khoá bởi một
   * transaction khác bị bỏ qua thay vì chờ.
   *
   * Đặt ở TS làm bằng chứng cơ chế đúng (bộ test cách ly gọi hàm này song
   * song); worker Python thật chạy đúng câu SQL này qua `psycopg`, không gọi
   * lại hàm TS — hai bên không nói chuyện qua HTTP (`YC-J8`).
   */
  async claimNext(feature: string): Promise<generation_jobs | null> {
    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<generation_jobs[]>`
        SELECT * FROM generation_jobs
         WHERE status = 'PENDING' AND feature = ${feature}
         ORDER BY created_at
         FOR UPDATE SKIP LOCKED
         LIMIT 1
      `
      const job = rows[0]
      if (!job) return null

      const updated = await tx.generation_jobs.update({
        where: { id: job.id },
        data: { status: "PROCESSING", started_at: new Date() },
      })
      return updated
    })
  }

  /**
   * Tiến trình quét (`YC-J10`): job `PROCESSING` quá `started_at + 15 phút`
   * bị đánh dấu `FAILED`. Chạy toàn hệ thống, không theo một tổ chức — đây
   * KHÔNG dùng `scopedWhere` có chủ đích, vì nó không phục vụ một ngữ cảnh
   * người dùng nào.
   */
  async markStuckAsFailed(now: Date, timeoutMs: number): Promise<number> {
    const threshold = new Date(now.getTime() - timeoutMs)
    const result = await this.db.generation_jobs.updateMany({
      where: { status: "PROCESSING", started_at: { lt: threshold } },
      data: { status: "FAILED", error: "worker timeout", completed_at: now },
    })
    return result.count
  }
}
