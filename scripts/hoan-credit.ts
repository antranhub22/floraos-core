import type { TenantContext } from "@/core/tenancy"
import { prisma } from "@/core/tenancy/infra/prisma"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { MEDIA_OPTIMIZE_FEATURE } from "@/modules/media/use-cases/request-optimization"
import { refundRejectedJob } from "@/modules/media/use-cases/refund-rejected-job"

// Quyết định D3 — job bị Identity Guard từ chối không tính phí khách.
// Chạy định kỳ ngoài request HTTP, ví dụ cron mỗi 5 phút (dòng crontab,
// KHÔNG đặt trong khối /** */ — "*" liền "/" đóng khối sớm):
//
//   (mỗi-5-phút) cd /path/floraos-core && npm run hoan-credit
//
// Vì sao là tiến trình quét chứ không phải worker tự hoàn: `YC-U4` — worker
// KHÔNG BAO GIỜ ghi `usage`. Hạn mức và credit là việc của core. Hệ quả:
// hoàn credit nhất quán sau một khoảng, không tức thì.
//
// An toàn chạy lại: `refundRejectedJob` idempotent theo dòng `usage`
// `REFUNDED` của chính job đó.

const SO_JOB_MOI_LUOT = 200

async function main(): Promise<void> {
  const jobs = await new GenerationJobRepository().listRejected(
    MEDIA_OPTIMIZE_FEATURE,
    SO_JOB_MOI_LUOT
  )
  if (jobs.length === 0) return

  let daHoan = 0
  let tongCredit = 0
  for (const job of jobs) {
    // Ngữ cảnh dựng từ chính dòng job, không từ tham số nào — cùng luật với
    // worker ("`organization_id` chỉ lấy từ dòng job").
    const ctx: TenantContext = {
      organizationId: job.organization_id,
      workspaceId: job.workspace_id,
      userId: job.user_id,
      branchId: job.branch_id,
      capabilities: new Set<string>(),
    }
    const ketQua = await refundRejectedJob(ctx, job.id)
    if (ketQua.refunded) {
      daHoan += 1
      tongCredit += ketQua.creditHoanLai
      console.log(`Hoàn ${ketQua.creditHoanLai} credit cho job ${job.id} (tổ chức ${job.organization_id})`)
    }
  }

  if (daHoan > 0) console.log(`Đã hoàn ${tongCredit} credit cho ${daHoan} job bị Identity Guard từ chối`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
