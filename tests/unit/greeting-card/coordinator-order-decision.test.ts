import { describe, expect, it, vi } from "vitest"
import type { TenantContext } from "@/core/tenancy"
import { coordinatorAcceptBrochureOrder, coordinatorRejectBrochureOrder } from "@/modules/greeting-card/use-cases/update-brochure-order-status"
import { adminConfirmBrochurePayment } from "@/modules/greeting-card/use-cases/confirm-brochure-payment"
import { coordinatorAcceptanceBlocker } from "@/modules/greeting-card/domain/brochure-commerce-rules"
import type { BrochureOrderRepository } from "@/modules/greeting-card/infra/brochure-order-repository"
import type { CancellationRepository } from "@/modules/greeting-card/infra/cancellation-repository"
import type { BrochurePaymentRepository } from "@/modules/greeting-card/infra/brochure-payment-repository"
import type { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"

const ctx: TenantContext = {
  organizationId: "org-test",
  workspaceId: "",
  userId: "user-coordinator",
  branchId: null,
  capabilities: new Set(["R4", "R6", "R11"]),
}

describe("Điều phối tiếp nhận và từ chối đơn hàng", () => {
  it("Điều phối tiếp nhận đơn thành công → chuyển sang ASSIGNED và gửi thông báo", async () => {
    const mockOrder = {
      id: "order-1",
      code: "DH-1",
      status: "DRAFT",
      production_status: "WAITING",
      delivery_status: "PENDING",
      total_vnd: 500_000,
      paid_vnd: 0,
    }

    const mockRepo = {
      findBrochureOrder: vi.fn().mockResolvedValue(mockOrder),
      applyProgress: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as BrochureOrderRepository

    const result = await coordinatorAcceptBrochureOrder(
      ctx,
      "order-1",
      { note: "Đủ hoa lan, tiếp nhận đơn" },
      mockRepo
    )

    expect(result).toEqual({ success: true })
    expect(mockRepo.applyProgress).toHaveBeenCalledWith(
      ctx,
      mockOrder,
      expect.objectContaining({
        eventType: "COORDINATOR_ACCEPTED",
        productionStatus: "ASSIGNED",
        orderStatus: "CONFIRMED",
        noteAppend: "[Điều phối tiếp nhận] Đủ hoa lan, tiếp nhận đơn",
      })
    )
  })

  it("Điều phối từ chối nhận đơn → huỷ đơn và kích hoạt hoàn tiền cho khách", async () => {
    const mockOrder = {
      id: "order-2",
      code: "DH-2",
      status: "DRAFT",
      production_status: "WAITING",
      delivery_status: "PENDING",
      total_vnd: 700_000,
      paid_vnd: 700_000,
    }

    const mockRepo = {
      findBrochureOrder: vi.fn().mockResolvedValue(mockOrder),
    } as unknown as BrochureOrderRepository

    const mockCancellationRepo = {
      getOrderSummary: vi.fn().mockResolvedValue({
        id: "order-2",
        code: "DH-2",
        status: "CONFIRMED",
        productionStatus: "WAITING",
        deliveryStatus: "PENDING",
        totalVnd: 500_000,
        paidVnd: 200_000,
        balanceVnd: 300_000,
      }),
      createProposal: vi.fn().mockResolvedValue({
        id: "req-1",
        payload: {},
      }),
    } as unknown as CancellationRepository

    const result = await coordinatorRejectBrochureOrder(
      ctx,
      "order-2",
      { reason: "Hết hoa tươi cùng tông màu" },
      mockCancellationRepo,
      mockRepo
    )

    expect(result).toEqual({
      success: true,
      message: "Đã gửi yêu cầu từ chối nhận đơn và hoàn tiền tới Điều hành xét duyệt.",
      proposalId: "req-1",
    })
    expect(mockCancellationRepo.createProposal).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        orderId: "order-2",
        senderRole: "COORDINATOR",
        proposal: expect.objectContaining({
          type: "FULL_REFUND",
          reason: expect.stringContaining("Hết hoa tươi cùng tông màu"),
        }),
      })
    )
  })

  it("Xác nhận thanh toán gắn đúng tag MANUAL_ADMIN và AUTO_SYSTEM_15M", async () => {
    const mockOrder = {
      id: "order-3",
      code: "DH-3",
      status: "DRAFT",
      pricing_rule_ref: null,
      total_vnd: 500_000,
      paid_vnd: 0,
      source_session_id: null,
    }

    const mockOrders = {
      findBrochureOrder: vi.fn().mockResolvedValue(mockOrder),
    } as unknown as BrochureOrderRepository

    const mockGreetingRepo = {
      getShopProfile: vi.fn().mockResolvedValue({ settings: {} }),
      findSessionById: vi.fn().mockResolvedValue(null),
    } as unknown as GreetingCardRepository

    const mockPayments = {
      recordIncomingPayment: vi.fn().mockResolvedValue({
        orderId: "order-3",
        balanceVnd: 0,
      }),
    } as unknown as BrochurePaymentRepository

    // 1. Thao tác tự động sau 15 phút
    await adminConfirmBrochurePayment(
      ctx,
      "order-3",
      { confirmationType: "AUTO_SYSTEM_15M" },
      mockPayments,
      mockOrders,
      mockGreetingRepo
    )

    expect(mockPayments.recordIncomingPayment).toHaveBeenCalledWith(
      ctx,
      "order-3",
      expect.objectContaining({
        reference: "AUTO_SYSTEM_15M",
        note: "Hệ thống tự động xác nhận chuyển khoản sau 15 phút (có ảnh bill hợp lệ)",
      })
    )

    // 2. Thao tác điều hành duyệt tay
    await adminConfirmBrochurePayment(
      ctx,
      "order-3",
      { confirmationType: "MANUAL_ADMIN" },
      mockPayments,
      mockOrders,
      mockGreetingRepo
    )

    expect(mockPayments.recordIncomingPayment).toHaveBeenCalledWith(
      ctx,
      "order-3",
      expect.objectContaining({
        reference: "BROCHURE-order-3",
        note: "Xác nhận chuyển khoản qua Thẻ chào (Điều hành duyệt)",
      })
    )
  })

  it("coordinatorAcceptanceBlocker cho phép nhận đơn khi có ảnh CK hoặc đã nhận tiền", () => {
    // 1. Chưa có ảnh và chưa có tiền -> Chặn
    expect(
      coordinatorAcceptanceBlocker(
        { status: "DRAFT", productionStatus: "WAITING", deliveryStatus: "PENDING" },
        { paidVnd: 0, paymentProofUrl: null }
      )
    ).toBe("Chưa có thông tin chuyển khoản từ khách")

    // 2. Khách vừa gửi ảnh chuyển khoản (tiền chưa vào hoặc điều hành chưa bấm duyệt) -> Cho phép Điều phối nhận đơn!
    expect(
      coordinatorAcceptanceBlocker(
        { status: "DRAFT", productionStatus: "WAITING", deliveryStatus: "PENDING" },
        { paidVnd: 0, paymentProofUrl: "https://r2.floraos.vn/proof.jpg" }
      )
    ).toBeNull()

    // 3. Đã có tiền -> Cho phép Điều phối nhận đơn
    expect(
      coordinatorAcceptanceBlocker(
        { status: "DRAFT", productionStatus: "WAITING", deliveryStatus: "PENDING" },
        { paidVnd: 500_000, paymentProofUrl: null }
      )
    ).toBeNull()

    // 4. Đơn đã CONFIRMED -> Không cần nhận nữa
    expect(
      coordinatorAcceptanceBlocker(
        { status: "CONFIRMED", productionStatus: "WAITING", deliveryStatus: "PENDING" },
        { paidVnd: 500_000, paymentProofUrl: "https://r2.floraos.vn/proof.jpg" }
      )
    ).toBe("Đơn đã được xác nhận nhận đơn")

    // 5. Đơn đã vào sản xuất (ASSIGNED / ARRANGING) -> Không hiện nút nhận đơn nữa
    expect(
      coordinatorAcceptanceBlocker(
        { status: "DRAFT", productionStatus: "ARRANGING", deliveryStatus: "PENDING" },
        { paidVnd: 500_000, paymentProofUrl: "https://r2.floraos.vn/proof.jpg" }
      )
    ).toBe("Đơn đã vào sản xuất")
  })
})
