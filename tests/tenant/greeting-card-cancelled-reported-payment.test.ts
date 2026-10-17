import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { disconnectDatabase, resetDatabase } from "../helpers/database"
import { createTenant, type Tenant } from "../helpers/fixtures"
import { prisma } from "@/core/tenancy/infra/prisma"
import { flushBackground } from "@/core/runtime/background"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { ProductRepository } from "@/modules/products/infra/product-repository"
import { ReportedPaymentCheckRepository } from "@/modules/greeting-card/infra/reported-payment-check-repository"
import { createSendLink } from "@/modules/greeting-card/use-cases/create-send-link"
import { selectBrochureProduct } from "@/modules/greeting-card/use-cases/select-brochure-product"
import { submitBrochureOrder } from "@/modules/greeting-card/use-cases/submit-brochure-order"
import { getInbox } from "@/modules/greeting-card/use-cases/get-inbox"

/**
 * PO 17/10/2026: đơn bị huỷ khi khách ĐÃ BÁO chuyển khoản mà tiệm chưa ghi nhận tiền → sổ thu 0 đ nên
 * không có việc hoàn tiền. Hộp việc Điều hành phải có việc "kiểm sao kê, đã nhận thì hoàn" tới khi chốt.
 */
const ORDER = {
  customerName: "Khách Quen", customerPhone: "0987654321", recipientName: "Người Nhận", recipientPhone: "0912345678",
  confirmedTerms: true, selectedPromotionId: "promo-discount-10",
  deliveryDate: new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10), deliveryAddress: "1 Lê Lợi, Q1",
}

describe("greeting-card: đơn đã huỷ khi khách đã báo chuyển khoản", () => {
  let a: Tenant
  let b: Tenant

  beforeEach(async () => {
    await resetDatabase()
    a = await createTenant("alpha")
    b = await createTenant("beta")
  })

  afterAll(async () => {
    await flushBackground()
    await disconnectDatabase()
  })

  async function cancelledAfterReport(t: Tenant) {
    const product = await new ProductRepository().create(t.ctx, { code: "HOA-1", name: "Bó 1", attributes: { price: 999_000 } })
    const catalog = await new GreetingCardRepository().createCatalog(t.ctx, { code: "bo-1", name: "Bộ 1", productIds: [product.id], createdBy: t.userId })
    const link = await createSendLink(t.ctx, { catalogId: catalog.id })
    await selectBrochureProduct(link.sendCode, product.id)
    const order = await submitBrochureOrder(link.sendCode, ORDER)
    await prisma.greeting_sessions.updateMany({ where: { order_id: order.orderId }, data: { status: "PAYMENT_REPORTED" } })
    await prisma.orders.update({ where: { id: order.orderId }, data: { status: "CANCELLED" } })
    return order.orderId
  }

  it("Hộp việc Điều hành có việc kiểm tới khi chốt 'đã hoàn tiền'; sổ thu ghi cả khoản vào lẫn khoản hoàn", async () => {
    const orderId = await cancelledAfterReport(a)
    const repo = new ReportedPaymentCheckRepository()

    const pending = await repo.listPending(a.ctx, null)
    expect(pending.map((p) => p.orderId)).toEqual([orderId])
    const total = Number((await prisma.orders.findUniqueOrThrow({ where: { id: orderId } })).total_vnd)
    expect(pending[0]?.expectedVnd).toBe(total)
    expect(await repo.listPending(b.ctx, null)).toEqual([])

    const inbox = await getInbox({ ...a.ctx, capabilities: new Set(["F2"]) }, "ADMIN")
    const kinds = inbox.actions.filter((x) => x.orderId === orderId).map((x) => x.kind)
    expect(kinds).toEqual(["CANCELLED_REPORTED_PAYMENT"])

    // Tenant khác: 404, không lộ đơn
    await expect(repo.resolve(b.ctx, orderId, { outcome: "REFUNDED", amountVnd: total, note: "" })).rejects.toMatchObject({ code: "NOT_FOUND" })

    await repo.resolve(a.ctx, orderId, { outcome: "REFUNDED", amountVnd: total, note: "MB 123" })
    const ledger = await prisma.order_payments.findMany({ where: { order_id: orderId }, orderBy: { kind: "asc" } })
    expect(ledger.map((l) => [l.kind, Number(l.amount_vnd)])).toEqual([["DEPOSIT", total], ["REFUND", total]])
    const after = await prisma.orders.findUniqueOrThrow({ where: { id: orderId } })
    expect(Number(after.paid_vnd)).toBe(0)
    expect(await repo.listPending(a.ctx, null)).toEqual([])
    await expect(repo.resolve(a.ctx, orderId, { outcome: "NOT_RECEIVED", amountVnd: 0, note: "" })).rejects.toMatchObject({ code: "CONFLICT" })
    const audit = await prisma.audit_logs.findMany({ where: { organization_id: a.organizationId, action: "order.cancellation.reported_payment_checked" } })
    expect(audit).toHaveLength(1)
  })

  it("'Không nhận được tiền' đóng việc mà không ghi sổ thu", async () => {
    const orderId = await cancelledAfterReport(a)
    const repo = new ReportedPaymentCheckRepository()
    await repo.resolve(a.ctx, orderId, { outcome: "NOT_RECEIVED", amountVnd: 0, note: "Sao kê không có" })
    expect(await prisma.order_payments.count({ where: { order_id: orderId } })).toBe(0)
    expect(await repo.listPending(a.ctx, null)).toEqual([])
  })
})
