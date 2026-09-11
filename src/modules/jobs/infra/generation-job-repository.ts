import type { generation_jobs, InputJsonValue } from "./entities"

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
        payload: input.payload as InputJsonValue,
        attempts: 0,
      }),
    })
  }

  /**
   * Job TỔNG HỢP đại diện cho một lượt xử lý đã chạy ở NGOÀI core và đã xong
   * từ trước — dùng cho lượt nạp dữ liệu lịch sử của AVI GIFT (P8, nợ #34).
   *
   * Không đi qua `enqueueJob`: hàng đợi, hạn mức và credit đều là chuyện của
   * việc SẮP chạy. Tám lượt phân tích ở v1 đã chạy xong từ tháng trước, trên
   * hạ tầng khác, và khách đã trả tiền cho chúng ở v1 — tính credit lần nữa
   * là tính hai lần cho một việc. Vì cùng lý do, lượt nạp KHÔNG ghi
   * `usage`: bảng đó đo mức dùng trên nền tảng này (`YC-U1`).
   *
   * Vẫn giữ `idempotency_key` như mọi job khác, nên chạy lại lượt nạp không
   * tạo job thứ hai — `@@unique([organization_id, feature, idempotency_key])`.
   */
  createCompletedHistorical(
    ctx: TenantContext,
    input: CreateJobInput & { completedAt: Date }
  ): Promise<generation_jobs> {
    return this.db.generation_jobs.create({
      data: scopedData(ctx, {
        workspace_id: input.workspaceId,
        branch_id: input.branchId,
        user_id: input.userId,
        product_id: input.productId,
        feature: input.feature,
        status: "COMPLETED" as const,
        idempotency_key: input.idempotencyKey,
        payload: input.payload as InputJsonValue,
        // `result` là PHÁN QUYẾT nghiệp vụ (`APPROVED`/`REJECTED`/`WARNING`
        // của Identity Guard, P9 — `job-rules.ts`), một cột `String?`, không
        // phải chỗ chứa số liệu lượt chạy. Lượt nạp lịch sử không có phán
        // quyết nào để ghi: nó không chạy qua cổng nào cả. Số liệu lượt nạp
        // nằm ở `payload`, cột Json đúng nghĩa.
        result: null,
        attempts: 1,
        started_at: input.completedAt,
        completed_at: input.completedAt,
      }),
    })
  }

  /**
   * `GET /jobs` (`G4` chỉ thấy job của mình, `G5` toàn tổ chức — đặc tả 06
   * mục 7). `onlyMine` khi ngữ cảnh có `G4` mà không có `G5`; route quyết định
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
   * Ứng viên hàng chờ duyệt M04a (`GET /media/optimizations`, `I2`, nợ #48).
   * COMPLETED và không REJECTED (`REJECTED` không vào luồng duyệt — `YC-R5`)
   * — use-case gọi hàm này còn lọc tiếp "Master Image đã duyệt hay chưa" vì
   * `assets` không có quan hệ Prisma ngược lại đây để JOIN thẳng.
   */
  listCompletedNotRejected(
    ctx: TenantContext,
    options: { feature: string; limit: number }
  ): Promise<generation_jobs[]> {
    return this.db.generation_jobs.findMany({
      where: scopedWhere(ctx, {
        feature: options.feature,
        status: "COMPLETED" as const,
        NOT: { result: "REJECTED" },
      }),
      orderBy: [{ completed_at: "desc" }, { id: "desc" }],
      take: options.limit,
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
   * Job bị Identity Guard từ chối — đầu vào của tiến trình hoàn credit
   * (D3, `scripts/hoan-credit.ts`).
   *
   * KHÔNG lọc sẵn "đã hoàn hay chưa" ở đây: `usage.job_id` là cột thường,
   * không có quan hệ Prisma tới `generation_jobs` (đặc tả 07 mục 7 khai nó
   * là `String?` trần), nên `usage: { none: … }` không dùng được. Việc lọc
   * nằm ở `refundRejectedJob`, vốn đằng nào cũng phải đọc lại các dòng
   * `usage` của job để biết đã trừ bao nhiêu credit — và chính nó là chốt
   * idempotent, nên lọc hai lần cũng không thêm an toàn.
   *
   * Chạy toàn hệ thống, KHÔNG dùng `scopedWhere` — có chủ đích, cùng lý do
   * `markStuckAsFailed`: nó không phục vụ một ngữ cảnh người dùng nào. Mỗi
   * dòng trả về mang theo `organization_id` của chính nó, và use-case hoàn
   * credit dựng ngữ cảnh từ đúng giá trị đó chứ không từ tham số nào khác.
   */
  /**
   * Job thuộc diện hoàn credit, mọi `feature`. Ba diện ở
   * `usage/domain/refund-policy.ts`; câu `where` dưới đây phải nói cùng một
   * điều với `lyDoHoanCredit` — nó là bản dịch sang SQL của đúng luật đó,
   * để tiến trình quét không phải kéo cả bảng job về rồi lọc trong bộ nhớ.
   *
   * Chạy toàn hệ thống, không theo một tổ chức — cùng lý do với
   * `markStuckAsFailed`, nên không dùng `scopedWhere`.
   */
  listRefundable(limit: number): Promise<generation_jobs[]> {
    return this.db.generation_jobs.findMany({
      where: {
        OR: [
          { status: "COMPLETED", result: "REJECTED" },
          { status: "CANCELLED" },
          { status: "FAILED" },
        ],
      },
      orderBy: { created_at: "asc" },
      take: limit,
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
