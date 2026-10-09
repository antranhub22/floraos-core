import { describe, it, expect } from "vitest"
import { customerSecondPaymentReminderMessage, maskPhone, paymentNotifyEvent, smsText, toInternationalPhone } from "../customer-notifications"

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
  it("SMS READY khi có nợ cọc (isBalanceDue: true) nhắc thanh toán lần 2 để giao hoa", () => {
    const text = smsText("READY", {
      order_code: "DH123", customer_name: "Minh", shop_name: "Flora",
      status: "", amount: "700.000 đ", tracking_url: "https://x.vn/b/T1",
    }, { isBalanceDue: true })
    expect(text).toBe("Flora: Hoa don DH123 da cam xong. Mo link xem anh va thanh toan 700.000 d con lai de giao hoa. Theo doi: https://x.vn/b/T1")
  })
  it("SMS DELIVERED khi có nợ cọc (isBalanceDue: true) nhắc thanh toán nốt", () => {
    const text = smsText("DELIVERED", {
      order_code: "DH123", customer_name: "Minh", shop_name: "Flora",
      status: "", amount: "700.000 đ", tracking_url: "https://x.vn/b/T1",
    }, { isBalanceDue: true })
    expect(text).toBe("Flora: Don DH123 da giao thanh cong. Vui long mo link thanh toan 700.000 d con lai. Cam on quy khach! Theo doi: https://x.vn/b/T1")
  })
  it("tin nhắn mẫu Sale gửi Zalo nhắc khách thanh toán lần 2", () => {
    const msg = customerSecondPaymentReminderMessage({
      orderCode: "DH123", balanceVnd: 700_000, trackingUrl: "https://x.vn/b/T1",
    })
    expect(msg).toContain("DH123")
    expect(msg).toContain("700.000 đ")
    expect(msg).toContain("https://x.vn/b/T1")
  })
  it("thu chưa đủ là cọc, thu đủ là hoàn tất", () => {
    expect(paymentNotifyEvent(100)).toBe("DEPOSIT_RECEIVED")
    expect(paymentNotifyEvent(0)).toBe("PAYMENT_COMPLETED")
  })
})
