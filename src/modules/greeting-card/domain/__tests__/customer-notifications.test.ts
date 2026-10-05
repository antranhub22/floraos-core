import { describe, it, expect } from "vitest"
import { maskPhone, paymentNotifyEvent, smsText, toInternationalPhone } from "../customer-notifications"

describe("customer notifications", () => {
  it("chuẩn hoá SĐT VN sang 84…, từ chối số lạ", () => {
    expect(toInternationalPhone("0912 345 678")).toBe("84912345678")
    expect(toInternationalPhone("+84912345678")).toBe("84912345678")
    expect(toInternationalPhone("12345")).toBeNull()
    expect(maskPhone("84912345678")).toBe("84912***678")
  })
  it("SMS không dấu, có link theo dõi", () => {
    const text = smsText("DELIVERED", {
      order_code: "DH261005-ABCD1234", customer_name: "Lan", shop_name: "Tiệm Hoa Đà Lạt",
      status: "", amount: "", tracking_url: "https://x.vn/b/T01-AAAA",
    })
    expect(text).toBe("Tiem Hoa Da Lat: Don DH261005-ABCD1234 da giao thanh cong. Cam on quy khach! Theo doi: https://x.vn/b/T01-AAAA")
  })
  it("thu chưa đủ là cọc, thu đủ là hoàn tất", () => {
    expect(paymentNotifyEvent(100)).toBe("DEPOSIT_RECEIVED")
    expect(paymentNotifyEvent(0)).toBe("PAYMENT_COMPLETED")
  })
})
