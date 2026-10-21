import { describe, expect, it } from "vitest"
import { canAutoApproveForOrder, isCoordinatorRejectProposal } from "../cancellation-request"
import { coordinatorRejectBlocker } from "../brochure-commerce-rules"

describe("isCoordinatorRejectProposal — chỉ đề xuất từ chối nhận đơn mới được tự duyệt", () => {
  it("nhận diện theo payload.origin hoặc tiền tố lý do của bản ghi cũ", () => {
    expect(isCoordinatorRejectProposal({ origin: "COORDINATOR_REJECT", reason: "Hết hoa" })).toBe(true)
    expect(isCoordinatorRejectProposal({ reason: "[Điều phối từ chối nhận đơn] Hết hoa" })).toBe(true)
  })
  it("đề xuất huỷ / hoàn tiền thường của Điều phối → không", () => {
    expect(isCoordinatorRejectProposal({ type: "PARTIAL_REFUND", reason: "Khách phàn nàn hoa héo" })).toBe(false)
    expect(isCoordinatorRejectProposal(null)).toBe(false)
  })
})

describe("canAutoApproveForOrder — bộ quét bỏ qua đơn không thể tự huỷ", () => {
  it("đơn chờ nhận → được", () => {
    expect(canAutoApproveForOrder({ status: "DRAFT", deliveryStatus: "PENDING" })).toBe(true)
  })
  it("đã huỷ, đã hoàn tất, đã giao, đang giao → không", () => {
    expect(canAutoApproveForOrder({ status: "CANCELLED", deliveryStatus: "PENDING" })).toBe(false)
    expect(canAutoApproveForOrder({ status: "COMPLETED", deliveryStatus: "DELIVERED" })).toBe(false)
    expect(canAutoApproveForOrder({ status: "CONFIRMED", deliveryStatus: "DELIVERED" })).toBe(false)
    expect(canAutoApproveForOrder({ status: "CONFIRMED", deliveryStatus: "DISPATCHED" })).toBe(false)
    expect(canAutoApproveForOrder({ status: "CONFIRMED", deliveryStatus: "DELIVERING" })).toBe(false)
  })
})

describe("coordinatorRejectBlocker — chỉ từ chối nhận đơn khi đơn còn chờ nhận", () => {
  it("đơn chờ nhận (kể cả chưa có tiền) → được từ chối", () => {
    expect(coordinatorRejectBlocker({ status: "DRAFT", productionStatus: "WAITING", deliveryStatus: "PENDING" })).toBeNull()
  })
  it("đơn đã nhận / đang cắm / đang giao → chặn, hướng dẫn dùng Đề xuất Hủy / Hoàn tiền", () => {
    for (const s of [
      { status: "CONFIRMED", productionStatus: "WAITING", deliveryStatus: "PENDING" },
      { status: "DRAFT", productionStatus: "ARRANGING", deliveryStatus: "PENDING" },
      { status: "PROCESSING", productionStatus: "READY", deliveryStatus: "DISPATCHED" },
    ]) {
      expect(coordinatorRejectBlocker(s)).toMatch(/Đề xuất Hủy \/ Hoàn tiền/)
    }
  })
  it("đơn đã huỷ → chặn", () => {
    expect(coordinatorRejectBlocker({ status: "CANCELLED", productionStatus: "WAITING", deliveryStatus: "PENDING" })).toBe("Đơn hàng đã huỷ")
  })
})
