import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("../order-scope", () => ({ assertOrderInScope: vi.fn().mockResolvedValue(undefined) }))
const queueOrderNotification = vi.fn()
vi.mock("../notify-customer", () => ({ queueOrderNotification: (...a: unknown[]) => queueOrderNotification(...a) }))

import { rejectReportedPayment } from "../reject-reported-payment"
import type { BrochureOrderRepository } from "../../infra/brochure-order-repository"
import type { GreetingCardRepository } from "../../infra/greeting-card-repository"
import type { TenantContext } from "@/core/tenancy"

const ctx: TenantContext = { organizationId: "org-1", userId: "u-1", workspaceId: "org-1", branchId: null, capabilities: new Set(["R11"]) }

function setup(order: Record<string, unknown> | null) {
  const orders = {
    findBrochureOrder: vi.fn().mockResolvedValue(order),
    applyProgress: vi.fn().mockResolvedValue({}),
  } as unknown as BrochureOrderRepository
  const repo = { updateSession: vi.fn().mockResolvedValue({}) } as unknown as GreetingCardRepository
  return { orders, repo }
}

const reported = {
  id: "o-1", code: "DH1", status: "CONFIRMED", paid_vnd: 0,
  greeting_sessions: [{ id: "s-1", status: "PAYMENT_REPORTED", payment_proof_asset_id: "a-1" }],
}

describe("rejectReportedPayment — Điều hành: chưa nhận được tiền", () => {
  beforeEach(() => queueOrderNotification.mockClear())

  it("bỏ báo chuyển khoản + bill, ghi lịch sử đơn và nhắc khách", async () => {
    const { orders, repo } = setup(reported)
    const res = await rejectReportedPayment(ctx, "o-1", { reason: "Chuyển thiếu" }, orders, repo)
    expect(repo.updateSession).toHaveBeenCalledWith("s-1", { status: "ORDER_SUBMITTED", paymentProofAssetId: null })
    expect(orders.applyProgress).toHaveBeenCalledWith(ctx, reported, expect.objectContaining({
      eventType: "PAYMENT_NOT_RECEIVED", noteAppend: expect.stringContaining("Chuyển thiếu"),
    }))
    expect(queueOrderNotification).toHaveBeenCalledWith("org-1", "o-1", "PAYMENT_REMINDER")
    expect(res.reason).toBe("Chuyển thiếu")
  })

  it("chặn khi sổ thu đã có tiền", async () => {
    const { orders, repo } = setup({ ...reported, paid_vnd: 234_000 })
    await expect(rejectReportedPayment(ctx, "o-1", {}, orders, repo)).rejects.toMatchObject({ status: 409 })
    expect(repo.updateSession).not.toHaveBeenCalled()
  })

  it("chặn khi khách chưa báo chuyển khoản", async () => {
    const { orders, repo } = setup({ ...reported, greeting_sessions: [{ id: "s-1", status: "ORDER_SUBMITTED", payment_proof_asset_id: null }] })
    await expect(rejectReportedPayment(ctx, "o-1", {}, orders, repo)).rejects.toMatchObject({ status: 409 })
  })

  it("Lần 1: ghi mốc từ chối vào pricing_rule_ref để khách có một hạn thanh toán mới", async () => {
    const { orders, repo } = setup({ ...reported, pricing_rule_ref: { quotedAt: "x" } })
    const at = new Date("2026-10-17T10:00:00Z")
    await rejectReportedPayment(ctx, "o-1", {}, orders, repo, at)
    expect(orders.applyProgress).toHaveBeenCalledWith(ctx, expect.anything(), expect.objectContaining({
      pricingRuleRef: { quotedAt: "x", paymentRejectedAt: at.toISOString() },
    }))
  })

  it("Lần 2 (đơn đã cọc, khách báo chuyển phần còn lại): bỏ bill lần 2, phiên về ORDER_SUBMITTED, nhắc khách", async () => {
    const balance = {
      id: "o-2", code: "DH2", status: "CONFIRMED", paid_vnd: 300_000, total_vnd: 1_000_000, pricing_rule_ref: null,
      greeting_sessions: [{ id: "s-2", status: "PAYMENT_REPORTED", payment_proof_asset_id: "a-1", payment_proof_balance_asset_id: "a-2" }],
    }
    const { orders, repo } = setup(balance)
    const res = await rejectReportedPayment(ctx, "o-2", { reason: "Chưa thấy tiền lần 2" }, orders, repo)
    expect(repo.updateSession).toHaveBeenCalledWith("s-2", { status: "ORDER_SUBMITTED", paymentProofBalanceAssetId: null })
    const progress = vi.mocked(orders.applyProgress).mock.calls[0]?.[2]
    expect(progress).toMatchObject({ eventType: "PAYMENT_NOT_RECEIVED", noteAppend: expect.stringContaining("lần 2") })
    expect(progress).not.toHaveProperty("pricingRuleRef")
    expect(queueOrderNotification).toHaveBeenCalledWith("org-1", "o-2", "PAYMENT_REMINDER")
    expect(res.payment).toBe("BALANCE")
  })

  it("đơn đã thu đủ → 409", async () => {
    const { orders, repo } = setup({ ...reported, paid_vnd: 500_000, total_vnd: 500_000 })
    await expect(rejectReportedPayment(ctx, "o-1", {}, orders, repo)).rejects.toMatchObject({ status: 409 })
  })

  it("đơn không thuộc tổ chức → 404", async () => {
    const { orders, repo } = setup(null)
    await expect(rejectReportedPayment(ctx, "o-x", {}, orders, repo)).rejects.toMatchObject({ status: 404 })
  })
})
