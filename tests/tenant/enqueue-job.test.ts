import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { AppError } from "@/core/http/errors"
import { enqueueJob } from "@/modules/jobs/use-cases/enqueue-job"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { UsageRepository } from "@/modules/usage/infra/usage-repository"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { createTenant, type Tenant } from "../helpers/fixtures"

/**
 * `enqueueJob` — bốn việc trong một giao dịch (đặc tả 05 mục 6, `YC-U3`
 * `YC-U7`). Tổ chức mới có `credit_balance = 0` (giá trị mặc định của lược
 * đồ), nên phần lớn trường hợp thử ở đây tự nạp credit trước bằng
 * `prisma.organizations.update` — đi thẳng vào Postgres là hợp lệ trong
 * `tests/`, luật "không import client ngoài infra/" chỉ quét `src/`.
 */
describe("enqueueJob", () => {
  let a: Tenant

  beforeEach(async () => {
    await resetDatabase()
    a = await createTenant("alpha")
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it("hạn mức chặn TRƯỚC khi job vào bảng — tổ chức mới không có credit (YC-U3)", async () => {
    await expect(
      enqueueJob(a.ctx, {
        feature: "vision.analyze",
        payload: { asset_ids: [] },
        idempotencyKey: "no-credit-1",
      })
    ).rejects.toMatchObject({ code: "QUOTA_EXCEEDED" })

    const jobs = await new GenerationJobRepository().list(a.ctx, { limit: 10 })
    expect(jobs).toEqual([])
  })

  it("đủ credit — tạo job, ghi usage ENQUEUED, trừ đúng credit_balance", async () => {
    await prisma.organizations.update({
      where: { id: a.organizationId },
      data: { credit_balance: 10 },
    })

    const result = await enqueueJob(a.ctx, {
      feature: "vision.analyze",
      payload: { asset_ids: ["x"] },
      idempotencyKey: "co-credit-1",
    })

    expect(result.deduped).toBe(false)
    expect(result.job.status).toBe("PENDING")
    expect(result.job.feature).toBe("vision.analyze")
    expect(result.usage.costCredit).toBe(1)
    expect(result.usage.balanceAfter).toBe(9)

    const organization = await prisma.organizations.findUnique({ where: { id: a.organizationId } })
    expect(organization?.credit_balance).toBe(9)

    const usageRows = await new UsageRepository().list(a.ctx, { limit: 10 })
    expect(usageRows).toHaveLength(1)
    expect(usageRows[0]?.status).toBe("ENQUEUED")
    expect(usageRows[0]?.job_id).toBe(result.job.id)
  })

  it("cùng Idempotency-Key trong 24 giờ trả lại job cũ, không trừ credit lần hai (YC-U7)", async () => {
    await prisma.organizations.update({
      where: { id: a.organizationId },
      data: { credit_balance: 10 },
    })

    const first = await enqueueJob(a.ctx, {
      feature: "vision.analyze",
      payload: { asset_ids: ["x"] },
      idempotencyKey: "dup-key-1",
    })
    const second = await enqueueJob(a.ctx, {
      feature: "vision.analyze",
      payload: { asset_ids: ["x", "y"] }, // payload khác — vẫn dedupe theo khoá, không theo nội dung
      idempotencyKey: "dup-key-1",
    })

    expect(second.deduped).toBe(true)
    expect(second.job.id).toBe(first.job.id)

    const organization = await prisma.organizations.findUnique({ where: { id: a.organizationId } })
    expect(organization?.credit_balance).toBe(9) // trừ đúng một lần

    const usageRows = await new UsageRepository().list(a.ctx, { limit: 10 })
    expect(usageRows).toHaveLength(1)
  })

  it("thiếu Idempotency-Key bị từ chối trước khi chạm hạn mức", async () => {
    await expect(
      enqueueJob(a.ctx, { feature: "vision.analyze", payload: {}, idempotencyKey: "" })
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" })
  })

  it("workspace EXPERIENCE dùng hạn mức trial, không đụng credit_balance", async () => {
    const experienceWorkspace = await prisma.workspaces.create({
      data: {
        organization_id: a.organizationId,
        name: "Trải nghiệm",
        kind: "EXPERIENCE",
        trial_limit: 1,
        trial_status: "ACTIVE",
      },
    })
    const experienceCtx = { ...a.ctx, workspaceId: experienceWorkspace.id }

    const result = await enqueueJob(experienceCtx, {
      feature: "vision.analyze",
      payload: {},
      idempotencyKey: "trial-1",
    })
    expect(result.usage.costCredit).toBe(0)
    expect(result.usage.balanceAfter).toBeNull()

    const organization = await prisma.organizations.findUnique({ where: { id: a.organizationId } })
    expect(organization?.credit_balance).toBe(0) // không đổi — tổ chức chưa nạp credit

    await expect(
      enqueueJob(experienceCtx, { feature: "vision.analyze", payload: {}, idempotencyKey: "trial-2" })
    ).rejects.toMatchObject({ code: "QUOTA_EXCEEDED" })
  })

  it("ném AppError thật, không phải lỗi chung — route dịch được sang 422", async () => {
    try {
      await enqueueJob(a.ctx, {
        feature: "vision.analyze",
        payload: {},
        idempotencyKey: "no-credit-appcheck",
      })
      throw new Error("Đáng lẽ phải ném QUOTA_EXCEEDED")
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).status).toBe(422)
    }
  })
})
