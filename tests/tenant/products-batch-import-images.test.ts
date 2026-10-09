import { randomUUID } from "node:crypto"

import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { POST as batchImportRoute } from "@/app/api/v1/products/batch-import/route"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { createTenant, readJson, withSession, type Tenant } from "../helpers/fixtures"

const URL_BATCH = "http://localhost/api/v1/products/batch-import"

async function seedAsset(ctx: TenantContext): Promise<string> {
  const asset = await new AssetRepository().create(ctx, {
    id: randomUUID(),
    productId: null,
    parentAssetId: null,
    kind: "ORIGINAL",
    version: 1,
    storageKey: `org/${ctx.organizationId}/khong-san-pham/${randomUUID()}.jpg`,
    mimeType: "image/jpeg",
    createdBy: ctx.userId,
  })
  return asset.id
}

function importItems(t: Tenant, items: Array<{ code: string; image_asset_id: string | null }>) {
  return batchImportRoute(
    withSession(URL_BATCH, t.token, {
      method: "POST",
      body: JSON.stringify({ items: items.map((i) => ({ ...i, name: `Mẫu ${i.code}` })), skip_duplicates: true }),
    }),
  )
}

async function mainImages(t: Tenant, code: string) {
  const product = await prisma.products.findFirstOrThrow({ where: { organization_id: t.organizationId, code } })
  return prisma.product_images.findMany({ where: { product_id: product.id, role: "MAIN" } })
}

describe("batch-import — bù ảnh cho mã đã có", () => {
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

  it("nhập lại kèm ảnh → gắn ảnh cho sản phẩm cũ chưa có ảnh", async () => {
    await importItems(a, [{ code: "BST-Basic-BO-001", image_asset_id: null }])
    const assetId = await seedAsset(a.ctx)

    const res = await importItems(a, [{ code: "BST-Basic-BO-001", image_asset_id: assetId }])
    const body = await readJson(res)
    expect(body.skipped_count).toBe(1)
    expect(body.images_attached_count).toBe(1)
    expect((await mainImages(a, "BST-Basic-BO-001")).map((i) => i.asset_id)).toEqual([assetId])
  })

  it("không thay ảnh chính sẵn có", async () => {
    const first = await seedAsset(a.ctx)
    await importItems(a, [{ code: "SP-1", image_asset_id: first }])
    const second = await seedAsset(a.ctx)

    const body = await readJson(await importItems(a, [{ code: "SP-1", image_asset_id: second }]))
    expect(body.images_attached_count).toBe(0)
    expect((await mainImages(a, "SP-1")).map((i) => i.asset_id)).toEqual([first])
  })

  it("cách ly tenant: mã trùng ở tiệm khác không bị gắn ảnh", async () => {
    await importItems(a, [{ code: "SP-CHUNG", image_asset_id: null }])
    const assetB = await seedAsset(b.ctx)

    const body = await readJson(await importItems(b, [{ code: "SP-CHUNG", image_asset_id: assetB }]))
    expect(body.created_count).toBe(1)
    expect(await mainImages(a, "SP-CHUNG")).toHaveLength(0)
  })
})
