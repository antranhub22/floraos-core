import { describe, expect, it } from "vitest"
import {
  decisionCapabilities,
  resolveRefundVnd,
  validateCancellationProposal,
} from "@/modules/greeting-card/domain/cancellation-request"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { parseStorePolicies, DEFAULT_AGREEMENTS } from "@/modules/greeting-card/domain/store-policy"
import { safeImageUrl } from "@/modules/greeting-card/domain/shop-contact"

describe("resolveRefundVnd — máy chủ tự tính số hoàn", () => {
  it("Hủy đơn không hoàn luôn 0, kể cả client gửi số", () => {
    expect(resolveRefundVnd("CANCEL_ONLY", 500_000, 200_000, 300_000)).toBe(0)
  })
  it("Hoàn toàn phần = đúng số đã thu, bỏ qua số đề xuất 0", () => {
    expect(resolveRefundVnd("FULL_REFUND", 500_000, 0, undefined)).toBe(500_000)
  })
  it("Hoàn một phần ưu tiên số Điều hành chốt, không âm", () => {
    expect(resolveRefundVnd("PARTIAL_REFUND", 500_000, 200_000, 150_000)).toBe(150_000)
    expect(resolveRefundVnd("PARTIAL_REFUND", 500_000, 200_000, undefined)).toBe(200_000)
    expect(resolveRefundVnd("PARTIAL_REFUND", 500_000, -5, undefined)).toBe(0)
  })
})

describe("decisionCapabilities — trần cứng điều hành", () => {
  const caps = GREETING_CARD_CAPABILITY
  it("hủy đơn đòi R6, hoàn tiền đòi R10, hủy + hoàn đòi cả hai", () => {
    expect(decisionCapabilities("CANCEL_ONLY", caps)).toEqual(["R6"])
    expect(decisionCapabilities("PARTIAL_REFUND", caps)).toEqual(["R10"])
    expect(decisionCapabilities("FULL_REFUND", caps)).toEqual(["R6", "R10"])
  })
})

describe("validateCancellationProposal", () => {
  const order = { status: "CONFIRMED", totalVnd: 1_000_000, paidVnd: 500_000 }
  it("chặn hoàn một phần bằng/vượt số đã thu", () => {
    expect(validateCancellationProposal({ type: "PARTIAL_REFUND", reason: "Khách đổi ý", refundAmountVnd: 500_000 }, order)).not.toBeNull()
  })
  it("chặn đề xuất trên đơn đã hủy", () => {
    expect(validateCancellationProposal({ type: "CANCEL_ONLY", reason: "Trùng đơn", refundAmountVnd: 0 }, { ...order, status: "CANCELLED" })).not.toBeNull()
  })
  it("nhận hoàn một phần hợp lệ", () => {
    expect(validateCancellationProposal({ type: "PARTIAL_REFUND", reason: "Thiếu hoa", refundAmountVnd: 100_000 }, order)).toBeNull()
  })
})

describe("parseStorePolicies — dữ liệu hỏng không lọt ra trang công khai", () => {
  it("bỏ mục thiếu trường, rỗng thì dùng mặc định", () => {
    const parsed = parseStorePolicies({
      store_policies: {
        agreements: [{ id: "a", title: 1, customerText: "x" }, null],
        commitments: [{ id: "c1", title: "Đúng giờ", customerText: "Giao đúng khung giờ" }, { id: 2 }],
      },
    })
    expect(parsed.agreements).toEqual(DEFAULT_AGREEMENTS)
    expect(parsed.commitments).toEqual([{ id: "c1", title: "Đúng giờ", customerText: "Giao đúng khung giờ" }])
  })
})

describe("safeImageUrl", () => {
  it("chỉ nhận https hoặc đường dẫn nội bộ", () => {
    expect(safeImageUrl("/api/v1/assets/a/view")).toBe("/api/v1/assets/a/view")
    expect(safeImageUrl("https://cdn.example.com/qr.png")).toBe("https://cdn.example.com/qr.png")
    expect(safeImageUrl("javascript:alert(1)")).toBeNull()
    expect(safeImageUrl("//evil.example/qr.png")).toBeNull()
    expect(safeImageUrl("http://insecure.example/qr.png")).toBeNull()
    expect(safeImageUrl(42)).toBeNull()
  })
})
