import { randomUUID } from "node:crypto"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { CancellationRepository } from "@/modules/greeting-card/infra/cancellation-repository"

import { disconnectDatabase, prisma, resetDatabase } from "../helpers/database"
import { createTenant, type Tenant } from "../helpers/fixtures"

/** Đề xuất Hủy/Hoàn tiền Thẻ chào (08/10/2026): cách ly tổ chức + số hoàn do máy chủ tính. */
describe("đề xuất hủy / hoàn tiền Thẻ chào", () => {
  let a: Tenant
  let b: Tenant
  const repo = new CancellationRepository()

  beforeEach(async () => {
    await resetDatabase()
    a = await createTenant("alpha")
    b = await createTenant("beta")
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  async function order(t: Tenant, paid: number, total = 500_000) {
    const id = randomUUID()
    await prisma.orders.create({
      data: {
        id, organization_id: t.organizationId, code: `DH-${id.slice(0, 6)}`, source: "BROCHURE", status: "CONFIRMED",
        total_vnd: total, paid_vnd: paid, balance_vnd: total - paid, created_by: t.userId,
      },
    })
    return id
  }

  it("tổ chức khác không đề xuất, không thấy, không duyệt được (404)", async () => {
    const orderId = await order(a, 300_000)
    await expect(repo.createProposal(b.ctx, {
      orderId, senderRole: "SALE", proposal: { type: "CANCEL_ONLY", reason: "Khách đổi ý", refundAmountVnd: 0 },
    })).rejects.toMatchObject({ code: "NOT_FOUND" })

    const { id } = await repo.createProposal(a.ctx, {
      orderId, senderRole: "SALE", proposal: { type: "CANCEL_ONLY", reason: "Khách đổi ý", refundAmountVnd: 0 },
    })
    expect(await repo.listPending(b.ctx)).toHaveLength(0)
    expect(await repo.getPendingType(b.ctx, id)).toBeNull()
    await expect(repo.decide(b.ctx, { requestId: id, approve: true, note: "" })).rejects.toMatchObject({ code: "NOT_FOUND" })
    const after = await prisma.orders.findUniqueOrThrow({ where: { id: orderId } })
    expect(after.status).toBe("CONFIRMED")
  })

  it("hoàn toàn phần hoàn đúng số đã thu dù đề xuất gửi 0đ, và chỉ duyệt được một lần", async () => {
    const orderId = await order(a, 300_000)
    const { id } = await repo.createProposal(a.ctx, {
      orderId, senderRole: "COORDINATOR", proposal: { type: "FULL_REFUND", reason: "Hết hoa", refundAmountVnd: 0 },
    })
    expect(await repo.getPendingType(a.ctx, id)).toBe("FULL_REFUND")

    const res = await repo.decide(a.ctx, { requestId: id, approve: true, note: "", actualRefundVnd: 1 })
    expect(res).toMatchObject({ status: "APPROVED", orderStatus: "CANCELLED", refundVnd: 300_000 })

    const after = await prisma.orders.findUniqueOrThrow({ where: { id: orderId } })
    expect(Number(after.paid_vnd)).toBe(0)
    expect(after.status).toBe("CANCELLED")
    const refunds = await prisma.order_payments.findMany({ where: { order_id: orderId, kind: "REFUND" } })
    expect(refunds.map((r) => Number(r.amount_vnd))).toEqual([300_000])

    await expect(repo.decide(a.ctx, { requestId: id, approve: true, note: "" })).rejects.toMatchObject({ code: "CONFLICT" })
  })

  it("hủy đơn không hoàn không ghi sổ thu dù client gửi số hoàn", async () => {
    const orderId = await order(a, 200_000)
    const { id } = await repo.createProposal(a.ctx, {
      orderId, senderRole: "SALE", proposal: { type: "CANCEL_ONLY", reason: "Trùng đơn", refundAmountVnd: 0 },
    })
    const res = await repo.decide(a.ctx, { requestId: id, approve: true, note: "", actualRefundVnd: 200_000 })
    expect(res.refundVnd).toBe(0)
    expect(await prisma.order_payments.count({ where: { order_id: orderId } })).toBe(0)
  })
})
