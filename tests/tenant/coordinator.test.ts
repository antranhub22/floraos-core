import { randomUUID } from "node:crypto"

import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { GET as listOrders, POST as createOrder } from "@/app/api/v1/coordinator/orders/route"
import { GET as getOrder } from "@/app/api/v1/coordinator/orders/[id]/route"
import { PATCH as patchStage } from "@/app/api/v1/coordinator/orders/[id]/stage/route"
import { POST as assignPartner } from "@/app/api/v1/coordinator/orders/[id]/assign-partner/route"
import { POST as production } from "@/app/api/v1/coordinator/orders/[id]/production/route"
import { POST as qc } from "@/app/api/v1/coordinator/orders/[id]/qc/route"
import { POST as delivery } from "@/app/api/v1/coordinator/orders/[id]/delivery/route"
import { POST as openException } from "@/app/api/v1/coordinator/orders/[id]/exceptions/route"
import { POST as closeOrder } from "@/app/api/v1/coordinator/orders/[id]/close/route"
import { POST as cancelOrder } from "@/app/api/v1/coordinator/orders/[id]/cancel/route"
import { POST as resolveException } from "@/app/api/v1/coordinator/exceptions/[id]/resolve/route"
import { GET as listPartners, POST as createPartner } from "@/app/api/v1/coordinator/partners/route"
import { PATCH as patchPartner } from "@/app/api/v1/coordinator/partners/[id]/route"
import type { TenantContext } from "@/core/tenancy"
import { prisma } from "@/core/tenancy/infra/prisma"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import type { PartnerView } from "@/modules/coordinator/use-cases/manage-partners"
import type { CoordinatorOrderView } from "@/modules/coordinator/use-cases/present-coordinator-order"

import { disconnectDatabase, resetDatabase } from "../helpers/database"
import { createTenant, readJson, withSession, type Tenant } from "../helpers/fixtures"

const BASE = "http://localhost/api/v1/coordinator"

type Handler = (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

function call(handler: Handler, t: Tenant, id: string, body?: unknown, method = "POST") {
  return handler(
    withSession(`${BASE}/x/${id}`, t.token, body === undefined ? { method } : { method, body: JSON.stringify(body) }),
    { params: Promise.resolve({ id }) }
  )
}

type ApiBody = {
  order: CoordinatorOrderView
  orders: CoordinatorOrderView[]
  partner: PartnerView
  partners: PartnerView[]
}

async function json(res: Response): Promise<ApiBody> {
  return (await readJson(res)) as unknown as ApiBody
}

const ORDER_BODY = {
  customerName: "Nguyễn Văn An",
  customerTier: "VIP",
  recipientName: "Trần Thị Bình",
  recipientPhone: "0901234567",
  deliveryAddress: { street: "123 Phố Huế", ward: "Ngô Thì Nhậm", district: "Hai Bà Trưng", city: "Hà Nội" },
  deliveryTargetTime: "17:00 hôm nay",
  deliveryTargetAt: new Date(Date.now() + 6 * 3600_000).toISOString(),
  productTitle: "Bó hoa hồng Pastel",
  unitPriceVnd: 850000,
  flowers: [{ flowerName: "Hồng Ohara", quantity: 12, unit: "cành", color: "hồng", role: "Chủ đạo" }],
  cardMessage: "Chúc mừng sinh nhật!",
}

async function newOrder(t: Tenant, body: Record<string, unknown> = ORDER_BODY): Promise<CoordinatorOrderView> {
  const res = await createOrder(withSession(`${BASE}/orders`, t.token, { method: "POST", body: JSON.stringify(body) }))
  expect(res.status).toBe(201)
  return (await json(res)).order
}

async function newPartner(t: Tenant, code = "XUONG-01", capacityDaily = 10): Promise<PartnerView> {
  const res = await createPartner(
    withSession(`${BASE}/partners`, t.token, {
      method: "POST",
      body: JSON.stringify({ code, name: `Xưởng ${code}`, phone: "0912345678", capacityDaily }),
    })
  )
  expect(res.status).toBe(201)
  return (await json(res)).partner
}

async function seedAsset(ctx: TenantContext): Promise<string> {
  const asset = await new AssetRepository().create(ctx, {
    id: randomUUID(),
    productId: null,
    parentAssetId: null,
    kind: "ORIGINAL",
    version: 1,
    storageKey: `org/${ctx.organizationId}/dieu-phoi/${randomUUID()}.jpg`,
    mimeType: "image/jpeg",
    createdBy: ctx.userId,
  })
  return asset.id
}

/** Đưa đơn tới QUALITY_CHECK qua đúng các endpoint. */
async function toQualityCheck(t: Tenant): Promise<{ order: CoordinatorOrderView; imageId: string }> {
  const order = await newOrder(t)
  const partner = await newPartner(t, `P-${randomUUID().slice(0, 6)}`)
  expect((await call(patchStage, t, order.id, { stage: "PLANNING" }, "PATCH")).status).toBe(200)
  expect((await call(assignPartner, t, order.id, { partnerId: partner.id })).status).toBe(200)
  const imageId = await seedAsset(t.ctx)
  const res = await call(production, t, order.id, { action: "MARK_READY", progressPercent: 100, finishedAssetIds: [imageId] })
  expect(res.status).toBe(200)
  return { order: (await json(res)).order, imageId }
}

describe("Chức năng 12 — Điều phối đơn hàng: cách ly tenant và luồng P1→P7", () => {
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

  it("tạo đơn: máy chủ cấp mã tuần tự, ghi order_coordinations + order_events + audit_logs", async () => {
    const first = await newOrder(a)
    const second = await newOrder(a)
    expect(first.orderCode).toMatch(/^FLR-\d{6}-0001$/)
    expect(second.orderCode).toMatch(/^FLR-\d{6}-0002$/)
    expect(first.stage).toBe("INTAKE")

    const coordination = await prisma.order_coordinations.findUnique({ where: { order_id: first.id } })
    expect(coordination?.organization_id).toBe(a.organizationId)
    expect(await prisma.order_events.count({ where: { order_id: first.id } })).toBe(1)
    expect(await prisma.audit_logs.count({ where: { entity_id: first.id, action: "coordinator.order.create" } })).toBe(1)
  })

  it("tạo đơn đồng thời không sinh trùng mã (thử lại khi đụng khoá duy nhất)", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        createOrder(withSession(`${BASE}/orders`, a.token, { method: "POST", body: JSON.stringify(ORDER_BODY) }))
      )
    )
    expect(results.map((r) => r.status)).toEqual([201, 201, 201, 201, 201])
    const codes = await Promise.all(results.map(async (r) => (await json(r)).order.orderCode))
    expect(new Set(codes).size).toBe(5)
  })

  it("hai tổ chức dùng chung số thứ tự mã mà không đụng nhau", async () => {
    const oa = await newOrder(a)
    const ob = await newOrder(b)
    expect(oa.orderCode).toBe(ob.orderCode)
  })

  it("danh sách và chi tiết chỉ thấy đơn của tổ chức mình; tổ chức khác đọc/sửa → 404", async () => {
    const order = await newOrder(a)

    const listB = (await json(await listOrders(withSession(`${BASE}/orders`, b.token))))
    expect(listB.orders).toHaveLength(0)
    const listA = (await json(await listOrders(withSession(`${BASE}/orders`, a.token))))
    expect(listA.orders.map((o) => o.id)).toEqual([order.id])

    expect((await call(getOrder, b, order.id, undefined, "GET")).status).toBe(404)
    expect((await call(getOrder, b, order.orderCode, undefined, "GET")).status).toBe(404)
    expect((await call(patchStage, b, order.id, { stage: "PLANNING" }, "PATCH")).status).toBe(404)
    expect((await call(cancelOrder, b, order.id, { reason: "phá" })).status).toBe(404)
    expect((await call(openException, b, order.id, { type: "CUSTOMER_CHANGE", description: "x" })).status).toBe(404)

    const after = (await json(await call(getOrder, a, order.id, undefined, "GET")))
    expect(after.order.stage).toBe("INTAKE")
  })

  it("không phân công được đối tác của tổ chức khác (404)", async () => {
    const order = await newOrder(a)
    const partnerB = await newPartner(b)
    await call(patchStage, a, order.id, { stage: "PLANNING" }, "PATCH")
    expect((await call(assignPartner, a, order.id, { partnerId: partnerB.id })).status).toBe(404)

    const partnersA = (await json(await listPartners(withSession(`${BASE}/partners`, a.token))))
    expect(partnersA.partners).toHaveLength(0)
    expect((await call(patchPartner, a, partnerB.id, { isActive: false }, "PATCH")).status).toBe(404)
  })

  it("không gắn được ảnh (assets) của tổ chức khác làm ảnh thành phẩm / POD (422)", async () => {
    const order = await newOrder(a)
    const partner = await newPartner(a)
    await call(patchStage, a, order.id, { stage: "PLANNING" }, "PATCH")
    await call(assignPartner, a, order.id, { partnerId: partner.id })
    const foreignImage = await seedAsset(b.ctx)
    const res = await call(production, a, order.id, { action: "MARK_READY", progressPercent: 100, finishedAssetIds: [foreignImage] })
    expect(res.status).toBe(422)
  })

  it("body sai → 400, bước lạ → 400, nhảy cóc → 409 (không còn 500)", async () => {
    const bad = await createOrder(withSession(`${BASE}/orders`, a.token, { method: "POST", body: JSON.stringify({ customerName: "" }) }))
    expect(bad.status).toBe(400)
    const dataUrl = await createOrder(
      withSession(`${BASE}/orders`, a.token, {
        method: "POST",
        body: JSON.stringify({ ...ORDER_BODY, sampleImageUrl: "data:image/png;base64,AAAA" }),
      })
    )
    expect(dataUrl.status).toBe(400)

    const order = await newOrder(a)
    expect((await call(patchStage, a, order.id, { stage: "HACKED" }, "PATCH")).status).toBe(400)
    expect((await call(patchStage, a, order.id, { stage: "COMPLETED" }, "PATCH")).status).toBe(409)
    expect((await call(patchStage, a, order.id, { stage: "DISPATCHING" }, "PATCH")).status).toBe(409)
    expect((await call(getOrder, a, randomUUID(), undefined, "GET")).status).toBe(404)
  })

  it("luồng đủ P1→P7: kế hoạch → phân công → cắm → QC đạt → giao có POD → đóng đơn", async () => {
    const { order, imageId } = await toQualityCheck(a)
    expect(order.stage).toBe("QUALITY_CHECK")
    expect(order.productionProgress).toBe(100)
    expect(order.finishedImageUrls).toHaveLength(1)

    // Chưa QC đạt thì không giao được.
    expect((await call(delivery, a, order.id, { event: "PICKED_UP", shipperName: "Bình" })).status).toBe(422)

    const passed = (await json(await call(qc, a, order.id, { decision: "PASSED" })))
    expect(passed.order.stage).toBe("DISPATCHING")
    expect(passed.order.qc?.status).toBe("PASSED")
    expect(passed.order.qc?.aiScore).toBeNull()
    const qcRow = await prisma.order_qc_records.findFirst({ where: { order_id: order.id } })
    expect(qcRow?.image_asset_ids).toEqual([imageId])

    expect((await call(delivery, a, order.id, { event: "PICKED_UP", shipperName: "Bình", carrier: "AhaMove" })).status).toBe(200)
    expect((await call(delivery, a, order.id, { event: "ON_THE_WAY", shipperName: "Bình" })).status).toBe(200)
    // Không lùi trạng thái giao.
    expect((await call(delivery, a, order.id, { event: "PICKED_UP", shipperName: "Bình" })).status).toBe(422)
    // Thiếu POD → 422.
    expect((await call(delivery, a, order.id, { event: "DELIVERED_SUCCESS", shipperName: "Bình" })).status).toBe(422)

    const pod = await seedAsset(a.ctx)
    const delivered = (await json(
      await call(delivery, a, order.id, { event: "DELIVERED_SUCCESS", shipperName: "Bình", podAssetId: pod, recipientSignedName: "Lan" })
    ))
    expect(delivered.order.stage).toBe("DELIVERED")
    expect(delivered.order.delivery.podImageUrl).toBeTruthy()
    expect(delivered.order.delivery.carrier).toBe("AhaMove")

    const closed = (await json(await call(closeOrder, a, order.id, { partnerRating: 5, partnerPayoutVnd: 350000 })))
    expect(closed.order.stage).toBe("COMPLETED")
    expect(closed.order.partnerPayoutVnd).toBe(350000)

    const row = await prisma.orders.findUnique({ where: { id: order.id } })
    expect(row).toMatchObject({ status: "COMPLETED", production_status: "READY", delivery_status: "DELIVERED" })

    // Chuỗi order_events đủ để M10 đo SLA; audit_logs có từng thao tác.
    const axes = await prisma.order_events.findMany({ where: { order_id: order.id }, orderBy: { created_at: "asc" } })
    expect(axes.some((e) => e.axis === "delivery" && e.to_value === "DELIVERED")).toBe(true)
    const actions = (await prisma.audit_logs.findMany({ where: { entity_id: order.id } })).map((l) => l.action)
    expect(actions).toEqual(
      expect.arrayContaining([
        "coordinator.order.create",
        "coordinator.partner.assign",
        "coordinator.production.update",
        "coordinator.qc.record",
        "coordinator.delivery.update",
        "coordinator.order.close",
      ])
    )

    // Đơn đã đóng thì không đi đâu nữa.
    expect((await call(patchStage, a, order.id, { stage: "DELIVERED" }, "PATCH")).status).toBe(409)
    expect((await call(cancelOrder, a, order.id, { reason: "x" })).status).toBe(422)
  })

  it("QC yêu cầu làm lại → quay về IN_PRODUCTION, bắt buộc lý do", async () => {
    const { order } = await toQualityCheck(a)
    expect((await call(qc, a, order.id, { decision: "REWORK_REQUESTED" })).status).toBe(422)
    const rework = (await json(await call(qc, a, order.id, { decision: "REWORK_REQUESTED", notes: "Nơ lệch màu" })))
    expect(rework.order.stage).toBe("IN_PRODUCTION")
    expect(rework.order.productionProgress).toBe(0)
  })

  it("sự cố: mở → đơn về EXCEPTION giữ nguyên trục giao; xử lý xong → tự về đúng bước cũ; chưa xử lý thì không đóng", async () => {
    const { order } = await toQualityCheck(a)
    await call(qc, a, order.id, { decision: "PASSED" })
    await call(delivery, a, order.id, { event: "PICKED_UP", shipperName: "Bình" })

    const failed = (await json(
      await call(delivery, a, order.id, { event: "DELIVERY_FAILED", shipperName: "Bình", failureReason: "Người nhận không nghe máy" })
    ))
    expect(failed.order.stage).toBe("EXCEPTION")
    expect(failed.order.hasException).toBe(true)
    expect(failed.order.riskLevel).toBe("CRITICAL")
    const exc = failed.order.exceptions[0]!
    expect(exc.type).toBe("DELIVERY_FAILURE")
    expect(exc.code).toBe(`EXC-${order.orderCode}-01`)
    const row = await prisma.orders.findUnique({ where: { id: order.id } })
    expect(row?.delivery_status).toBe("FAILED")

    // Không thoát EXCEPTION bằng đường tắt khi còn sự cố mở.
    expect((await call(patchStage, a, order.id, { stage: "DISPATCHING" }, "PATCH")).status).toBe(409)
    // Tổ chức khác không xử lý hộ được.
    expect((await call(resolveException, b, exc.id, { resolution: "x" })).status).toBe(404)

    const resolved = (await json(await call(resolveException, a, exc.id, { resolution: "Hẹn giao lại 18:00" })))
    expect(resolved.order.stage).toBe("DISPATCHING")
    expect(resolved.order.hasException).toBe(false)
    expect((await call(resolveException, a, exc.id, { resolution: "lần hai" })).status).toBe(409)
  })

  it("mở sự cố đồng thời trên một đơn: 201 hoặc 409, không bao giờ 500", async () => {
    const order = await newOrder(a)
    const results = await Promise.all(
      Array.from({ length: 4 }, (_, i) =>
        call(openException, a, order.id, { type: "CUSTOMER_CHANGE", description: `Khách đổi lần ${i}` })
      )
    )
    const statuses = results.map((r) => r.status)
    expect(statuses.every((st) => st === 201 || st === 409)).toBe(true)
    expect(statuses).toContain(201)
    const codes = (await prisma.order_exceptions.findMany({ where: { order_id: order.id } })).map((e) => e.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("huỷ đơn: bắt buộc lý do, gác bằng R6 (trần cứng điều hành)", async () => {
    const order = await newOrder(a)
    expect((await call(cancelOrder, a, order.id, { reason: "" })).status).toBe(400)
    const cancelled = (await json(await call(cancelOrder, a, order.id, { reason: "Khách huỷ" })))
    expect(cancelled.order.stage).toBe("CANCELLED")
    expect(cancelled.order.cancelledReason).toBe("Khách huỷ")
    expect((await prisma.orders.findUnique({ where: { id: order.id } }))?.status).toBe("CANCELLED")
  })

  it("đối tác: trùng mã → 409, tạm ngưng thì không nhận đơn, quá công suất ngày → 422", async () => {
    await newPartner(a, "XUONG-A")
    const dup = await createPartner(
      withSession(`${BASE}/partners`, a.token, {
        method: "POST",
        body: JSON.stringify({ code: "XUONG-A", name: "Trùng", phone: "0912345678" }),
      })
    )
    expect(dup.status).toBe(409)

    const small = await newPartner(a, "XUONG-NHO", 1)
    const o1 = await newOrder(a)
    const o2 = await newOrder(a)
    for (const o of [o1, o2]) await call(patchStage, a, o.id, { stage: "PLANNING" }, "PATCH")
    expect((await call(assignPartner, a, o1.id, { partnerId: small.id })).status).toBe(200)
    expect((await call(assignPartner, a, o2.id, { partnerId: small.id })).status).toBe(422)
    expect((await call(assignPartner, a, o2.id, { partnerId: small.id, overrideCapacity: true })).status).toBe(200)

    const paused = await newPartner(a, "XUONG-NGHI")
    expect((await call(patchPartner, a, paused.id, { isActive: false }, "PATCH")).status).toBe(200)
    const o3 = await newOrder(a)
    await call(patchStage, a, o3.id, { stage: "PLANNING" }, "PATCH")
    expect((await call(assignPartner, a, o3.id, { partnerId: paused.id })).status).toBe(422)
  })

  it("bảng công tắc tắt R5 cho điều hành → cập nhật giao hàng trả 403", async () => {
    const { order } = await toQualityCheck(a)
    await call(qc, a, order.id, { decision: "PASSED" })
    const membership = await prisma.memberships.findFirst({ where: { organization_id: a.organizationId, user_id: a.userId } })
    await prisma.capability_overrides.create({
      data: {
        organization_id: a.organizationId,
        role_id: membership!.role_id,
        capability_code: "R5",
        allowed: false,
        updated_by: a.userId,
      },
    })
    expect((await call(delivery, a, order.id, { event: "PICKED_UP", shipperName: "Bình" })).status).toBe(403)
  })
})
