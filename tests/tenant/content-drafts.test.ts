import { randomUUID } from "node:crypto"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { GET as getDraft, PUT as putDraft } from "@/app/api/v1/creative-production/content-drafts/route"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { createTenant, readJson, withSession, type Tenant } from "../helpers/fixtures"

// Bài Khu vực B tự lưu (24/09/2026) — bảng TENANT `content_drafts`.

const BASE = "http://localhost/api/v1/creative-production/content-drafts"

async function seedAsset(ctx: TenantContext): Promise<string> {
  const id = randomUUID()
  await new AssetRepository().create(ctx, {
    id,
    productId: null,
    parentAssetId: null,
    kind: "ORIGINAL",
    version: 1,
    storageKey: `org/${ctx.organizationId}/unfiled/${id}.png`,
    mimeType: "image/png",
    createdBy: ctx.userId,
  })
  return id
}

const POSTS = [{ channel: "facebook", text: "Bài Facebook", hashtags: ["#hoa"] }]

describe("cách ly tenant — content_drafts (bài Khu vực B tự lưu)", () => {
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

  const put = (t: Tenant, body: Record<string, unknown>) =>
    putDraft(withSession(BASE, t.token, { method: "PUT", body: JSON.stringify(body) }))
  const get = (t: Tenant, assetId: string) =>
    getDraft(withSession(`${BASE}?asset_id=${assetId}&topic_id=top-01&mode=CREATIVE`, t.token))

  it("lưu, ghi đè cùng khoá, và tổ chức khác không đọc được", async () => {
    const assetId = await seedAsset(a.ctx)
    const key = { asset_id: assetId, topic_id: "top-01", mode: "CREATIVE" }
    expect((await put(a, { ...key, posts: POSTS })).status).toBe(200)
    expect((await put(a, { ...key, posts: [{ ...POSTS[0], text: "Bài đã sửa" }] })).status).toBe(200)

    const mine = (await readJson(await get(a, assetId))) as { draft: { posts: Array<{ text: string }> } | null }
    expect(mine.draft?.posts[0]?.text).toBe("Bài đã sửa")
    expect(await prisma.content_drafts.count({ where: { organization_id: a.ctx.organizationId } })).toBe(1)

    const theirs = (await readJson(await get(b, assetId))) as { draft: unknown }
    expect(theirs.draft).toBeNull()
  })

  it("không nhận ảnh của tổ chức khác làm khoá", async () => {
    const assetOfA = await seedAsset(a.ctx)
    const res = await put(b, { asset_id: assetOfA, topic_id: "top-01", mode: "CREATIVE", posts: POSTS })
    expect(res.status).toBe(404)
    expect(await prisma.content_drafts.count()).toBe(0)
  })
})
