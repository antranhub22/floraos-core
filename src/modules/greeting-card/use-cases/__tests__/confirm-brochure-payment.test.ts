import { describe, it, expect, vi } from "vitest"
import { adminConfirmBrochurePayment } from "../confirm-brochure-payment"
import type { TenantContext } from "@/core/tenancy"
import type { BrochureOrderRepository } from "../../infra/brochure-order-repository"
import type { BrochurePaymentRepository } from "../../infra/brochure-payment-repository"
import type { GreetingCardRepository } from "../../infra/greeting-card-repository"

const ctx: TenantContext = {
  tenantId: "org-1",
  organizationId: "org-1",
  userId: "user-admin",
  roles: ["ORGANIZATION_ADMIN"],
  permissions: [],
}

function createMockServices(orderOverrides: Record<string, unknown> = {}, shopSettings: Record<string, unknown> = {}) {
  const defaultOrder = {
    id: "order-1",
    code: "DH001",
    organization_id: "org-1",
    source: "BROCHURE",
    status: "CONFIRMED",
    production_status: "WAITING",
    delivery_status: "PENDING",
    total_vnd: BigInt(1_000_000),
    paid_vnd: BigInt(0),
    pricing_rule_ref: { paymentPlan: { policy: "DEPOSIT_50", depositPercent: 50, source: "PAYMENT_CODE", paymentCode: "DC50" } },
    greeting_sessions: [{ send_code: "SL-TEST", status: "PENDING" }],
    qc_records: [],
    ...orderOverrides,
  }

  const orders = {
    findBrochureOrder: vi.fn().mockResolvedValue(defaultOrder),
  } as unknown as BrochureOrderRepository

  const repo = {
    getShopProfile: vi.fn().mockResolvedValue({
      organization_id: "org-1",
      settings: {
        brochure_policy: { deposit_percent: 0, require_full_before_dispatch: true },
        ...shopSettings,
      },
    }),
  } as unknown as GreetingCardRepository

  const payments = {
    recordIncomingPayment: vi.fn().mockResolvedValue({
      order: { id: "order-1", total_vnd: 1_000_000, paid_vnd: 500_000, status: "CONFIRMED" },
      payment: { id: "pay-1", amount_vnd: 500_000 },
      isFirstDeposit: true,
    }),
  } as unknown as BrochurePaymentRepository

  return { orders, repo, payments }
}

describe("adminConfirmBrochurePayment — bảo vệ đơn đặt cọc không bị thu 2 lần sớm", () => {
  it("Lần 1: Thu tiền cọc cho đơn cọc 50% khi chưa thanh toán gì → thành công", async () => {
    const { orders, repo, payments } = createMockServices()
    const res = await adminConfirmBrochurePayment(ctx, "order-1", {}, payments, orders, repo)
    expect(res.payment.amount_vnd).toBe(500_000)
    expect(payments.recordIncomingPayment).toHaveBeenCalledWith(
      ctx,
      "order-1",
      expect.objectContaining({ amountVnd: 500_000 })
    )
  })

  it("Lần 2 (Thu trước giao): Chặn khi hoa chưa xong (production_status != READY)", async () => {
    const { orders, repo, payments } = createMockServices({
      paid_vnd: BigInt(500_000),
      production_status: "ARRANGING",
    })
    await expect(adminConfirmBrochurePayment(ctx, "order-1", {}, payments, orders, repo)).rejects.toThrow(
      /hoàn thành cắm hoa/i
    )
  })

  it("Lần 2 (Thu trước giao): Chặn khi hoa đã READY nhưng chưa duyệt ảnh và chưa quá 10 phút", async () => {
    const { orders, repo, payments } = createMockServices({
      paid_vnd: BigInt(500_000),
      production_status: "READY",
      qc_records: [
        { notes: "PRODUCT_PHOTO_UPLOADED", created_at: new Date(Date.now() - 2 * 60_000) }, // mới up 2 phút
      ],
    })
    await expect(adminConfirmBrochurePayment(ctx, "order-1", {}, payments, orders, repo)).rejects.toThrow(
      /chờ khách duyệt ảnh thành phẩm/i
    )
  })

  it("Lần 2 (Thu trước giao): Cho phép khi hoa READY và khách đã duyệt ảnh", async () => {
    const { orders, repo, payments } = createMockServices({
      paid_vnd: BigInt(500_000),
      production_status: "READY",
      qc_records: [{ notes: "CUSTOMER_PHOTO_APPROVED", created_at: new Date() }],
    })
    await adminConfirmBrochurePayment(ctx, "order-1", {}, payments, orders, repo)
    expect(payments.recordIncomingPayment).toHaveBeenCalledWith(
      ctx,
      "order-1",
      expect.objectContaining({ amountVnd: 500_000 })
    )
  })

  it("Lần 2 (Thu trước giao): Cho phép khi hoa READY và ảnh up đã quá 10 phút (auto-approved)", async () => {
    const { orders, repo, payments } = createMockServices({
      paid_vnd: BigInt(500_000),
      production_status: "READY",
      qc_records: [
        { notes: "PRODUCT_PHOTO_UPLOADED", created_at: new Date(Date.now() - 11 * 60_000) }, // up 11 phút trước
      ],
    })
    await adminConfirmBrochurePayment(ctx, "order-1", {}, payments, orders, repo)
    expect(payments.recordIncomingPayment).toHaveBeenCalledWith(
      ctx,
      "order-1",
      expect.objectContaining({ amountVnd: 500_000 })
    )
  })

  it("Lần 2 (Thu sau giao): Chặn khi chưa giao hàng (delivery_status != DELIVERED)", async () => {
    const { orders, repo, payments } = createMockServices(
      {
        paid_vnd: BigInt(500_000),
        delivery_status: "PENDING",
      },
      {
        brochure_policy: { deposit_percent: 0, require_full_before_dispatch: false },
      }
    )
    await expect(adminConfirmBrochurePayment(ctx, "order-1", {}, payments, orders, repo)).rejects.toThrow(
      /thu sau khi giao hoa thành công/i
    )
  })

  it("Lần 2 (Thu sau giao): Cho phép khi đã giao hàng (delivery_status = DELIVERED)", async () => {
    const { orders, repo, payments } = createMockServices(
      {
        paid_vnd: BigInt(500_000),
        delivery_status: "DELIVERED",
      },
      {
        brochure_policy: { deposit_percent: 0, require_full_before_dispatch: false },
      }
    )
    await adminConfirmBrochurePayment(ctx, "order-1", {}, payments, orders, repo)
    expect(payments.recordIncomingPayment).toHaveBeenCalledWith(
      ctx,
      "order-1",
      expect.objectContaining({ amountVnd: 500_000 })
    )
  })
})
