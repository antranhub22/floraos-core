import { describe, it, expect } from "vitest"
import {
  extractFloristRecipeFromOrderItem,
  extractCustomerCoordinationBrief,
} from "@/modules/coordinator/domain/master-index-adapter"

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
    expect(recipe.foliage).toHaveLength(1)
    expect(recipe.wrapping).toHaveLength(1)
  })

  it("trích xuất đúng hồ sơ khách hàng từ Customer Master Index", () => {
    const mockCustomer = {
      id: "cust-1",
      organizationId: "org-1",
      code: "KH-001",
      name: "Nguyễn Văn VIP",
      phone: "0900000001",
      tags: ["VIP"],
      metrics: {
        tier: "VIP" as const,
        totalSpentVnd: 50000000,
        orderCount: 15,
        aovVnd: 3333333,
      },
      preferences: {
        preferredFlowers: ["Hồng Ecuador", "Mẫu đơn"],
        preferredColors: ["Đỏ", "Hồng"],
      },
      occasions: [],
      consents: [],
      availableVouchers: [],
    }

    const brief = extractCustomerCoordinationBrief(mockCustomer)
    expect(brief.tier).toBe("VIP")
    expect(brief.isVip).toBe(true)
    expect(brief.preferredFlowers).toContain("Mẫu đơn")
  })
})
