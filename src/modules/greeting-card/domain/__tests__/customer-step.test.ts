import { describe, expect, it } from "vitest"
import { resumeCustomerStep, resumePublicStep, sanitizeVariant } from "../customer-step"

/** Mở lại trang thì về đúng bước khách đã dừng — mỗi ca khớp một dòng trong bảng rà soát. */
describe("link riêng /b — về đúng bước khi mở lại", () => {
  const noOrder = { hasOrder: false, hasSnapshot: true, serverStep: "ORDER_FORM" as const }

  it("đã chọn mẫu nhưng quay lại xem mẫu khác → về xem mẫu, không bị ép vào form", () => {
    expect(resumeCustomerStep("SWIPING", noOrder)).toBe("SWIPING")
  })

  it("đang điền form → về form; chưa chọn mẫu thì không vào form", () => {
    expect(resumeCustomerStep("ORDER_FORM", { hasOrder: false, hasSnapshot: true, serverStep: "SWIPING" })).toBe("ORDER_FORM")
    expect(resumeCustomerStep("ORDER_FORM", { hasOrder: false, hasSnapshot: false, serverStep: "SWIPING" })).toBeNull()
  })

  it("chưa có đơn thì không vào bước thanh toán / theo dõi", () => {
    expect(resumeCustomerStep("PAYMENT", noOrder)).toBeNull()
    expect(resumeCustomerStep("TRACKING", noOrder)).toBeNull()
  })

  it("có đơn chưa trả đủ: đang ở Theo dõi → về Theo dõi; không về xem mẫu / form", () => {
    const unpaid = { hasOrder: true, hasSnapshot: true, serverStep: "PAYMENT" as const }
    expect(resumeCustomerStep("TRACKING", unpaid)).toBe("TRACKING")
    expect(resumeCustomerStep("SWIPING", unpaid)).toBeNull()
    expect(resumeCustomerStep("ORDER_FORM", unpaid)).toBeNull()
  })

  it("đơn đã trả đủ / đã huỷ → luôn ở Theo dõi, không quay lại thanh toán", () => {
    expect(resumeCustomerStep("PAYMENT", { hasOrder: true, hasSnapshot: true, serverStep: "TRACKING" })).toBeNull()
  })
})

describe("link chung /g · /bst — về đúng bước khi mở lại", () => {
  const products = [{ id: "a" }, { id: "b", available: false }]

  it("đang xem mẫu đã chọn / điền form → về đúng bước nếu mẫu còn bán", () => {
    expect(resumePublicStep("PREVIEW", "a", products)).toBe("PREVIEW")
    expect(resumePublicStep("ORDER_FORM", "a", products)).toBe("ORDER_FORM")
  })

  it("mẫu đã gỡ hoặc hết hàng → về xem mẫu", () => {
    expect(resumePublicStep("ORDER_FORM", "b", products)).toBeNull()
    expect(resumePublicStep("ORDER_FORM", "x", products)).toBeNull()
    expect(resumePublicStep("ORDER_FORM", null, products)).toBeNull()
  })

  it("bước của đơn không khôi phục ở đây (đã chuyển sang trang đơn)", () => {
    expect(resumePublicStep("PAYMENT", "a", products)).toBeNull()
  })
})

describe("lựa chọn trong form", () => {
  it("giữ size đã chọn; size đã bị gỡ thì về bản gốc", () => {
    const sel = { variantId: "v1", quantity: 2, shippingZoneId: "z", voucherCode: "GIAM" }
    expect(sanitizeVariant(sel, ["v1"])).toBe(sel)
    expect(sanitizeVariant(sel, ["v2"])).toEqual({ ...sel, variantId: "" })
  })
})
