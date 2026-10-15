import { describe, expect, it } from "vitest"
import { fillOrderProductImage, orderProductId } from "../order-product-image"

const images = new Map([["p1", "/img/p1.jpg"], ["p2", "/img/p2.jpg"]])

describe("ảnh mẫu hoa trên đơn: bù ảnh kho khi ảnh chụp mẫu thiếu", () => {
  it("lấy sản phẩm từ dòng đơn, không có thì từ mẫu khách chọn", () => {
    expect(orderProductId({ items: [{ product_id: "p1" }], greeting_sessions: [{ selected_product_id: "p2" }] })).toBe("p1")
    expect(orderProductId({ items: [], greeting_sessions: [{ selected_product_id: "p2" }] })).toBe("p2")
    expect(orderProductId({ items: [], greeting_sessions: [] })).toBe("")
  })

  it("điền ảnh vào cả ảnh chụp mẫu lẫn metadata dòng đơn khi thiếu", () => {
    const out = fillOrderProductImage(
      { items: [{ product_id: "p1", metadata: { name: "Rosa" } }], greeting_sessions: [{ product_snapshot: { name: "Rosa" } }] },
      images
    )
    expect(out.items[0]?.metadata).toEqual({ name: "Rosa", imageUrl: "/img/p1.jpg" })
    expect(out.greeting_sessions[0]?.product_snapshot).toEqual({ name: "Rosa", imageUrl: "/img/p1.jpg" })
  })

  it("giữ nguyên ảnh đã chụp lúc khách chọn", () => {
    const order = { items: [{ product_id: "p1", metadata: { imageUrl: "/old.jpg" } }], greeting_sessions: [{ product_snapshot: { imageUrl: "/old.jpg" } }] }
    const out = fillOrderProductImage(order, images)
    expect(out.items[0]?.metadata).toEqual({ imageUrl: "/old.jpg" })
    expect(out.greeting_sessions[0]?.product_snapshot).toEqual({ imageUrl: "/old.jpg" })
  })

  it("không có ảnh kho thì trả nguyên đơn; phiên không có ảnh chụp mẫu không bị tạo mới", () => {
    const order = { items: [{ product_id: "px", metadata: null }], greeting_sessions: [{ product_snapshot: null }] }
    expect(fillOrderProductImage(order, images)).toBe(order)
    const out = fillOrderProductImage({ items: [{ product_id: "p1", metadata: null }], greeting_sessions: [{ product_snapshot: null }] }, images)
    expect(out.items[0]?.metadata).toEqual({ imageUrl: "/img/p1.jpg" })
    expect(out.greeting_sessions[0]?.product_snapshot).toBeNull()
  })
})
