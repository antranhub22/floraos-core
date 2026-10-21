import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { disconnectDatabase, resetDatabase } from "../helpers/database"
import { createTenant, type Tenant } from "../helpers/fixtures"
import { prisma } from "@/core/tenancy/infra/prisma"
import { flushBackground } from "@/core/runtime/background"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { ProductRepository } from "@/modules/products/infra/product-repository"
import { BrochurePaymentRepository } from "@/modules/greeting-card/infra/brochure-payment-repository"
import { createSendLink } from "@/modules/greeting-card/use-cases/create-send-link"
import { submitBrochureOrder } from "@/modules/greeting-card/use-cases/submit-brochure-order"
import { selectBrochureProduct } from "@/modules/greeting-card/use-cases/select-brochure-product"
import { reportCustomerPayment } from "@/modules/greeting-card/use-cases/confirm-brochure-payment"
import { rejectReportedPayment } from "@/modules/greeting-card/use-cases/reject-reported-payment"
import { runBackgroundSweep } from "@/modules/greeting-card/use-cases/background-sweep"

/**
 * "Chưa nhận được tiền" (PO 17/10/2026): Lần 1 sau hạn thanh toán cho khách thêm MỘT hạn mới (không tự huỷ
 * ~1 phút sau); Lần 2 (đơn đã cọc) cũng từ chối được. Tổ chức khác → 404.
 */
const ORDER = {
  customerName: "K", customerPhone: "0987654321", recipientName: "N", recipientPhone: "0912345678",
  confirmedTerms: true, deliveryDate: new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10), deliveryAddress: "1 Lê Lợi, Q1",
}

describe("greeting-card: Điều hành báo chưa nhận được tiền", () => {
  let a: Tenant
  let b: Tenant

  beforeEach(async () => {
    await resetDatabase()
    a = await createTenant("alpha")
    b = await createTenant("beta")
    await prisma.organizations.update({
      where: { id: a.organizationId },
      data: { settings: { brochure_policy: { deposit_percent: 0, payment_timeout_minutes: 30, require_payment_proof: false } } },
    })
  })

  afterAll(async () => {
    await flushBackground()
    await disconnectDatabase()
  })

  async function place(code: string) {
    const product = await new ProductRepository().create(a.ctx, { code: `HOA-${code}`, name: "Bó hồng", attributes: { price: 1_000_000 } })
    const catalog = await new GreetingCardRepository().createCatalog(a.ctx, { code, name: code, productIds: [product.id], createdBy: a.userId })
    const link = await createSendLink(a.ctx, { catalogId: catalog.id })
    await selectBrochureProduct(link.sendCode, product.id)
    const placed = await submitBrochureOrder(link.sendCode, ORDER)
    return { ...placed, sendCode: link.sendCode }
  }

  it("Lần 1 sau hạn: đơn không bị huỷ ở lượt quét kế tiếp; hết hạn mới mới huỷ", async () => {
    const placed = await place("r1")
    await reportCustomerPayment(placed.sendCode)
    const rejectedAt = new Date(Date.now() + 40 * 60_000) // đã qua hạn gốc 30 phút
    await expect(rejectReportedPayment(b.ctx, placed.orderId, {}, undefined, undefined, rejectedAt)).rejects.toMatchObject({ code: "NOT_FOUND" })
    await rejectReportedPayment(a.ctx, placed.orderId, { reason: "Không thấy tiền" }, undefined, undefined, rejectedAt)

    const row = await prisma.orders.findUniqueOrThrow({ where: { id: placed.orderId } })
    expect(row.pricing_rule_ref).toMatchObject({ paymentRejectedAt: rejectedAt.toISOString() })
    expect((await prisma.greeting_sessions.findFirstOrThrow({ where: { send_code: placed.sendCode } })).status).toBe("ORDER_SUBMITTED")

    await runBackgroundSweep(new Date(rejectedAt.getTime() + 60_000))
    expect((await prisma.orders.findUniqueOrThrow({ where: { id: placed.orderId } })).status).toBe("DRAFT")

    await runBackgroundSweep(new Date(rejectedAt.getTime() + 31 * 60_000))
    expect((await prisma.orders.findUniqueOrThrow({ where: { id: placed.orderId } })).status).toBe("CANCELLED")
  })

  it("Lần 2: đơn đã cọc, khách báo chuyển phần còn lại → bỏ bill lần 2, phiên về chờ, ghi sự kiện", async () => {
    const placed = await place("r2")
    await new BrochurePaymentRepository().recordIncomingPayment(a.ctx, placed.orderId, {
      amountVnd: 300_000, method: "BANK_TRANSFER", reference: "CK-1", note: "Cọc",
    })
    const session = await prisma.greeting_sessions.findFirstOrThrow({ where: { send_code: placed.sendCode } })
    await prisma.greeting_sessions.update({ where: { id: session.id }, data: { status: "PAYMENT_REPORTED", payment_proof_balance_asset_id: null } })

    const res = await rejectReportedPayment(a.ctx, placed.orderId, { reason: "Chưa thấy tiền lần 2" })
    expect(res.payment).toBe("BALANCE")
    const after = await prisma.greeting_sessions.findUniqueOrThrow({ where: { id: session.id } })
    expect(after.status).toBe("ORDER_SUBMITTED")
    expect(after.payment_proof_balance_asset_id).toBeNull()
    const events = await prisma.order_events.findMany({ where: { order_id: placed.orderId, reason: "PAYMENT_NOT_RECEIVED" } })
    expect(events).toHaveLength(1)
    expect(Number((await prisma.orders.findUniqueOrThrow({ where: { id: placed.orderId } })).paid_vnd)).toBe(300_000)

    // Báo lại lần nữa khi khách chưa báo → 409
    await expect(rejectReportedPayment(a.ctx, placed.orderId, {})).rejects.toMatchObject({ code: "CONFLICT" })
  })
})
