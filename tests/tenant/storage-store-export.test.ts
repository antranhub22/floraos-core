import { randomUUID } from "node:crypto"
import * as XLSX from "xlsx"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { GET as getExportRoute, POST as postExportRoute } from "@/app/api/v1/storage/export/route"
import type { TenantContext } from "@/core/tenancy"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { runNextStoreExport } from "@/modules/storage/use-cases/run-store-export"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { addStaffWithSession, createTenant, readJson, withSession, type Tenant } from "../helpers/fixtures"

const URL_EXPORT = "http://localhost/api/v1/storage/export"

describe("Tải dữ liệu cửa hàng — bản sao lưu ZIP", () => {
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

  async function seedCustomer(t: Tenant, name: string, phone: string, deleted = false) {
    await prisma.customers.create({
      data: {
        organization_id: t.organizationId,
        code: `KH-${phone.slice(-4)}`,
        name,
        phone,
        ...(deleted ? { deleted_at: new Date(), deleted_by: t.userId } : {}),
      },
    })
  }

  async function seedImage(ctx: TenantContext, filename: string) {
    const id = randomUUID()
    const storageKey = `org/${ctx.organizationId}/unfiled/${id}.jpg`
    await getStorageProvider().put(storageKey, new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3]), "image/jpeg")
    await new AssetRepository().create(ctx, {
      id,
      productId: null,
      parentAssetId: null,
      kind: "ORIGINAL",
      version: 1,
      storageKey,
      mimeType: "image/jpeg",
      createdBy: ctx.userId,
    })
    await prisma.assets.update({ where: { id }, data: { state: "READY", file_size: 6, metadata: { filename } } })
  }

  async function readZip(t: Tenant) {
    const res = await getExportRoute(withSession(URL_EXPORT, t.token))
    const view = (await readJson(res))["data"] as { status: string; downloadUrl: string | null; id: string }
    const job = await prisma.generation_jobs.findUnique({ where: { id: view.id } })
    const key = (job?.output as { storageKey: string }).storageKey
    return { view, zip: XLSX.CFB.read(Buffer.from(await getStorageProvider().get(key)), { type: "buffer" }) }
  }

  it("chủ tiệm tạo bản sao lưu: chỉ dữ liệu của tiệm mình, Excel bỏ mục trong Thùng rác, có ảnh gốc", async () => {
    await seedCustomer(a, "Chị Lan", "0901111111")
    await seedCustomer(a, "Khách đã xoá", "0902222222", true)
    await seedCustomer(b, "Bí mật của B", "0903333333")
    await seedImage(a.ctx, "bo-hong.jpg")

    const post = await postExportRoute(withSession(URL_EXPORT, a.token, { method: "POST" }))
    expect(post.status).toBe(202)
    expect(((await readJson(post))["data"] as { status: string }).status).toBe("PENDING")

    // Bấm lần nữa khi đang chờ → trả lại đúng lượt đó, không tạo trùng.
    await postExportRoute(withSession(URL_EXPORT, a.token, { method: "POST" }))
    expect(await prisma.generation_jobs.count({ where: { feature: "store.export" } })).toBe(1)

    expect(await runNextStoreExport()).toBe(true)
    expect(await runNextStoreExport()).toBe(false)

    const { view, zip } = await readZip(a)
    expect(view.status).toBe("COMPLETED")
    expect(view.downloadUrl).toBeTruthy()

    const data = JSON.parse(Buffer.from(XLSX.CFB.find(zip, "data.json")?.content as Uint8Array).toString("utf8"))
    const names = (data.tables.customers as Array<{ name: string }>).map((c) => c.name).sort()
    expect(names).toEqual(["Chị Lan", "Khách đã xoá"])
    expect(JSON.stringify(data)).not.toContain("Bí mật của B")
    expect(data.tables).not.toHaveProperty("integration_tokens")

    const wb = XLSX.read(XLSX.CFB.find(zip, "du-lieu-cua-hang.xlsx")?.content as Uint8Array, { type: "array" })
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets["Khách hàng"] as XLSX.WorkSheet)
    expect(rows.map((r) => r["Tên"])).toEqual(["Chị Lan"])

    expect(zip.FullPaths.some((p: string) => p.endsWith("anh-goc/bo-hong.jpg"))).toBe(true)
  })

  it("tiệm khác không thấy bản sao lưu của tiệm này", async () => {
    await postExportRoute(withSession(URL_EXPORT, a.token, { method: "POST" }))
    await runNextStoreExport()

    const res = await getExportRoute(withSession(URL_EXPORT, b.token))
    expect(res.status).toBe(200)
    expect((await readJson(res))["data"]).toBeNull()
  })

  it("nhân viên không có quyền xuất dữ liệu (R13) bị từ chối", async () => {
    const sale = await addStaffWithSession(a, "sale", "nhan-vien")
    const res = await postExportRoute(withSession(URL_EXPORT, sale.token, { method: "POST" }))
    expect(res.status).toBe(403)
    expect(await prisma.generation_jobs.count({ where: { feature: "store.export" } })).toBe(0)
  })
})
