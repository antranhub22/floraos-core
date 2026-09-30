import { describe, it, expect } from "vitest"
import { extractFloristRecipeFromOrderItem } from "@/modules/coordinator/domain/master-index-adapter"
// ĐP-2.4 (MI-6, 26/09/2026): `extractCustomerCoordinationBrief` bị xoá khỏi Điều phối —
// tóm tắt hồ sơ khách nay đọc qua `projectCustomerCoordinationBrief` của CMI, xem
// `tests/unit/crm/crm-rules.test.ts`.

describe("Coordinator Master Index Adapter", () => {
  it("trích xuất Atomic BOM từ metadata có cấu trúc của Master Index", () => {
    const rawOrderItem = {
      orderId: "ord-test-1",
      orderCode: "FLR-001",
      productTitle: "Bó Hồng Ohara Kem",
      targetReadyTime: "16:00",
      deliveryAddress: "123 Ba Đình",
      cardMessage: "Chúc mừng sinh nhật",
      internalNote: "Bọc kỹ giấy",
      metadata: {
        sampleImageUrl: "https://example.com/sample.jpg",
        wrapStyle: "Giấy xi măng",
        flowers: [
          {
            flowerName: "Hồng Ohara",
            quantity: 10,
            unit: "cành",
            color: "Kem",
            role: "Chủ đạo",
          },
        ],
        foliage: [
          {
            name: "Lá bạc",
            quantity: 5,
            unit: "cành",
            color: "Xanh bạc",
            role: "Điểm nhấn",
          },
        ],
      },
    }

    const recipe = extractFloristRecipeFromOrderItem(rawOrderItem)

    expect(recipe.orderCode).toBe("FLR-001")
    expect(recipe.sampleImageUrl).toBe("https://example.com/sample.jpg")
    expect(recipe.flowers).toHaveLength(1)
    expect(recipe.flowers[0]!.flowerName).toBe("Hồng Ohara")
    expect(recipe.flowers[0]!.quantity).toBe(10)
    expect(recipe.flowers[0]!.role).toBe("Chủ đạo")
    expect(recipe.foliage).toHaveLength(1)
    expect(recipe.foliage[0]!.name).toBe("Lá bạc")
    expect(recipe.cardMessage).toBe("Chúc mừng sinh nhật")
  })

  it("cung cấp fallback an toàn khi đơn hàng tạo tay chưa có Atomic BOM", () => {
    const rawManualItem = {
      orderId: "ord-test-2",
      orderCode: "FLR-002",
      description: "Khách đặt giỏ hoa quả kèm hoa hồng tự do",
      targetReadyTime: "17:00",
      deliveryAddress: "456 Hoàn Kiếm",
      metadata: null,
    }

    const recipe = extractFloristRecipeFromOrderItem(rawManualItem)

    expect(recipe.orderCode).toBe("FLR-002")
    expect(recipe.flowers).toHaveLength(1)
    expect(recipe.flowers[0]!.flowerName).toBe("Khách đặt giỏ hoa quả kèm hoa hồng tự do")
    expect(recipe.flowers[0]!.quantity).toBe(1)
    // ĐP-1.4 (26/09/2026): trước bản này, thiếu lá/gói/phụ kiện thì hàm BỊA ra
    // "Lá đệm theo mùa" / "Giấy gói cao cấp" — giao diện tưởng đó là dữ liệu
    // thật. Từ nay: không có nguồn thì trả mảng RỖNG, không suy đoán.
    expect(recipe.foliage).toHaveLength(0)
    expect(recipe.wrapping).toHaveLength(0)
    expect(recipe.accessories).toHaveLength(0)
  })

  it("ĐP-1.4 (26/09/2026): có BOM lá/gói/phụ kiện thật thì giữ nguyên, không ghi đè bằng giá trị bịa", () => {
    const rawItem = {
      orderId: "ord-test-3",
      orderCode: "FLR-003",
      productTitle: "Bó Tulip Hà Lan",
      targetReadyTime: "09:00",
      deliveryAddress: "789 Cầu Giấy",
      metadata: {
        flowers: [{ flowerName: "Tulip", quantity: 15, unit: "cành", color: "Vàng", role: "Chủ đạo" }],
        foliage: [{ name: "Dương xỉ", quantity: 3, unit: "cành", color: "Xanh", role: "Nền" }],
        wrapping: [{ layer: "Lớp trong", material: "Giấy kraft", color: "Nâu", texture: "Thô" }],
        accessories: [{ name: "Ruy băng lụa", material: "Lụa", color: "Vàng gold", quantity: 1, printedText: null }],
        wrapStyle: "Giấy xi măng",
      },
    }

    const recipe = extractFloristRecipeFromOrderItem(rawItem)
    expect(recipe.foliage).toHaveLength(1)
    expect(recipe.foliage[0]!.name).toBe("Dương xỉ")
    expect(recipe.wrapping).toHaveLength(1)
    expect(recipe.wrapping[0]!.material).toBe("Giấy kraft")
    expect(recipe.accessories).toHaveLength(1)
    expect(recipe.accessories[0]!.name).toBe("Ruy băng lụa")
  })
})
