import { describe, expect, it } from "vitest"
import { availableSlots, deliveryScheduleError, earliestDeliveryDate, DELIVERY_SLOTS } from "@/modules/greeting-card/domain/delivery-schedule"
import { parseShippingConfig } from "@/modules/greeting-card/domain/brochure-pricing"
import { toShopContact, zaloChatUrl } from "@/modules/greeting-card/domain/shop-contact"
import { parsePaymentPolicy, paymentHoldUntil } from "@/modules/greeting-card/domain/brochure-payment-policy"
import { NOTIFY_EVENTS, smsText } from "@/modules/greeting-card/domain/customer-notifications"

// 10:00 sáng giờ VN = 03:00 UTC
const at = (vnHour: number) => new Date(Date.UTC(2026, 9, 20, vnHour - 7, 0, 0))
const TODAY = "2026-10-20"
const TOMORROW = "2026-10-21"

describe("giờ chốt đơn & thời gian chuẩn bị", () => {
  it("không cấu hình: hôm nay vẫn chọn được, chỉ bỏ khung đã qua", () => {
    expect(earliestDeliveryDate({}, at(10))).toBe(TODAY)
    expect(availableSlots(TODAY, {}, at(13))).toEqual(["Buổi chiều (13h - 17h)", "Buổi tối (18h - 21h)", "Giờ cụ thể (liên hệ)"])
  })

  it("qua giờ chốt: sớm nhất là ngày mai và báo lỗi rõ ràng", () => {
    const cfg = { sameDayCutoffHour: 16 }
    expect(earliestDeliveryDate(cfg, at(17))).toBe(TOMORROW)
    expect(deliveryScheduleError(TODAY, "Buổi tối (18h - 21h)", cfg, at(17))).toContain("16h")
    expect(deliveryScheduleError(TOMORROW, "Buổi sáng (8h - 12h)", cfg, at(17))).toBeNull()
  })

  it("thời gian chuẩn bị loại khung giờ không kịp", () => {
    const cfg = { prepHours: 3 }
    expect(availableSlots(TODAY, cfg, at(10))).not.toContain("Buổi sáng (8h - 12h)")
    expect(deliveryScheduleError(TODAY, "Buổi sáng (8h - 12h)", cfg, at(10))).toContain("Khung giờ")
    expect(deliveryScheduleError(TODAY, "Buổi chiều (13h - 17h)", cfg, at(10))).toBeNull()
  })

  it("ngày tương lai mở đủ khung giờ", () => {
    expect(availableSlots(TOMORROW, { sameDayCutoffHour: 8, prepHours: 5 }, at(20))).toHaveLength(DELIVERY_SLOTS.length)
  })

  it("đọc cấu hình từ settings, bỏ giá trị lạ", () => {
    const ok = parseShippingConfig({ brochure_shipping: { zones: [], same_day_cutoff_hour: 16, prep_hours: 2 } })
    expect(ok.sameDayCutoffHour).toBe(16)
    expect(ok.prepHours).toBe(2)
    const bad = parseShippingConfig({ brochure_shipping: { zones: [], same_day_cutoff_hour: 30, prep_hours: -1 } })
    expect(bad.sameDayCutoffHour).toBeUndefined()
    expect(bad.prepHours).toBeUndefined()
  })
})

describe("thông tin liên hệ cửa hàng", () => {
  it("link Zalo chỉ cho số di động VN", () => {
    expect(zaloChatUrl("0901 234 567")).toBe("https://zalo.me/0901234567")
    expect(zaloChatUrl("+84901234567")).toBe("https://zalo.me/0901234567")
    expect(zaloChatUrl("028 3822 1234")).toBeNull()
    expect(zaloChatUrl(null)).toBeNull()
  })

  it("chuẩn hoá SĐT và địa chỉ rỗng", () => {
    expect(toShopContact({ name: "Mộc Lan", phone: " 0901 234 567 ", address: "  ", logoUrl: null })).toEqual({
      name: "Mộc Lan",
      phone: "0901234567",
      zaloUrl: "https://zalo.me/0901234567",
      address: null,
      logoUrl: null,
    })
  })
})

describe("giữ đơn chờ chuyển khoản", () => {
  const created = new Date("2026-10-20T03:00:00Z")

  it("bật 30 phút → hạn giữ đơn đúng 30 phút sau khi đặt", () => {
    const policy = parsePaymentPolicy({ brochure_policy: { hold_minutes: 30 } })
    expect(paymentHoldUntil(policy, { paidVnd: 0, createdAt: created })).toBe("2026-10-20T03:30:00.000Z")
  })

  it("đã trả tiền hoặc tiệm không bật → không đếm ngược", () => {
    expect(paymentHoldUntil(parsePaymentPolicy({ brochure_policy: { hold_minutes: 30 } }), { paidVnd: 100, createdAt: created })).toBeNull()
    expect(paymentHoldUntil(parsePaymentPolicy({}), { paidVnd: 0, createdAt: created })).toBeNull()
    expect(parsePaymentPolicy({ brochure_policy: { hold_minutes: 2 } }).holdMinutes).toBeUndefined()
  })
})

describe("tin nhắn đã nhận đơn", () => {
  it("có mốc ORDER_RECEIVED, SMS không dấu kèm link theo dõi", () => {
    expect(NOTIFY_EVENTS[0]).toBe("ORDER_RECEIVED")
    const text = smsText("ORDER_RECEIVED", {
      order_code: "DH1", customer_name: "A", shop_name: "Moc Lan", status: "", amount: "", tracking_url: "https://x/b/T01-ABC",
    })
    expect(text).toContain("Da nhan don DH1")
    expect(text).toContain("https://x/b/T01-ABC")
  })
})
