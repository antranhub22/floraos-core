import { randomUUID } from "node:crypto"

import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import type { Prisma, generation_jobs } from "@/generated/prisma/client"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { STORE_EXPORT_FEATURE, type StoreExportOutput } from "../domain/store-export"

export type { generation_jobs }

/**
 * Job "Tải dữ liệu cửa hàng" dùng chung bảng `generation_jobs` (feature `store.export`).
 * Không qua `enqueueJob`: không gọi mô hình nên không có hạn mức/credit để trừ.
 */
export class StoreExportJobRepository {
  constructor(private readonly jobs = new GenerationJobRepository()) {}

  findActive(ctx: TenantContext): Promise<generation_jobs | null> {
    return prisma.generation_jobs.findFirst({
      where: scopedWhere(ctx, { feature: STORE_EXPORT_FEATURE, status: { in: ["PENDING" as const, "PROCESSING" as const] } }),
      orderBy: { created_at: "desc" },
    })
  }

  findLatest(ctx: TenantContext): Promise<generation_jobs | null> {
    return prisma.generation_jobs.findFirst({
      where: scopedWhere(ctx, { feature: STORE_EXPORT_FEATURE }),
      orderBy: { created_at: "desc" },
    })
  }

  create(ctx: TenantContext): Promise<generation_jobs> {
    return this.jobs.create(ctx, {
      workspaceId: ctx.workspaceId,
      branchId: ctx.branchId,
      userId: ctx.userId,
      productId: null,
      feature: STORE_EXPORT_FEATURE,
      idempotencyKey: randomUUID(),
      payload: { requested_by: ctx.userId },
    })
  }

  claimNext(): Promise<generation_jobs | null> {
    return this.jobs.claimNext(STORE_EXPORT_FEATURE)
  }

  finish(ctx: TenantContext, id: string, input: { ok: boolean; output?: StoreExportOutput; error?: string; now: Date }) {
    return this.jobs.finishInline(ctx, id, {
      ok: input.ok,
      now: input.now,
      ...(input.output ? { output: input.output } : {}),
      ...(input.error ? { error: input.error } : {}),
    })
  }

  /** Toàn hệ thống — chỉ bộ dọn nền gọi: tệp ZIP đã quá hạn link mà chưa xoá. */
  listExpiredFiles(cutoff: Date, limit: number): Promise<generation_jobs[]> {
    return prisma.generation_jobs.findMany({
      where: {
        feature: STORE_EXPORT_FEATURE,
        status: "COMPLETED",
        completed_at: { lt: cutoff },
        NOT: { output: { path: ["file_removed"], equals: true } },
      },
      orderBy: { completed_at: "asc" },
      take: limit,
    })
  }

  async markFileRemoved(job: generation_jobs): Promise<void> {
    const output = { ...((job.output as Record<string, unknown> | null) ?? {}), file_removed: true }
    await prisma.generation_jobs.update({ where: { id: job.id }, data: { output: output as Prisma.InputJsonValue } })
  }
}
