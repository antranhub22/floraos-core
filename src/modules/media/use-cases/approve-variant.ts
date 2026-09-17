import { conflict, notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { JobEventRepository } from "@/modules/jobs/infra/job-event-repository"
import { runInTransaction } from "@/modules/jobs/infra/transaction"
import { canApproveVariant, parseVariantIntegrityBlock } from "@/modules/media/domain/variant-rules"

import { getVariantJob, type VariantJobDetail } from "./get-variant-job"

/**
 * `POST /media/variants/:id/approve` (`I5`) — cổng duyệt của M04b.
 *
 * Cùng khuôn `approveOptimization` của M04a, khác đúng một điều: một lượt
 * M04b sinh NHIỀU biến thể, nên người duyệt chỉ ra CHÍNH tấm mình chọn bằng
 * `assetId`. Duyệt gộp cả lượt sẽ biến cổng này thành một cái nút vô nghĩa —
 * người bán thường chỉ đem đăng một trong ba tấm.
 *
 * Hai việc trong MỘT giao dịch:
 *
 *     đặt approval_state = APPROVED  →  audit_logs
 *
 * Cổng Subject Integrity `REJECTED` trả **409, không phải 403** (cùng lý do
 * `YC-R5` của M04a): người gọi có năng lực, bản ghi không ở trạng thái duyệt
 * được.
 */
export async function approveVariant(
  ctx: TenantContext,
  jobId: string,
  assetId: string
): Promise<VariantJobDetail> {
  const job = await new GenerationJobRepository().findById(ctx, jobId)
  if (!job) throw notFound()

  if (job.status !== "COMPLETED") {
    throw conflict("Job chưa chạy xong, chưa có gì để duyệt")
  }

  const suKien = await new JobEventRepository().findLatestByType(jobId, "variant_integrity")
  const integrity = parseVariantIntegrityBlock(suKien?.payload)
  if (!integrity) {
    throw conflict("Job không có số đo của cổng Subject Integrity")
  }
  if (!canApproveVariant(integrity.result)) {
    throw conflict(
      "Cổng Subject Integrity đã từ chối lượt này — có bước đã vẽ đè lên sản phẩm"
    )
  }

  const assetRepo = new AssetRepository()

  // Asset phải thuộc ĐÚNG job này, không chỉ thuộc đúng tổ chức: nếu chỉ kiểm
  // tổ chức thì một `asset_id` bất kỳ của cùng tiệm cũng duyệt được qua
  // endpoint này, tức là đi vòng qua chính cổng Subject Integrity ở trên.
  const thuocJob = await assetRepo.listByJobId(ctx, jobId, "MARKETING")
  const target = thuocJob.find((a) => a.id === assetId)
  if (!target) throw notFound()

  if (target.approval_state === "APPROVED") {
    throw conflict("Biến thể này đã được duyệt")
  }

  await runInTransaction(async (tx) => {
    const approved = await new AssetRepository(tx).approve(ctx, target.id, {
      approvedBy: ctx.userId,
      approvedAt: new Date(),
    })
    // `null` nghĩa là ai đó vừa duyệt xong giữa lúc đọc và lúc ghi — điều
    // kiện `approval_state: PENDING` nằm ngay trong `where` nên chỉ một
    // người thắng.
    if (!approved) throw conflict("Bản ghi vừa đổi trạng thái, thử lại")

    await recordAuditLog(
      ctx,
      {
        action: "media.variant.approve",
        entityType: "assets",
        entityId: target.id,
        before: { approval_state: target.approval_state },
        after: {
          approval_state: "APPROVED",
          job_id: jobId,
          subject_pixel_identity: integrity.subject_pixel_identity,
          integrity_result: integrity.result,
        },
      },
      tx
    )
  })

  return getVariantJob(ctx, jobId)
}
