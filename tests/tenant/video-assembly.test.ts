import { randomUUID } from "node:crypto"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { POST as assemble } from "@/app/api/v1/creative-production/video-assembly/route"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { buildRuleScenePlan } from "@/modules/creative-production/domain/scene-plan-rules"

import { disconnectDatabase, resetDatabase } from "../helpers/database"
import { createTenant, readJson, withSession, type Tenant } from "../helpers/fixtures"

// Đợt 4 (24/09/2026): dựng video từ bộ tài sản — chỉ dùng Master/ảnh/âm thanh của ĐÚNG tổ chức.

const URL = "http://localhost/api/v1/creative-production/video-assembly"
const plan = buildRuleScenePlan({ mode: "AUTHENTIC", productName: "Bó hoa", colors: [], components: [], occasions: [], topic: { id: "t1", title: "Sinh nhật" } })

async function seedMaster(ctx: TenantContext): Promise<string> {
  const id = randomUUID()
  await new AssetRepository().create(ctx, {
    id,
    productId: null,
    parentAssetId: null,
    kind: "MASTER",
    version: 1,
    storageKey: `org/${ctx.organizationId}/unfiled/${id}.png`,
    mimeType: "image/png",
    createdBy: ctx.userId,
  })
  return id
}

describe("cách ly tenant — dựng video từ bộ tài sản", () => {
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

  const post = (t: Tenant, body: Record<string, unknown>) =>
    assemble(withSession(URL, t.token, { method: "POST", body: JSON.stringify(body) }))

  it("không dùng được Master của tổ chức khác", async () => {
    const masterA = await seedMaster(a.ctx)
    const res = await post(b, { scene_plan_id: "rule:t1:AUTHENTIC", plan, master_asset_id: masterA, dry_run: true })
    expect(res.status).toBe(400)
  })

  it("thiếu ảnh D và âm thanh C → chặn, không tạo video job", async () => {
    const masterA = await seedMaster(a.ctx)
    const res = await post(a, { scene_plan_id: "rule:t1:AUTHENTIC", plan, master_asset_id: masterA })
    expect(res.status).toBe(200)
    const body = (await readJson(res)) as { ready: boolean; video_job_id: string | null; problems: Array<{ kind: string }> }
    expect(body.ready).toBe(false)
    expect(body.video_job_id).toBeNull()
    expect(body.problems.map((p) => p.kind)).toEqual(expect.arrayContaining(["missing_audio", "missing_image"]))
  })
})
