import { randomUUID } from "node:crypto"

import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { GET as getOptimizationRoute } from "@/app/api/v1/media/optimizations/[id]/route"
import { POST as approveRoute } from "@/app/api/v1/media/optimizations/[id]/approve/route"
import { GET as downloadRoute } from "@/app/api/v1/media/optimizations/[id]/download/route"
import { POST as createOptimizationRoute } from "@/app/api/v1/media/optimizations/route"
import { GET as integrationMasterImageRoute } from "@/app/api/v1/integration/products/[id]/master-image/route"
import { POST as issueTokenRoute } from "@/app/api/v1/integration-tokens/route"
import { POST as createProductRoute } from "@/app/api/v1/products/route"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { JobEventRepository } from "@/modules/jobs/infra/job-event-repository"
import { MEDIA_OPTIMIZE_FEATURE } from "@/modules/media/use-cases/request-optimization"
import { refundRejectedJob } from "@/modules/media/use-cases/refund-rejected-job"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { createTenant, readJson, withBearer, withSession, type Tenant } from "../helpers/fixtures"

const BASE = "http://localhost/api/v1"

/**
 * Cách ly tenant và hai cổng của M04a — P9.
 *
 * Worker Python là nơi chạy Identity Guard thật; ở đây ta CHÈN kết quả của
 * nó (job `COMPLETED` + sự kiện `guard` + asset `MASTER`) rồi kiểm phía TS
 * xử lý đúng — đúng cách `vision-analyses.test.ts` mô phỏng dòng
 * `product_analyses` do worker M01 ghi (D6-1: không có đường TS nào tạo
 * những dòng đó trong luồng thật).
 */
describe("cách ly tenant — M04a tối ưu ảnh và hai cổng (P9)", () => {
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

  async function seedAsset(ctx: TenantContext, productId: string | null): Promise<string> {
    const asset = await new AssetRepository().create(ctx, {
      id: randomUUID(),
      productId,
      parentAssetId: null,
      kind: "ORIGINAL",
      version: 1,
      storageKey: `org/${ctx.organizationId}/${productId ?? "unfiled"}/${randomUUID()}.jpg`,
      mimeType: "image/jpeg",
      createdBy: ctx.userId,
    })
    return asset.id
  }

  function khoiGuard(result: string, overrides: Record<string, unknown> = {}) {
    const diem = result === "REJECTED" ? 0.75 : result === "WARNING" ? 0.93 : 1
    return {
      identity_score: diem, color_score: diem, geometry_score: diem,
      component_consistency: diem, result,
      ly_do: result === "SAFE" ? [] : ["Số lượng cẩm chướng đổi: 30 → 20"],
      provider: "gia", model_version: "v1",
      ...overrides,
    }
  }

  /** Mô phỏng đúng những gì worker M04a ghi khi job chạy xong. */
  async function seedJobDaChay(
    tenant: Tenant,
    result: string,
    options: { taoMaster?: boolean; productId?: string | null } = {}
  ): Promise<{ jobId: string; masterAssetId: string | null; assetGocId: string }> {
    const productId = options.productId ?? null
    const assetGocId = await seedAsset(tenant.ctx, productId)
    const jobRepo = new GenerationJobRepository()
    const job = await jobRepo.create(tenant.ctx, {
      workspaceId: tenant.ctx.workspaceId,
      branchId: null,
      userId: tenant.userId,
      productId,
      feature: MEDIA_OPTIMIZE_FEATURE,
      payload: { asset_id: assetGocId },
      idempotencyKey: randomUUID(),
    })
    await prisma.generation_jobs.update({
      where: { id: job.id },
      data: { status: "COMPLETED", result, completed_at: new Date() },
    })
    await new JobEventRepository().append(job.id, "guard", khoiGuard(result))

    let masterAssetId: string | null = null
    // Worker KHÔNG ghi asset khi bị từ chối — mô phỏng đúng vậy.
    const taoMaster = options.taoMaster ?? result !== "REJECTED"
    if (taoMaster) {
      const master = await new AssetRepository().create(tenant.ctx, {
        id: randomUUID(),
        productId,
        parentAssetId: assetGocId,
        kind: "MASTER",
        version: 2,
        storageKey: `org/${tenant.organizationId}/${productId ?? "unfiled"}/${randomUUID()}.jpg`,
        mimeType: "image/jpeg",
        generatedFlags: { generative_fill_used: false, requires_reshoot_warning: false },
        metadata: { job_id: job.id, identity_guard: khoiGuard(result) },
        createdBy: tenant.userId,
      })
      masterAssetId = master.id
    }
    return { jobId: job.id, masterAssetId, assetGocId }
  }

  const params = (id: string) => ({ params: Promise.resolve({ id }) })

  describe("tạo job", () => {
    it("POST /media/optimizations từ chối asset của tổ chức khác TRƯỚC khi trừ credit", async () => {
      const cuaB = await seedAsset(b.ctx, null)
      const truoc = await prisma.organizations.findUnique({ where: { id: a.organizationId } })

      const response = await createOptimizationRoute(
        withSession(`${BASE}/media/optimizations`, a.token, {
          method: "POST",
          headers: { "idempotency-key": randomUUID() },
          body: JSON.stringify({ asset_id: cuaB }),
        })
      )

      expect(response.status).toBe(404)
      const sau = await prisma.organizations.findUnique({ where: { id: a.organizationId } })
      expect(sau?.credit_balance).toBe(truoc?.credit_balance)
      expect(await prisma.generation_jobs.count({ where: { organization_id: a.organizationId } })).toBe(0)
    })

    it("thiếu Idempotency-Key bị từ chối (YC-U7)", async () => {
      const assetId = await seedAsset(a.ctx, null)
      const response = await createOptimizationRoute(
        withSession(`${BASE}/media/optimizations`, a.token, {
          method: "POST",
          body: JSON.stringify({ asset_id: assetId }),
        })
      )
      expect(response.status).toBe(400)
    })
  })

  describe("đọc kết quả", () => {
    it("GET trả khối bốn điểm đọc từ sự kiện guard, kèm cờ cho giao diện", async () => {
      const { jobId } = await seedJobDaChay(a, "WARNING")
      const body = await readJson(
        await getOptimizationRoute(withSession(`${BASE}/media/optimizations/${jobId}`, a.token), params(jobId))
      )

      const guard = body.identity_guard as Record<string, unknown>
      expect(guard.result).toBe("WARNING")
      expect(guard.identity_score).toBe(0.93)
      const approval = body.approval as Record<string, unknown>
      expect(approval.can_approve).toBe(true)
      expect(approval.requires_warning).toBe(true) // YC-R6
      expect(approval.state).toBe("pending")
    })

    it("job của tổ chức khác trả 404, không phải 403 (YC-T4)", async () => {
      const { jobId } = await seedJobDaChay(a, "SAFE")
      const response = await getOptimizationRoute(
        withSession(`${BASE}/media/optimizations/${jobId}`, b.token), params(jobId)
      )
      expect(response.status).toBe(404)
    })

    it("bị từ chối thì không có Master Image và không duyệt được", async () => {
      const { jobId } = await seedJobDaChay(a, "REJECTED")
      const body = await readJson(
        await getOptimizationRoute(withSession(`${BASE}/media/optimizations/${jobId}`, a.token), params(jobId))
      )
      expect((body.outputs as Record<string, unknown>).master).toBeNull()
      expect((body.approval as Record<string, unknown>).can_approve).toBe(false)
    })
  })

  describe("cổng 2 — Review & Approve", () => {
    it("REJECTED trả 409, KHÔNG phải 403 (YC-R5)", async () => {
      const { jobId } = await seedJobDaChay(a, "REJECTED")
      const response = await approveRoute(
        withSession(`${BASE}/media/optimizations/${jobId}/approve`, a.token, { method: "POST" }),
        params(jobId)
      )
      // Người gọi CÓ quyền I2; bản ghi mới là thứ không duyệt được.
      expect(response.status).toBe(409)
    })

    it("WARNING duyệt được (YC-R6) và ghi audit log trong cùng giao dịch", async () => {
      const { jobId, masterAssetId } = await seedJobDaChay(a, "WARNING")
      const response = await approveRoute(
        withSession(`${BASE}/media/optimizations/${jobId}/approve`, a.token, { method: "POST" }),
        params(jobId)
      )
      expect(response.status).toBe(200)

      const asset = await prisma.assets.findUnique({ where: { id: masterAssetId! } })
      expect(asset?.approval_state).toBe("APPROVED")
      expect(asset?.approved_by).toBe(a.userId)
      expect(asset?.approved_at).not.toBeNull()

      const log = await prisma.audit_logs.findFirst({
        where: { organization_id: a.organizationId, action: "media.approve" },
      })
      expect(log?.entity_id).toBe(masterAssetId)
    })

    it("duyệt hai lần thì lần sau trả 409, không ghi đè người duyệt trước", async () => {
      const { jobId, masterAssetId } = await seedJobDaChay(a, "SAFE")
      await approveRoute(
        withSession(`${BASE}/media/optimizations/${jobId}/approve`, a.token, { method: "POST" }),
        params(jobId)
      )
      const truoc = await prisma.assets.findUnique({ where: { id: masterAssetId! } })

      const lai = await approveRoute(
        withSession(`${BASE}/media/optimizations/${jobId}/approve`, a.token, { method: "POST" }),
        params(jobId)
      )
      expect(lai.status).toBe(409)
      const sau = await prisma.assets.findUnique({ where: { id: masterAssetId! } })
      expect(sau?.approved_at?.getTime()).toBe(truoc?.approved_at?.getTime())
      expect(await prisma.audit_logs.count({
        where: { organization_id: a.organizationId, action: "media.approve" },
      })).toBe(1)
    })

    it("job chưa chạy xong thì chưa có gì để duyệt", async () => {
      const assetId = await seedAsset(a.ctx, null)
      const job = await new GenerationJobRepository().create(a.ctx, {
        workspaceId: a.ctx.workspaceId, branchId: null, userId: a.userId, productId: null,
        feature: MEDIA_OPTIMIZE_FEATURE, payload: { asset_id: assetId },
        idempotencyKey: randomUUID(),
      })
      const response = await approveRoute(
        withSession(`${BASE}/media/optimizations/${job.id}/approve`, a.token, { method: "POST" }),
        params(job.id)
      )
      expect(response.status).toBe(409)
    })
  })

  describe("tải về — không phải phê duyệt", () => {
    it("tải được ảnh đã qua cổng mà KHÔNG làm nó thành ảnh chính thức", async () => {
      const { jobId, masterAssetId } = await seedJobDaChay(a, "GOOD")
      const body = await readJson(
        await downloadRoute(withSession(`${BASE}/media/optimizations/${jobId}/download`, a.token), params(jobId))
      )
      expect(body.asset_id).toBe(masterAssetId)
      expect(typeof body.url).toBe("string")

      // M04 mục 5.1 — tải về không phải phê duyệt.
      const asset = await prisma.assets.findUnique({ where: { id: masterAssetId! } })
      expect(asset?.approval_state).toBe("PENDING")
    })

    it("ảnh bị từ chối không tải được", async () => {
      const { jobId } = await seedJobDaChay(a, "REJECTED")
      const response = await downloadRoute(
        withSession(`${BASE}/media/optimizations/${jobId}/download`, a.token), params(jobId)
      )
      expect(response.status).toBe(409)
    })
  })

  describe("nợ #30 — master-image hết 404 sau khi duyệt", () => {
    it("engine ngoài chỉ thấy ảnh SAU khi cổng 2 duyệt", async () => {
      const san_pham = await readJson(
        await createProductRoute(
          withSession(`${BASE}/products`, a.token, {
            method: "POST",
            body: JSON.stringify({ code: "BHSK0001", name: "Bó hoa", status: "ACTIVE" }),
          })
        )
      )
      const productId = san_pham.id as string
      const { jobId } = await seedJobDaChay(a, "SAFE", { productId })

      const token = await readJson(
        await issueTokenRoute(
          withSession(`${BASE}/integration-tokens`, a.token, {
            method: "POST",
            body: JSON.stringify({ client: "LOCALBUDD" }),
          })
        )
      )
      const goi = () =>
        integrationMasterImageRoute(
          withBearer(`${BASE}/integration/products/${productId}/master-image`, token.token as string),
          params(productId)
        )

      // Trước khi duyệt: đúng 404 — ảnh chờ duyệt không rò ra ngoài core.
      expect((await goi()).status).toBe(404)

      await approveRoute(
        withSession(`${BASE}/media/optimizations/${jobId}/approve`, a.token, { method: "POST" }),
        params(jobId)
      )

      // Sau khi duyệt: nợ #30 đã trả.
      expect((await goi()).status).toBe(200)
    })
  })

  describe("D3 — hoàn credit khi Guard từ chối", () => {
    it("hoàn đúng số credit đã trừ, ghi dòng REFUNDED, và idempotent", async () => {
      // Workspace mặc định của `signUp` là EXPERIENCE (đường TRIAL, không trừ
      // credit) — phải chuyển sang PRODUCTION mới kiểm được đường CREDIT,
      // cùng cái bẫy đã gặp bốn lần ở P3/P5.
      await prisma.workspaces.update({
        where: { id: a.ctx.workspaceId }, data: { kind: "PRODUCTION" },
      })
      const assetId = await seedAsset(a.ctx, null)
      await createOptimizationRoute(
        withSession(`${BASE}/media/optimizations`, a.token, {
          method: "POST",
          headers: { "idempotency-key": randomUUID() },
          body: JSON.stringify({ asset_id: assetId }),
        })
      )
      const job = await prisma.generation_jobs.findFirst({
        where: { organization_id: a.organizationId, feature: MEDIA_OPTIMIZE_FEATURE },
      })
      const sauKhiTru = await prisma.organizations.findUnique({ where: { id: a.organizationId } })

      await prisma.generation_jobs.update({
        where: { id: job!.id },
        data: { status: "COMPLETED", result: "REJECTED", completed_at: new Date() },
      })

      const lanMot = await refundRejectedJob(a.ctx, job!.id)
      expect(lanMot.refunded).toBe(true)

      const sauKhiHoan = await prisma.organizations.findUnique({ where: { id: a.organizationId } })
      expect(sauKhiHoan!.credit_balance).toBeGreaterThan(sauKhiTru!.credit_balance)
      expect(await prisma.usage.count({
        where: { organization_id: a.organizationId, job_id: job!.id, status: "REFUNDED" },
      })).toBe(1)

      // Chạy lại không hoàn lần hai.
      const lanHai = await refundRejectedJob(a.ctx, job!.id)
      expect(lanHai.refunded).toBe(false)
      const cuoi = await prisma.organizations.findUnique({ where: { id: a.organizationId } })
      expect(cuoi!.credit_balance).toBe(sauKhiHoan!.credit_balance)
    })

    it("job KHÔNG bị từ chối thì không hoàn gì", async () => {
      const { jobId } = await seedJobDaChay(a, "SAFE")
      const ketQua = await refundRejectedJob(a.ctx, jobId)
      expect(ketQua.refunded).toBe(false)
      expect(await prisma.usage.count({
        where: { organization_id: a.organizationId, status: "REFUNDED" },
      })).toBe(0)
    })
  })
})
