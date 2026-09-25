import { randomUUID } from "node:crypto"

import { afterAll, beforeEach, describe, expect, it } from "vitest"

import type { Prisma } from "@/generated/prisma/client"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { enqueueJob } from "@/modules/jobs/use-cases/enqueue-job"
import { MEDIA_VARIANT_CLOUD_FEATURE } from "@/modules/media/domain/variant-rules"
import { getOptimization } from "@/modules/media/use-cases/get-optimization"
import { getVariantJob } from "@/modules/media/use-cases/get-variant-job"
import { requestOptimization } from "@/modules/media/use-cases/request-optimization"
import { refundJob } from "@/modules/usage/use-cases/refund-job"
import { refundPartial } from "@/modules/usage/use-cases/refund-partial"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { createTenant, type Tenant } from "../helpers/fixtures"

/**
 * Hoàn MỘT PHẦN credit và job thu gộp (25/09/2026) — nợ #127 và #146.
 * Chạy trên workspace PRODUCTION để đi đường CREDIT (workspace mặc định của
 * `sign-up` là EXPERIENCE → đường dùng thử, không có credit nào để hoàn).
 */
describe("hoàn một phần credit + job thu gộp", () => {
  let a: Tenant
  let b: Tenant

  beforeEach(async () => {
    await resetDatabase()
    a = await createTenant("alpha")
    b = await createTenant("beta")
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  async function production(tenant: Tenant, credit = 10) {
    const workspace = await prisma.workspaces.create({
      data: { organization_id: tenant.organizationId, name: "Sản xuất", kind: "PRODUCTION" },
    })
    await prisma.organizations.update({ where: { id: tenant.organizationId }, data: { credit_balance: credit } })
    return { ...tenant.ctx, workspaceId: workspace.id }
  }

  const balance = async (t: Tenant) =>
    (await prisma.organizations.findUnique({ where: { id: t.organizationId } }))!.credit_balance

  async function cloudVariantJob(ctx: Awaited<ReturnType<typeof production>>, output: Record<string, unknown>, status = "COMPLETED") {
    const enq = await enqueueJob(ctx, {
      feature: MEDIA_VARIANT_CLOUD_FEATURE,
      payload: { master_asset_id: null, preset: "studio_white", ratio: "4:5" },
      idempotencyKey: randomUUID(),
    })
    await prisma.generation_jobs.update({
      where: { id: enq.job.id },
      data: { status: status as "COMPLETED" | "FAILED", result: status === "COMPLETED" ? "SAFE" : null, output: output as Prisma.InputJsonValue, completed_at: new Date() },
    })
    return enq.job.id
  }

  it("biến thể cloud lùi cục bộ: đọc kết quả hoàn phần chênh 1 credit, đúng một lần (nợ #127)", async () => {
    const ctx = await production(a)
    const jobId = await cloudVariantJob(ctx, { cloud_fallback: true, cloud_fallback_reason: "Stability 402" })
    expect(await balance(a)).toBe(8)

    await getVariantJob(ctx, jobId)
    await getVariantJob(ctx, jobId)
    await Promise.all([getVariantJob(ctx, jobId), getVariantJob(ctx, jobId)])

    expect(await balance(a)).toBe(9)
    const rows = await prisma.usage.findMany({ where: { job_id: jobId, status: "PARTIAL_REFUND" } })
    expect(rows).toHaveLength(1)
    expect(rows[0]!.cost_credit).toBe(-1)
  })

  it("biến thể cloud chạy đúng nhà cung cấp thì không hoàn gì", async () => {
    const ctx = await production(a)
    const jobId = await cloudVariantJob(ctx, { cloud_fallback: false })
    await getVariantJob(ctx, jobId)
    expect(await balance(a)).toBe(8)
  })

  it("biến thể hỏng: đọc kết quả hoàn toàn phần ngay, không chờ cron", async () => {
    const ctx = await production(a)
    const jobId = await cloudVariantJob(ctx, {}, "FAILED")
    await getVariantJob(ctx, jobId)
    expect(await balance(a)).toBe(10)
  })

  it("đã hoàn một phần rồi job thuộc diện hoàn toàn phần: chỉ hoàn phần còn lại, không hoàn quá", async () => {
    const ctx = await production(a)
    const jobId = await cloudVariantJob(ctx, {})
    expect((await refundPartial(ctx, jobId, "cloud-lui-cuc-bo", 1)).refunded).toBe(1)
    await prisma.generation_jobs.update({ where: { id: jobId }, data: { status: "FAILED", result: null } })
    const full = await refundJob(ctx, jobId)
    expect(full).toMatchObject({ refunded: true, creditHoanLai: 1 })
    expect(await balance(a)).toBe(10)
  })

  it("tổ chức khác không hoàn được job của mình", async () => {
    const ctx = await production(a)
    const jobId = await cloudVariantJob(ctx, { cloud_fallback: true })
    const ctxB = await production(b)
    expect((await refundPartial(ctxB, jobId, "cloud-lui-cuc-bo", 1)).refunded).toBe(0)
    expect(await balance(a)).toBe(8)
    expect(await balance(b)).toBe(10)
  })

  describe("tối ưu ảnh qua nhà cung cấp (bảng giá v1)", () => {
    async function optimize(ctx: Awaited<ReturnType<typeof production>>, provider: string) {
      const asset = await prisma.assets.create({
        data: {
          id: randomUUID(), organization_id: ctx.organizationId, kind: "ORIGINAL", state: "READY", version: 1,
          storage_key: `org/${ctx.organizationId}/unfiled/${randomUUID()}.jpg`, mime_type: "image/jpeg", created_by: ctx.userId,
        },
      })
      return requestOptimization(ctx, {
        assetId: asset.id,
        config: { engine: "cloud_provider", enhancer_provider: provider },
        idempotencyKey: randomUUID(),
      })
    }

    it("Photoroom thu 3 credit, Studio cục bộ thu 2", async () => {
      const ctx = await production(a)
      expect((await optimize(ctx, "photoroom")).usage.costCredit).toBe(3)
      expect((await optimize(ctx, "studio")).usage.costCredit).toBe(2)
      expect(await balance(a)).toBe(5)
    })

    it("nhà cung cấp lỗi, worker lùi cục bộ: đọc kết quả hoàn chênh 1 credit, một lần", async () => {
      const ctx = await production(a)
      const r = await optimize(ctx, "fal_flux")
      await prisma.generation_jobs.update({
        where: { id: r.job.id },
        data: { status: "COMPLETED", result: "SAFE", completed_at: new Date(), output: { provider_fallback: true, provider_fallback_reason: "Thiếu FAL_KEY" } },
      })
      await getOptimization(ctx, r.job.id)
      await getOptimization(ctx, r.job.id)
      expect(await balance(a)).toBe(8)
    })

    it("Identity Guard từ chối: đọc kết quả hoàn đủ 3 credit", async () => {
      const ctx = await production(a)
      const r = await optimize(ctx, "photoroom")
      await prisma.generation_jobs.update({
        where: { id: r.job.id },
        data: { status: "COMPLETED", result: "REJECTED", completed_at: new Date() },
      })
      await getOptimization(ctx, r.job.id)
      expect(await balance(a)).toBe(10)
    })
  })

  describe("job thu gộp (`includedInJobId`, nợ #146)", () => {
    it("không trừ credit, không tiêu lượt dùng thử, dòng usage trỏ về job cha", async () => {
      const ctx = await production(a)
      const cha = await enqueueJob(ctx, { feature: "creative.scene_plan", costCredit: 3, payload: {}, idempotencyKey: randomUUID() })
      expect(await balance(a)).toBe(7)
      const con = await enqueueJob(ctx, {
        feature: "content.generate",
        payload: {},
        idempotencyKey: randomUUID(),
        includedInJobId: cha.job.id,
      })
      expect(con.usage.costCredit).toBe(0)
      expect(await balance(a)).toBe(7)
      const row = await prisma.usage.findFirst({ where: { job_id: con.job.id } })
      expect(row!.cost_credit).toBe(0)
      expect(row!.metadata).toMatchObject({ funded_by: "bundle", parent_job_id: cha.job.id })

      // Workspace dùng thử: job gộp không tiêu thêm lượt thử.
      const truoc = (await prisma.workspaces.findUnique({ where: { id: a.ctx.workspaceId } }))!.trial_count
      await enqueueJob(a.ctx, { feature: "content.generate", payload: {}, idempotencyKey: randomUUID(), includedInJobId: cha.job.id })
      expect((await prisma.workspaces.findUnique({ where: { id: a.ctx.workspaceId } }))!.trial_count).toBe(truoc)
    })

    it("job cha của tổ chức khác bị từ chối — không có đường chạy miễn phí", async () => {
      const ctxA = await production(a)
      const chaA = await enqueueJob(ctxA, { feature: "creative.scene_plan", payload: {}, idempotencyKey: randomUUID() })
      await expect(
        enqueueJob(b.ctx, { feature: "content.generate", payload: {}, idempotencyKey: randomUUID(), includedInJobId: chaA.job.id })
      ).rejects.toThrow()
      expect(await prisma.generation_jobs.count({ where: { organization_id: b.organizationId } })).toBe(0)
    })
  })

  it("GenerationJobRepository vẫn thấy job cha thuộc đúng tổ chức", async () => {
    const ctx = await production(a)
    const cha = await enqueueJob(ctx, { feature: "creative.scene_plan", payload: {}, idempotencyKey: randomUUID() })
    expect(await new GenerationJobRepository().findById(b.ctx, cha.job.id)).toBeNull()
  })
})
