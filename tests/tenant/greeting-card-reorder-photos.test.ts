import { randomUUID } from "node:crypto"
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { disconnectDatabase, resetDatabase } from "../helpers/database"
import { createTenant, type Tenant } from "../helpers/fixtures"
import { prisma } from "@/core/tenancy/infra/prisma"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { ProductRepository } from "@/modules/products/infra/product-repository"
import { createSendLink } from "@/modules/greeting-card/use-cases/create-send-link"
import { submitBrochureOrder } from "@/modules/greeting-card/use-cases/submit-brochure-order"
import { selectBrochureProduct } from "@/modules/greeting-card/use-cases/select-brochure-product"
import { startAnotherOrder } from "@/modules/greeting-card/use-cases/start-another-order"
import { getBrochureTracking } from "@/modules/greeting-card/use-cases/get-brochure-tracking"
import { getTrackingPipeline } from "@/modules/greeting-card/use-cases/get-tracking-pipeline"
import {
  assignBrochureFlorist,
  dispatchBrochureShipping,
  uploadBrochureProductPhoto,
  uploadBrochureRecipientPhoto,
} from "@/modules/greeting-card/use-cases/update-brochure-order-status"

/** Đặt nhiều đơn trên một link (mục 12), tách ảnh thành phẩm/người nhận (mục 5), sale phụ trách (mục 11). */

const ORDER_INPUT = {
  customerName: "Khách Hàng",
  customerPhone: "0987654321",
  recipientName: "Người Nhận",
  recipientPhone: "0912345678",
  deliveryDate: new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10),
  deliveryAddress: "123 Đường Hoa, Quận 1, TP.HCM",
}

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
    return undefined
  } catch (err) {
    return (err as { code?: string }).code
  }
}

describe("greeting-card: đặt thêm đơn, ảnh theo dõi, sale phụ trách", () => {
  let a: Tenant
  let repo: GreetingCardRepository

  beforeEach(async () => {
    await resetDatabase()
    a = await createTenant("alpha")
    repo = new GreetingCardRepository()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  async function orderedLink() {
    const product = await new ProductRepository().create(a.ctx, { code: "HOA-1", name: "Bó hoa 1", attributes: { price: 500000 } })
    const catalog = await repo.createCatalog(a.ctx, { code: "bo-1", name: "Bộ 1", productIds: [product.id], createdBy: a.userId })
    const link = await createSendLink(a.ctx, { catalogId: catalog.id })
    await selectBrochureProduct(link.sendCode, product.id)
    const order = await submitBrochureOrder(link.sendCode, ORDER_INPUT)
    return { product, link, order }
  }

  async function asset() {
    return prisma.assets.create({
      data: {
        id: randomUUID(), organization_id: a.organizationId, kind: "ORIGINAL", state: "READY", version: 1,
        storage_key: `org/${a.organizationId}/unfiled/${randomUUID()}.jpg`, mime_type: "image/jpeg", created_by: a.userId,
      },
    })
  }

  it("đặt thêm đơn trên cùng link: link mới, mã đơn mới, cùng sale; đơn cũ giữ nguyên", async () => {
    const { product, link, order } = await orderedLink()

    const next = await startAnotherOrder(link.sendCode)
    expect(next.sendCode).not.toBe(link.sendCode)
    await selectBrochureProduct(next.sendCode, product.id)
    const second = await submitBrochureOrder(next.sendCode, { ...ORDER_INPUT, recipientName: "Người Nhận 2" })
    expect(second.orderCode).not.toBe(order.orderCode)

    const sessions = await prisma.greeting_sessions.findMany({ where: { organization_id: a.organizationId } })
    expect(new Set(sessions.map((s) => s.sale_id))).toEqual(new Set([a.userId]))
    // Gửi lại đơn cũ vẫn trả đúng đơn cũ (chống bấm đúp), không tạo đơn thứ ba
    expect((await submitBrochureOrder(link.sendCode, ORDER_INPUT)).orderCode).toBe(order.orderCode)
    expect(await prisma.orders.count({ where: { organization_id: a.organizationId } })).toBe(2)
  })

  it("link chưa có đơn không mở được 'đặt thêm'", async () => {
    const product = await new ProductRepository().create(a.ctx, { code: "HOA-2", name: "Bó hoa 2", attributes: { price: 1 } })
    const catalog = await repo.createCatalog(a.ctx, { code: "bo-2", name: "Bộ 2", productIds: [product.id], createdBy: a.userId })
    const link = await createSendLink(a.ctx, { catalogId: catalog.id })
    expect(await codeOf(startAnotherOrder(link.sendCode))).toBe("CONFLICT")
  })

  it("ảnh người nhận là mục riêng, không đè ảnh thành phẩm", async () => {
    const { order } = await orderedLink()
    const product = await asset()
    const recipient = await asset()
    await assignBrochureFlorist(a.ctx, order.orderId, { floristNote: "Thợ A" })
    await uploadBrochureProductPhoto(a.ctx, order.orderId, { assetId: product.id })
    await dispatchBrochureShipping(a.ctx, order.orderId, { trackingNote: "Ship A" })
    await uploadBrochureRecipientPhoto(a.ctx, order.orderId, { assetId: recipient.id })

    const tracking = await getBrochureTracking(order.orderCode)
    expect(tracking.status).toBe("FOUND")
    if (tracking.status === "FOUND") {
      expect(tracking.order.productPhotoUrls).toHaveLength(1)
      expect(tracking.order.recipientPhotoUrls).toHaveLength(1)
      expect(tracking.order.productPhotoUrls[0]).toContain(product.storage_key)
      expect(tracking.order.recipientPhotoUrls[0]).toContain(recipient.storage_key)
    }
  })

  it("tab theo dõi hiện sale phụ trách là người tạo link", async () => {
    const { order } = await orderedLink()
    const items = await getTrackingPipeline(a.ctx)
    const row = items.find((i) => i.orderId === order.orderId)
    expect(row?.saleName).toBe("Người dùng alpha")
  })
})

describe("greeting-card: phạm vi xem đơn của sale (mục 10)", () => {
  let a: Tenant

  beforeEach(async () => {
    await resetDatabase()
    a = await createTenant("alpha")
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it("chế độ OWN: sale thuần chỉ thấy link của mình; điều hành vẫn thấy tất cả; mặc định thấy tất cả", async () => {
    const repo = new GreetingCardRepository()
    const product = await new ProductRepository().create(a.ctx, { code: "HOA-V", name: "Bó V", attributes: { price: 1 } })
    const catalog = await repo.createCatalog(a.ctx, { code: "bo-v", name: "Bộ V", productIds: [product.id], createdBy: a.userId })
    const saleA = { ...a.ctx, userId: "sale-a", capabilities: new Set(["R1", "R2"]) }
    const saleB = { ...a.ctx, userId: "sale-b", capabilities: new Set(["R1", "R2"]) }
    const linkA = await createSendLink(saleA, { catalogId: catalog.id })
    const linkB = await createSendLink(saleB, { catalogId: catalog.id })
    const codes = async (ctx: typeof saleA) => (await getTrackingPipeline(ctx)).map((i) => i.sendCode).sort()

    expect(await codes(saleA)).toEqual([linkA.sendCode, linkB.sendCode].sort())

    await prisma.organizations.update({ where: { id: a.organizationId }, data: { settings: { brochure_visibility: { mode: "OWN" } } } })
    expect(await codes(saleA)).toEqual([linkA.sendCode])
    expect(await codes(saleB)).toEqual([linkB.sendCode])
    expect(await codes({ ...saleA, capabilities: new Set(["R1", "R9"]) })).toEqual([linkA.sendCode, linkB.sendCode].sort())
  })
})
