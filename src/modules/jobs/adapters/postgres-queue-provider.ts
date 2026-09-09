import type { QueueProvider } from "@/core/ports"
import type { TenantContext } from "@/core/tenancy"

import type { DbClient } from "@/modules/jobs/infra/db-client"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { runInTransaction } from "@/modules/jobs/infra/transaction"

/** Tên kênh `LISTEN/NOTIFY` theo `feature` (đặc tả 07 mục 6). */
export function notifyChannelFor(feature: string): string {
  return `floraos_job_${feature.replace(/[^a-zA-Z0-9_]/g, "_")}`
}

/**
 * Adapter Postgres của `QueueProvider` (D6-1). `enqueue()` chỉ làm đúng hai
 * việc cổng mô tả — tạo `generation_jobs` và `NOTIFY` — trong giao dịch được
 * truyền vào qua `tx` (`enqueue-job.ts` đã kiểm hạn mức và ghi `usage` trước
 * đó, CÙNG một `runInTransaction`). Gọi `enqueue()` ngoài một giao dịch (bỏ
 * `tx`) vẫn chạy được — tự mở giao dịch riêng của nó — nhưng khi đó hạn mức
 * và job không còn atomically cùng nhau; chỉ dùng cho việc lấp job không qua
 * hạn mức (không có ở P3).
 */
export class PostgresQueueProvider implements QueueProvider {
  readonly name = "postgres"

  async enqueue(
    input: {
      ctx: TenantContext
      branchId: string | null
      productId: string | null
      feature: string
      payload: unknown
      idempotencyKey: string
    },
    tx?: unknown
  ): Promise<{ jobId: string }> {
    const run = async (db: DbClient) => {
      const repo = new GenerationJobRepository(db)
      const job = await repo.create(input.ctx, {
        workspaceId: input.ctx.workspaceId,
        branchId: input.branchId,
        userId: input.ctx.userId,
        productId: input.productId,
        feature: input.feature,
        payload: input.payload,
        idempotencyKey: input.idempotencyKey,
      })

      // Postgres trì hoãn phát NOTIFY tới sau khi giao dịch bao quanh commit
      // — gọi ngay trong `db` (dù `db` là `tx` hay `prisma` trần) vẫn đúng
      // thứ tự "đánh thức worker sau khi dòng job nhìn thấy được".
      await db.$queryRaw`SELECT pg_notify(${notifyChannelFor(input.feature)}, ${job.id})`

      return { jobId: job.id }
    }

    if (tx) return run(tx as DbClient)
    return runInTransaction(run)
  }

  async cancel(ctx: TenantContext, jobId: string): Promise<void> {
    await new GenerationJobRepository().cancelIfPending(ctx, jobId)
  }
}
