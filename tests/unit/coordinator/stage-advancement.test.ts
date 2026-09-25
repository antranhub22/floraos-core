import { describe, expect, it } from "vitest"
import { getNextAdvancedOrder } from "@/components/coordinator/control-tower-dashboard"
import type { CoordinationMockOrder } from "@/components/coordinator/control-tower-dashboard"

const baseOrder: CoordinationMockOrder = {
  id: "test-001",
  orderCode: "FLR-2026-TEST",
  stage: "INTAKE",
  stageLabel: "Tiếp nhận đơn",
  riskLevel: "NORMAL",
  customerName: "Nguyễn Văn Test",
  customerTier: "VIP",
  recipientName: "Trần Thị Test",
  recipientPhone: "0901234567",
  deliveryAddress: {
    street: "123 Phố Huế",
    ward: "Phường Ngô Thì Nhậm",
    district: "Quận Hai Bà Trưng",
    city: "Hà Nội",
    country: "Việt Nam",
    formattedAddress: "123 Phố Huế, Phường Ngô Thì Nhậm, Quận Hai Bà Trưng, Hà Nội, Việt Nam",
  },
  deliveryTargetTime: "17:00 Hôm nay",
  nextAction: "Kiểm tra đơn",
  productTitle: "Bó Hoa Test",
  flowers: [],
  cardMessage: "Chúc mừng",
  hasException: false,
}

describe("Coordinator Stage Advancement — getNextAdvancedOrder", () => {
  it("chuyển từ INTAKE -> PLANNING (Chờ phân công xưởng)", () => {
    const next = getNextAdvancedOrder({ ...baseOrder, stage: "INTAKE" })
    expect(next.stage).toBe("PLANNING")
    expect(next.stageLabel).toBe("Đã tiếp nhận (Chờ phân công)")
  })

  it("chuyển từ PLANNING / ASSIGNING -> IN_PRODUCTION (Đang cắm hoa)", () => {
    const next1 = getNextAdvancedOrder({ ...baseOrder, stage: "PLANNING" })
    expect(next1.stage).toBe("IN_PRODUCTION")
    expect(next1.stageLabel).toBe("Đang cắm hoa")

    const next2 = getNextAdvancedOrder({ ...baseOrder, stage: "ASSIGNING" })
    expect(next2.stage).toBe("IN_PRODUCTION")
  })

  it("chuyển từ IN_PRODUCTION -> QUALITY_CHECK (Chờ duyệt QC)", () => {
    const next = getNextAdvancedOrder({ ...baseOrder, stage: "IN_PRODUCTION" })
    expect(next.stage).toBe("QUALITY_CHECK")
    expect(next.stageLabel).toBe("Chờ duyệt QC")
  })

  it("chuyển từ QUALITY_CHECK -> DISPATCHING (Đang giao hàng)", () => {
    const next = getNextAdvancedOrder({ ...baseOrder, stage: "QUALITY_CHECK" })
    expect(next.stage).toBe("DISPATCHING")
    expect(next.stageLabel).toBe("Đang giao hàng")
  })

  it("chuyển từ DISPATCHING -> DELIVERED (Đã giao hàng)", () => {
    const next = getNextAdvancedOrder({ ...baseOrder, stage: "DISPATCHING" })
    expect(next.stage).toBe("DELIVERED")
    expect(next.stageLabel).toBe("Đã giao (Chờ đóng đơn)")
  })

  it("chuyển từ DELIVERED -> COMPLETED (Hoàn tất 100%)", () => {
    const next = getNextAdvancedOrder({ ...baseOrder, stage: "DELIVERED" })
    expect(next.stage).toBe("COMPLETED")
    expect(next.stageLabel).toBe("Hoàn tất 100%")
  })

  it("xử lý sự cố EXCEPTION -> quay lại IN_PRODUCTION", () => {
    const next = getNextAdvancedOrder({ ...baseOrder, stage: "EXCEPTION", hasException: true })
    expect(next.stage).toBe("IN_PRODUCTION")
    expect(next.hasException).toBe(false)
  })
})
