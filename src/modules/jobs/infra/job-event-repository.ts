import type { job_events } from "./entities"

import { prisma } from "@/core/tenancy/infra/prisma"

import type { DbClient } from "./db-client"

export type JobEventType = "stage" | "log" | "done"

/**
 * Nhật ký tiến trình job — đặc tả 05 mục 8, `YC-J9`. Bảng phụ, ghi cộng dồn
 * theo `job_id`, `seq` tăng dần. `GET /jobs/:id/events` (SSE) đọc từ đây,
 * nối tiếp qua `Last-Event-ID`.
 *
 * Worker Python thật ghi trực tiếp bằng SQL tương đương (đặc tả 05 mục 6:
 * không HTTP giữa TS và Python). `append()` ở đây phục vụ bộ test và một
 * worker TS-side thử nghiệm nếu có; nó không phải đường ghi duy nhất trên dữ
 * liệu thật.
 *
 * `seq` tính bằng `MAX(seq)+1` trong cùng giao dịch — an toàn vì một job chỉ
 * có đúng một worker sở hữu sau khi `claimNext`, nên không có hai người ghi
 * đồng thời vào cùng `job_id` trong vận hành bình thường. Đây là một giả
 * định, không phải khoá; ghi ở `docs/dac-ta/TECHNICAL_DEBT.md`.
 */
export class JobEventRepository {
  constructor(private readonly db: DbClient = prisma) {}

  async append(jobId: string, event: JobEventType, payload: unknown): Promise<job_events> {
    return prisma.$transaction(async (tx) => {
      const last = await tx.job_events.findFirst({
        where: { job_id: jobId },
        orderBy: { seq: "desc" },
        select: { seq: true },
      })
      const seq = (last?.seq ?? 0) + 1
      return tx.job_events.create({
        data: { job_id: jobId, seq, event, payload: payload as never },
      })
    })
  }

  /** Nối tiếp qua `Last-Event-ID` — `afterSeq` là `seq` cuối client đã thấy. */
  listSince(jobId: string, afterSeq: number): Promise<job_events[]> {
    return this.db.job_events.findMany({
      where: { job_id: jobId, seq: { gt: afterSeq } },
      orderBy: { seq: "asc" },
    })
  }
}
