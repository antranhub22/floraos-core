import { randomUUID } from "node:crypto"
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { disconnectDatabase, resetDatabase } from "../helpers/database"
import { createTenant, type Tenant } from "../helpers/fixtures"
import { prisma } from "@/core/tenancy/infra/prisma"
import type { TenantContext } from "@/core/tenancy"
import { flushBackground } from "@/core/runtime/background"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { BrochurePaymentRepository } from "@/modules/greeting-card/infra/brochure-payment-repository"
import { InboxFollowUpRepository } from "@/modules/greeting-card/infra/inbox-follow-up-repository"
import { ProductRepository } from "@/modules/products/infra/product-repository"
import { RoleRepository } from "@/modules/organization/infra/role-repository"
import { createSendLink } from "@/modules/greeting-card/use-cases/create-send-link"
import { selectBrochureProduct } from "@/modules/greeting-card/use-cases/select-brochure-product"
import { submitBrochureOrder } from "@/modules/greeting-card/use-cases/submit-brochure-order"
import { proposeDismissal } from "@/modules/greeting-card/use-cases/propose-dismissal"
import { claimOrder, markCustomerNotified } from "@/modules/greeting-card/use-cases/inbox-follow-ups"
import { getInbox } from "@/modules/greeting-card/use-cases/get-inbox"

/** Hộp việc: nhận đơn chưa có Sale, báo khách đơn bị huỷ, duyệt bỏ hiển thị (PO 17/10/2026). */

const ORDER = {
  customerName: "Khách Quen", customerPhone: "0987654321", recipientName: "Người Nhận", recipientPhone: "0912345678",
  confirmedTerms: true, deliveryDate: new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10), deliveryAddress: "1 Lê Lợi, Q1",
}

async function codeOf(p: Promise<unknown>): Promise<string | undefined> {
  try {
    await p
    return undefined
  } catch (err) {
    return (err as { code?: string }).code
  }
}

describe("greeting-card: việc bổ sung trong Hộp việc", () => {
  let a: Tenant
  let b: Tenant
  let lan: TenantContext
  let mai: TenantContext

  async function sale(t: Tenant, name: string): Promise<TenantContext> {
    const saleRole = await new RoleRepository().findSystemRoleByKey("sale")
    const user = await prisma.users.create({ data: { id: randomUUID(), email: `${name}-${randomUUID()}@vi-du.test`, name } })
    await prisma.memberships.create({ data: { id: randomUUID(), organization_id: t.organizationId, user_id: user.id, role_id: saleRole!.id, status: "ACTIVE", joined_at: new Date() } })
    return { ...t.ctx, userId: user.id, capabilities: new Set(["R1", "R2", "R9"]) }
  }

  async function orderOf(seller: TenantContext, opts: { unassigned?: boolean } = {}) {
    const product = await new ProductRepository().create(seller, { code: `HOA-${randomUUID().slice(0, 4)}`, name: "Bó hoa", attributes: { price: 600_000 } })
    const catalog = await new GreetingCardRepository().createCatalog(seller, { code: `bo-${randomUUID().slice(0, 6)}`, name: "Bộ", productIds: [product.id], createdBy: seller.userId })
    const link = await createSendLink(seller, { catalogId: catalog.id })
    await selectBrochureProduct(link.sendCode, product.id)
    const order = await submitBrochureOrder(link.sendCode, ORDER)
    if (opts.unassigned) await prisma.greeting_sessions.updateMany({ where: { order_id: order.orderId }, data: { sale_id: "public" } })
    return { orderId: order.orderId, sessionId: link.sessionId }
  }

  const ownMode = () =>
    prisma.organizations.update({ where: { id: a.organizationId }, data: { settings: { brochure_visibility: { mode: "OWN", members: {} } } } })

  beforeEach(async () => {
    await resetDatabase()
    a = await createTenant("alpha")
    b = await createTenant("beta")
    lan = await sale(a, "lan")
    mai = await sale(a, "mai")
  })

  afterAll(async () => {
    await flushBackground()
    await disconnectDatabase()
  })

  it("nhận đơn: Sale 'chỉ khách của mình' nhận được đơn chưa thuộc ai; người thứ hai 409; tổ chức khác 404; có audit", async () => {
    const { orderId } = await orderOf(a.ctx, { unassigned: true })
    await ownMode()
    expect((await new InboxFollowUpRepository().listUnassignedOpenOrders(lan)).map((r) => r.orderId)).toEqual([orderId])
    expect(await new InboxFollowUpRepository().listUnassignedOpenOrders(b.ctx)).toEqual([])

    expect(await codeOf(claimOrder({ ...b.ctx, capabilities: new Set(["R2"]) }, orderId))).toBe("NOT_FOUND")
    expect(await claimOrder(lan, orderId)).toMatchObject({ saleId: lan.userId, alreadyMine: false })
    expect(await claimOrder(lan, orderId)).toMatchObject({ alreadyMine: true })
    expect(await codeOf(claimOrder(mai, orderId))).toBe("CONFLICT")
    expect((await prisma.greeting_sessions.findFirstOrThrow({ where: { order_id: orderId } })).sale_id).toBe(lan.userId)
    expect(await prisma.audit_logs.count({ where: { organization_id: a.organizationId, action: "greeting_card.order.claim" } })).toBe(1)
  })

  it("nhận đơn: hai Sale bấm cùng lúc → đúng một người nhận", async () => {
    const { orderId } = await orderOf(a.ctx, { unassigned: true })
    const results = await Promise.allSettled([claimOrder(lan, orderId), claimOrder(mai, orderId)])
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    expect(results.filter((r) => r.status === "rejected").map((r) => (r as PromiseRejectedResult).reason.code)).toEqual(["CONFLICT"])
  })

  it("báo khách đơn bị huỷ: việc của Sale phụ trách; đã báo thì tắt; lặp → 409; tổ chức khác / Sale khác (chỉ khách của mình) → 404", async () => {
    const { orderId } = await orderOf(lan)
    await new BrochurePaymentRepository().cancel(a.ctx, orderId, "Tiệm hết hoa")
    await ownMode()

    const lanInbox = await getInbox(lan, undefined)
    expect(lanInbox.actions.filter((x) => x.orderId === orderId).map((x) => x.kind)).toEqual(["CANCELLED_NOTIFY_CUSTOMER"])
    expect((await getInbox(mai, undefined)).actions.some((x) => x.orderId === orderId)).toBe(false)

    expect(await codeOf(markCustomerNotified({ ...b.ctx, capabilities: new Set(["R2"]) }, orderId))).toBe("NOT_FOUND")
    expect(await codeOf(markCustomerNotified(mai, orderId))).toBe("NOT_FOUND")
    expect(await markCustomerNotified(lan, orderId)).toMatchObject({ by: lan.userId })
    expect(await codeOf(markCustomerNotified(lan, orderId))).toBe("CONFLICT")
    expect((await getInbox(lan, undefined)).actions.some((x) => x.orderId === orderId)).toBe(false)
    expect(await prisma.audit_logs.count({ where: { organization_id: a.organizationId, action: "greeting_card.order.customer_notified" } })).toBe(1)
  })

  it("đơn hệ thống tự huỷ vì quá hạn thanh toán không sinh việc báo khách", async () => {
    const { orderId } = await orderOf(lan)
    const system: TenantContext = { ...a.ctx, userId: "system:hold-expiry", capabilities: new Set() }
    await new BrochurePaymentRepository().cancel(system, orderId, "Hết hạn thanh toán", { paymentFailed: true })
    expect(await new InboxFollowUpRepository().listCancelledToNotify(a.ctx, [lan.userId])).toEqual([])
    expect(await codeOf(markCustomerNotified(lan, (await orderOf(lan)).orderId))).toBe("CONFLICT") // đơn chưa huỷ
  })

  it("đề xuất bỏ hiển thị hiện trong Hộp việc của người có quyền duyệt, không hiện cho Sale", async () => {
    const { sessionId } = await (async () => {
      const product = await new ProductRepository().create(a.ctx, { code: "HOA-L", name: "Bó", attributes: { price: 500_000 } })
      const catalog = await new GreetingCardRepository().createCatalog(a.ctx, { code: "bo-l", name: "Bộ", productIds: [product.id], createdBy: a.userId })
      return createSendLink(lan, { catalogId: catalog.id })
    })()
    await proposeDismissal(lan, { id: sessionId, type: "SESSION", reasonId: "PRICE_CHECK_ONLY", reasonText: "Khách chỉ vào khảo giá" })

    const admin = await getInbox({ ...a.ctx, capabilities: new Set(["F2", "R1", "R6"]) }, "ADMIN")
    const req = admin.actions.find((x) => x.kind === "DISMISSAL_REQUEST")
    expect(req?.dismissalRequest).toMatchObject({ targetId: sessionId, type: "SESSION" })
    expect((await getInbox(lan, undefined)).actions.some((x) => x.kind === "DISMISSAL_REQUEST")).toBe(false)
    const other = await getInbox({ ...b.ctx, capabilities: new Set(["F2", "R1", "R6"]) }, "ADMIN")
    expect(other.actions.some((x) => x.kind === "DISMISSAL_REQUEST")).toBe(false)
  })
})
