import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { DELETE as deleteCustomerRoute, GET as getCustomerRoute } from "@/app/api/v1/crm/customers/[id]/route"
import { GET as listTrashRoute } from "@/app/api/v1/storage/trash/route"
import { POST as restoreRoute } from "@/app/api/v1/storage/trash/[id]/restore/route"
import { DELETE as purgeRoute } from "@/app/api/v1/storage/trash/[id]/route"
import { CustomerRepository } from "@/modules/crm/infra/customer-repository"
import { TrashRepository } from "@/modules/storage/infra/trash-repository"
import { purgeExpiredTrash } from "@/modules/storage/use-cases/purge-expired-trash"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { createTenant, readJson, withSession, type Tenant } from "../helpers/fixtures"

const BASE = "http://localhost/api/v1"
const DAY_MS = 86_400_000

describe("Thùng rác 30 ngày — khách hàng, sản phẩm, bộ sưu tập", () => {
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

  async function seedCustomer(t: Tenant, phone: string) {
    return prisma.customers.create({
      data: { organization_id: t.organizationId, code: `KH-${phone.slice(-4)}`, name: `Khách ${phone}`, phone },
    })
  }

  function restore(t: Tenant, id: string, type: string) {
    return restoreRoute(
      withSession(`${BASE}/storage/trash/${id}/restore`, t.token, { method: "POST", body: JSON.stringify({ type }) }),
      { params: Promise.resolve({ id }) }
    )
  }

  async function listTrash(t: Tenant) {
    const res = await listTrashRoute(withSession(`${BASE}/storage/trash`, t.token))
    expect(res.status).toBe(200)
    return (await readJson(res))["data"] as Array<{ id: string; type: string; retained?: boolean }>
  }

  it("xoá khách hàng → vào thùng rác, ẩn khỏi danh sách, khôi phục được nguyên vẹn", async () => {
    const customer = await seedCustomer(a, "0901234567")
    const ctx = { params: Promise.resolve({ id: customer.id }) }

    const del = await deleteCustomerRoute(withSession(`${BASE}/crm/customers/${customer.id}`, a.token, { method: "DELETE" }), ctx)
    expect(del.status).toBe(200)

    const row = await prisma.customers.findUnique({ where: { id: customer.id } })
    expect(row?.deleted_at).not.toBeNull()
    expect(row?.deleted_by).toBe(a.userId)
    expect((await new CustomerRepository().list(a.ctx)).items).toHaveLength(0)
    const get = await getCustomerRoute(withSession(`${BASE}/crm/customers/${customer.id}`, a.token), {
      params: Promise.resolve({ id: customer.id }),
    })
    expect(get.status).toBe(404)
    expect((await listTrash(a)).map((i) => i.id)).toContain(customer.id)

    const res = await restore(a, customer.id, "CUSTOMER")
    expect(res.status).toBe(200)
    expect((await new CustomerRepository().list(a.ctx)).items.map((c) => c.id)).toEqual([customer.id])

    const audit = await prisma.audit_logs.findMany({ where: { entity_id: customer.id }, orderBy: { created_at: "asc" } })
    expect(audit.map((r) => r.action)).toEqual(["trash.move", "trash.restore"])
  })

  it("tổ chức khác không thấy, không khôi phục, không xoá hẳn được mục trong thùng rác (404)", async () => {
    const customer = await seedCustomer(a, "0901234568")
    await new TrashRepository().moveToTrash(a.ctx, { type: "CUSTOMER", id: customer.id })

    expect(await listTrash(b)).toEqual([])
    expect((await restore(b, customer.id, "CUSTOMER")).status).toBe(404)
    const purge = await purgeRoute(
      withSession(`${BASE}/storage/trash/${customer.id}?type=CUSTOMER`, b.token, { method: "DELETE" }),
      { params: Promise.resolve({ id: customer.id }) }
    )
    expect(purge.status).toBe(404)
    expect(await prisma.customers.findUnique({ where: { id: customer.id } })).not.toBeNull()
  })

  it("sản phẩm nháp bỏ vào thùng rác rồi khôi phục vẫn là nháp, không tự thành đang bán", async () => {
    const product = await prisma.products.create({
      data: { organization_id: a.organizationId, code: "SP-01", name: "Bó hồng", status: "DRAFT" },
    })
    expect(await new TrashRepository().moveToTrash(a.ctx, { type: "PRODUCT", id: product.id })).toBe(true)
    expect((await prisma.products.findUnique({ where: { id: product.id } }))?.status).toBe("ARCHIVED")

    expect((await restore(a, product.id, "PRODUCT")).status).toBe(200)
    const row = await prisma.products.findUnique({ where: { id: product.id } })
    expect(row?.status).toBe("DRAFT")
    expect(row?.deleted_at).toBeNull()
  })

  it("sản phẩm 'ngừng kinh doanh' (ARCHIVED không qua thùng rác) không bị coi là rác và không bị dọn", async () => {
    const product = await prisma.products.create({
      data: { organization_id: a.organizationId, code: "SP-02", name: "Giỏ lan", status: "ARCHIVED" },
    })
    expect((await listTrash(a)).map((i) => i.id)).not.toContain(product.id)
    await purgeExpiredTrash(new Date(Date.now() + 365 * DAY_MS))
    expect(await prisma.products.findUnique({ where: { id: product.id } })).not.toBeNull()
  })

  it("bộ dọn rác xoá hẳn mục quá 30 ngày, giữ mục còn hạn và catalog đã có phiên khách", async () => {
    const old = await seedCustomer(a, "0901234569")
    const fresh = await seedCustomer(a, "0901234570")
    const repo = new TrashRepository()
    await repo.moveToTrash(a.ctx, { type: "CUSTOMER", id: old.id })
    await repo.moveToTrash(a.ctx, { type: "CUSTOMER", id: fresh.id })
    await prisma.customers.update({ where: { id: old.id }, data: { deleted_at: new Date(Date.now() - 31 * DAY_MS) } })

    const catalog = await prisma.greeting_catalogs.create({
      data: { organization_id: a.organizationId, code: "20-10", name: "Ngày 20/10", created_by: a.userId },
    })
    await prisma.greeting_sessions.create({
      data: { organization_id: a.organizationId, catalog_id: catalog.id, send_code: "T01-001", sale_id: a.userId },
    })
    await repo.moveToTrash(a.ctx, { type: "GREETING_CATALOG", id: catalog.id })
    await prisma.greeting_catalogs.update({ where: { id: catalog.id }, data: { deleted_at: new Date(Date.now() - 31 * DAY_MS) } })

    const result = await purgeExpiredTrash()
    expect(result).toMatchObject({ purged: 1, failed: 0 })
    expect(await prisma.customers.findUnique({ where: { id: old.id } })).toBeNull()
    expect(await prisma.customers.findUnique({ where: { id: fresh.id } })).not.toBeNull()
    expect(await prisma.greeting_catalogs.findUnique({ where: { id: catalog.id } })).not.toBeNull()

    const items = await listTrash(a)
    expect(items.find((i) => i.id === catalog.id)?.retained).toBe(true)
    const purge = await purgeRoute(
      withSession(`${BASE}/storage/trash/${catalog.id}?type=GREETING_CATALOG`, a.token, { method: "DELETE" }),
      { params: Promise.resolve({ id: catalog.id }) }
    )
    expect(purge.status).toBe(409)
  })

  it("tạo khách trùng SĐT với khách trong thùng rác → báo rõ để khôi phục, không lỗi hệ thống", async () => {
    const customer = await seedCustomer(a, "0901234571")
    await new TrashRepository().moveToTrash(a.ctx, { type: "CUSTOMER", id: customer.id })
    const { createCustomer } = await import("@/modules/crm/use-cases/create-customer")
    await expect(createCustomer(a.ctx, { name: "Khách mới", phone: "0901234571" })).rejects.toMatchObject({
      code: "CONFLICT",
    })
  })
})
