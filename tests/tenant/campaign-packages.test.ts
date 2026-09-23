import { randomUUID } from "node:crypto"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { GET as listPackages, POST as createPackage } from "@/app/api/v1/creative-production/packages/route"
import { GET as getPackage, PATCH as patchPackage } from "@/app/api/v1/creative-production/packages/[id]/route"
import { POST as runQa } from "@/app/api/v1/creative-production/packages/[id]/qa/route"
import { POST as approvePackage } from "@/app/api/v1/creative-production/packages/[id]/approve/route"
import { GET as getPerformance } from "@/app/api/v1/creative-production/packages/[id]/performance/route"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { createTenant, readJson, withSession, type Tenant } from "../helpers/fixtures"

// Gói chiến dịch Creative Studio (Khu vực F, Chặng 07–14) — 23/09/2026.
// Bảng TENANT mới `campaign_packages`: mọi đọc/ghi phải cách ly theo tổ chức,
// và định danh tài sản của tổ chức khác không được lọt vào gói.

const BASE = "http://localhost/api/v1/creative-production/packages"
const params = (id: string) => ({ params: Promise.resolve({ id }) })

async function seedAsset(
  ctx: TenantContext,
  kind: "MASTER" | "MARKETING",
  opts: { parentAssetId?: string | null; approved?: boolean; identity?: number | null; ratio?: string } = {}
): Promise<string> {
  const id = randomUUID()
  await new AssetRepository().create(ctx, {
    id,
    productId: null,
    parentAssetId: opts.parentAssetId ?? null,
    kind,
    version: 1,
    storageKey: `org/${ctx.organizationId}/unfiled/${id}.png`,
    mimeType: "image/png",
    createdBy: ctx.userId,
  })
  await prisma.assets.update({
    where: { id },
    data: {
      approval_state: opts.approved === false ? "PENDING" : "APPROVED",
      approved_by: opts.approved === false ? null : ctx.userId,
      approved_at: opts.approved === false ? null : new Date(),
      identity_score: opts.identity === undefined ? 1 : opts.identity,
      aspect_ratio: opts.ratio ?? "1:1",
      metadata: { watermark: true },
    },
  })
  return id
}

describe("cách ly tenant — campaign_packages (Khu vực F)", () => {
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

  async function createFor(t: Tenant, masterId: string, extra: Record<string, unknown> = {}) {
    return createPackage(
      withSession(BASE, t.token, {
        method: "POST",
        body: JSON.stringify({ name: "Gói thử", mode: "CREATIVE", master_asset_id: masterId, ...extra }),
      })
    )
  }

  it("tạo gói ghi đúng organization_id; tổ chức khác không đọc/không liệt kê được", async () => {
    const masterA = await seedAsset(a.ctx, "MASTER")
    const res = await createFor(a, masterA)
    expect(res.status).toBe(201)
    const pkg = (await readJson(res)) as { id: string; status: string }
    expect(pkg.status).toBe("DRAFT")

    const row = await prisma.campaign_packages.findUnique({ where: { id: pkg.id } })
    expect(row?.organization_id).toBe(a.ctx.organizationId)

    expect((await getPackage(withSession(`${BASE}/${pkg.id}`, b.token), params(pkg.id))).status).toBe(404)
    const listB = (await readJson(await listPackages(withSession(BASE, b.token)))) as { data: unknown[] }
    expect(listB.data).toHaveLength(0)
  })

  it("không neo được vào Master của tổ chức khác, không gắn được biến thể của tổ chức khác", async () => {
    const masterA = await seedAsset(a.ctx, "MASTER")
    const masterB = await seedAsset(b.ctx, "MASTER")
    const variantB = await seedAsset(b.ctx, "MARKETING", { parentAssetId: masterB })

    expect((await createFor(a, masterB)).status).toBe(404)
    const res = await createFor(a, masterA, { variant_asset_ids: [variantB] })
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
    expect(await prisma.campaign_packages.count()).toBe(0)
  })

  it("DRAFT không duyệt được; QA chạy trên dữ liệu thật; duyệt ghi audit_logs của đúng tổ chức", async () => {
    const masterA = await seedAsset(a.ctx, "MASTER")
    const variantA = await seedAsset(a.ctx, "MARKETING", { parentAssetId: masterA })
    await prisma.brand_profiles.upsert({
      where: { organization_id: a.ctx.organizationId },
      create: { organization_id: a.ctx.organizationId, logo_asset_id: masterA },
      update: { logo_asset_id: masterA },
    }).catch(() => undefined)

    const created = (await readJson(
      await createFor(a, masterA, {
        variant_asset_ids: [variantA],
        posts: [{ channel: "facebook", text: "Bó hoa hồng đỏ tặng sinh nhật", hashtags: ["#hoatuoi"] }],
      })
    )) as { id: string }

    const early = await approvePackage(
      withSession(`${BASE}/${created.id}/approve`, a.token, { method: "POST", body: "{}" }),
      params(created.id)
    )
    expect(early.status).toBe(409)

    const qa = (await readJson(
      await runQa(withSession(`${BASE}/${created.id}/qa`, a.token, { method: "POST" }), params(created.id))
    )) as { status: string; qa_report: { verdict: string } }
    expect(["QA_PASSED", "QA_NEEDS_REVIEW"]).toContain(qa.status)

    // Tổ chức khác không duyệt được gói của A.
    expect(
      (
        await approvePackage(
          withSession(`${BASE}/${created.id}/approve`, b.token, { method: "POST", body: "{}" }),
          params(created.id)
        )
      ).status
    ).toBe(404)

    const approved = (await readJson(
      await approvePackage(
        withSession(`${BASE}/${created.id}/approve`, a.token, {
          method: "POST",
          body: JSON.stringify({ acknowledge_warnings: true }),
        }),
        params(created.id)
      )
    )) as { status: string }
    expect(approved.status).toBe("APPROVED")

    const logs = await prisma.audit_logs.findMany({ where: { entity_id: created.id } })
    expect(logs).toHaveLength(1)
    expect(logs[0]?.organization_id).toBe(a.ctx.organizationId)
    expect(logs[0]?.action).toBe("campaign_package.approve")

    // Gói đã duyệt không sửa được.
    const patch = await patchPackage(
      withSession(`${BASE}/${created.id}`, a.token, { method: "PATCH", body: JSON.stringify({ name: "x" }) }),
      params(created.id)
    )
    expect(patch.status).toBe(409)
  })

  it("performance chỉ đọc số liệu của đúng tổ chức và báo thiếu dữ liệu trung thực", async () => {
    const masterA = await seedAsset(a.ctx, "MASTER")
    const created = (await readJson(await createFor(a, masterA))) as { id: string }
    const res = await getPerformance(withSession(`${BASE}/${created.id}/performance`, a.token), params(created.id))
    expect(res.status).toBe(200)
    const body = (await readJson(res)) as { learn: { status: string }; measure: { orders: { count: number } } }
    expect(body.learn.status).toBe("INSUFFICIENT_DATA")
    expect(body.measure.orders.count).toBe(0)
    expect(
      (await getPerformance(withSession(`${BASE}/${created.id}/performance`, b.token), params(created.id))).status
    ).toBe(404)
  })
})
