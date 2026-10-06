import { describe, expect, it } from "vitest"
import { decideViewer, ownerCookieName } from "../session-owner"
import { BROWSING_EVENT_TYPES, isCustomerJourneyEvent, journeyEventType } from "../customer-journey-events"

describe("session-owner", () => {
  it("cookie đúng chữ ký luôn là chủ phiên; nhân viên tiệm chỉ xem trước", () => {
    expect(decideViewer({ tokenValid: true, claimed: true, staffOfShop: false })).toBe("OWNER")
    expect(decideViewer({ tokenValid: false, claimed: true, staffOfShop: true })).toBe("STAFF")
  })

  it("phiên chưa có chủ thì xin nhận; đã có chủ khác thì là người ngoài", () => {
    expect(decideViewer({ tokenValid: false, claimed: false, staffOfShop: false })).toBe("UNCLAIMED")
    expect(decideViewer({ tokenValid: false, claimed: true, staffOfShop: false })).toBe("OTHER")
  })

  it("tên cookie theo mã phiên, không phân biệt hoa thường", () => {
    expect(ownerCookieName("t01-abc")).toBe("fl_b_T01-ABC")
  })
})

describe("customer-journey-events", () => {
  it("chỉ nhận sự kiện trong danh sách; khách không tự báo đơn hoàn tất", () => {
    expect(isCustomerJourneyEvent("product_liked")).toBe(true)
    expect(isCustomerJourneyEvent("order_completed")).toBe(false)
    expect(isCustomerJourneyEvent("SUBMIT_ORDER")).toBe(false)
    expect(journeyEventType("contact_zalo_clicked")).toBe("CONTACT_ZALO_CLICKED")
  })

  it("dòng thời gian bỏ qua các bước lướt và mốc chủ phiên, giữ mốc nghiệp vụ", () => {
    expect(BROWSING_EVENT_TYPES).toContain("PRODUCT_VIEWED")
    expect(BROWSING_EVENT_TYPES).toContain("OWNER_CLAIMED")
    expect(BROWSING_EVENT_TYPES).not.toContain("SUBMIT_ORDER")
    expect(BROWSING_EVENT_TYPES).not.toContain("SELECT_PRODUCT")
  })
})
