import { describe, expect, it } from "vitest"
import { claimOrderAction, type PipelineLike } from "../inbox"
import {
  cancelledNotifyAction, dismissalRequestActions, needsSaleCustomerNotice, saleNotifiedOf, COORDINATOR_CANCEL_SWEEP_ACTOR,
} from "../inbox-follow-ups"

const NOW = new Date("2026-10-17T05:00:00.000Z")

const link: PipelineLike = {
  id: "session-s1", type: "SESSION", orderId: null, sessionId: "s1", orderCode: null, sendCode: "T01-001",
  customerName: "Chị Lan", productName: "Bó hồng", totalVnd: 500_000, currentStepId: "STEP_2_CHOOSING", currentStepTitle: "",
  stepStartedAt: NOW.toISOString(), stuck: null, saleId: "sale-1",
}

describe("dismissalRequestActions — đề xuất bỏ hiển thị vào Hộp việc", () => {
  const pending = { status: "PENDING" as const, reason: "Khách chỉ vào khảo giá", proposedBy: "sale-1", proposedByName: "Mai", proposedAt: new Date(NOW.getTime() - 2 * 60_000).toISOString() }

  it("đề xuất đang chờ → một việc DISMISSAL_REQUEST kèm đích duyệt đúng loại (link/đơn)", () => {
    const order: PipelineLike = { ...link, id: "o1", type: "ORDER", orderId: "o1", orderCode: "DH1", dismissal: pending }
    const out = dismissalRequestActions([{ ...link, dismissal: pending }, order], NOW)
    expect(out.map((a) => a.kind)).toEqual(["DISMISSAL_REQUEST", "DISMISSAL_REQUEST"])
    expect(out[0]?.dismissalRequest).toEqual({ targetId: "s1", type: "SESSION", proposedAt: pending.proposedAt })
    expect(out[1]?.dismissalRequest?.targetId).toBe("o1")
    expect(out[0]?.detail).toContain("Mai: Khách chỉ vào khảo giá")
    expect(out[0]?.detail).toContain("tự duyệt sau 3 phút")
  })

  it("đã duyệt / bị từ chối / không có đề xuất → không có việc", () => {
    expect(dismissalRequestActions([link, { ...link, dismissal: { ...pending, status: "APPROVED" } }, { ...link, dismissal: { ...pending, status: "REJECTED" } }], NOW)).toEqual([])
  })
})

describe("claimOrderAction", () => {
  it("việc nhận đơn mang mã đơn và mở tab Bán hàng", () => {
    const a = claimOrderAction({ id: "o9", orderId: "o9", sessionId: "s9", orderCode: "DH9", sendCode: "PUB-1", customerName: "Anh Tú", productName: "Giỏ lan" })
    expect(a).toMatchObject({ id: "claim-order:o9", kind: "CLAIM_ORDER", orderId: "o9", tab: "sales" })
    expect(a.detail).toBe("Đơn DH9 · Anh Tú · Giỏ lan")
  })
})

describe("needsSaleCustomerNotice — đơn bị huỷ nào Sale phải báo khách", () => {
  const base = { cancelledAt: new Date(NOW.getTime() - 30 * 60_000), cancelledBy: "admin-1", pricingRuleRef: {} }

  it("nhân viên huỷ hoặc bộ quét tự duyệt đề xuất huỷ của Điều phối → cần báo khách", () => {
    expect(needsSaleCustomerNotice(base, NOW)).toBe(true)
    expect(needsSaleCustomerNotice({ ...base, cancelledBy: COORDINATOR_CANCEL_SWEEP_ACTOR }, NOW)).toBe(true)
  })

  it("hệ thống tự huỷ vì quá hạn thanh toán/giữ chỗ, đơn bỏ hiển thị, đã báo, quá 7 ngày → không nhắc", () => {
    expect(needsSaleCustomerNotice({ ...base, cancelledBy: "system:hold-expiry" }, NOW)).toBe(false)
    expect(needsSaleCustomerNotice({ ...base, cancelledBy: null }, NOW)).toBe(false)
    expect(needsSaleCustomerNotice({ ...base, pricingRuleRef: { paymentFailed: { reason: "PAYMENT_TIMEOUT" } } }, NOW)).toBe(false)
    expect(needsSaleCustomerNotice({ ...base, pricingRuleRef: { dismissal: { status: "APPROVED", reason: "x", proposedBy: "a", proposedAt: "t" } } }, NOW)).toBe(false)
    expect(needsSaleCustomerNotice({ ...base, pricingRuleRef: { saleNotifiedCustomer: { by: "sale-1", at: NOW.toISOString() } } }, NOW)).toBe(false)
    expect(needsSaleCustomerNotice({ ...base, cancelledAt: new Date(NOW.getTime() - 8 * 86_400_000) }, NOW)).toBe(false)
    expect(needsSaleCustomerNotice({ ...base, cancelledAt: null }, NOW)).toBe(false)
  })

  it("đọc dấu đã báo khách phòng thủ", () => {
    expect(saleNotifiedOf(null)).toBeNull()
    expect(saleNotifiedOf({ saleNotifiedCustomer: { by: 1 } })).toBeNull()
    expect(saleNotifiedOf({ saleNotifiedCustomer: { by: "u", at: "t" } })).toEqual({ by: "u", at: "t" })
  })
})

describe("cancelledNotifyAction — hạn 2 tiếng", () => {
  const row = { orderId: "o1", code: "DH77", sessionId: "s1", customerName: "Chị Lan" }

  it("còn hạn: ghi giờ hạn theo giờ Việt Nam, chưa gấp như việc kẹt", () => {
    const a = cancelledNotifyAction({ ...row, cancelledAt: new Date(NOW.getTime() - 30 * 60_000) }, NOW)
    expect(a.title).toBe("Báo khách: đơn #DH77 đã bị huỷ")
    expect(a.detail).toBe("Gọi/nhắn khách trước 13:30 ngày 17/10")
    expect(a.urgency).toBe(900)
    expect(a.customerNotice).toEqual({ orderId: "o1", deadline: "2026-10-17T06:30:00.000Z" })
    expect(a.tab).toBe("sales")
  })

  it("quá hạn: lên đầu như việc kẹt, càng trễ càng gấp", () => {
    const a = cancelledNotifyAction({ ...row, cancelledAt: new Date(NOW.getTime() - 3 * 3_600_000) }, NOW)
    expect(a.detail).toContain("Đã quá hạn báo khách")
    expect(a.urgency).toBe(1060)
  })
})
