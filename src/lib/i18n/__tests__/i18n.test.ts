import { describe, it, expect } from "vitest"
import { getDictionary, translate, interpolate } from "../server"
import { viDictionary } from "../locales/vi"
import { enDictionary } from "../locales/en"

describe("i18n Engine — Động cơ đa ngôn ngữ & SSOT từ điển", () => {
  it("trả về từ điển tiếng Việt gốc mặc định", () => {
    const dict = getDictionary("vi")
    expect(dict.common.terms.shop).toBe("Cửa hàng")
    expect(dict.home.header.badge).toBe("Bắt đầu nhanh")
    expect(dict.orders.header.title).toBe("Đơn hàng")
  })

  it("trả về từ điển tiếng Anh khi yêu cầu locale 'en'", () => {
    const dict = getDictionary("en")
    expect(dict.common.terms.shop).toBe("Flower Shop")
    expect(dict.home.header.badge).toBe("Quick Start")
    expect(dict.orders.header.title).toBe("Orders")
  })

  it("dịch đúng qua hàm translate với dot-notation key", () => {
    expect(translate("vi", "common.actions.confirm")).toBe("Xác nhận")
    expect(translate("en", "common.actions.confirm")).toBe("Confirm")
    expect(translate("vi", "orders.tabs.allOrders")).toBe("Tất cả đơn hàng")
    expect(translate("en", "orders.tabs.allOrders")).toBe("All Orders")
  })

  it("nội suy chính xác các tham số biến trong chuỗi", () => {
    const template = "Hiển thị {from} - {to} trên tổng số {total}"
    const result = interpolate(template, { from: 1, to: 20, total: 100 })
    expect(result).toBe("Hiển thị 1 - 20 trên tổng số 100")

    const translatedWithParams = translate("vi", "home.filters.emptySearch", { query: "hoa sen" })
    expect(translatedWithParams).toBe("Không có kết quả cho “hoa sen”. Hãy thử từ khóa khác.")
  })

  it("giữ nguyên token {variable} nếu không truyền tham số", () => {
    const template = "Chào {name}"
    expect(interpolate(template)).toBe("Chào {name}")
  })

  it("đối chiếu cấu trúc tương đồng giữa viDictionary và enDictionary", () => {
    const viKeys = Object.keys(viDictionary)
    const enKeys = Object.keys(enDictionary)
    expect(enKeys).toEqual(viKeys)
  })
})
