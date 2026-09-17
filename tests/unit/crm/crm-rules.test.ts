import { describe, it, expect } from "vitest"
import {
  deriveCustomerTier,
  isValidVietnamesePhone,
  normalizeVietnamesePhone,
  calculateDaysUntilOccasion,
  hasMarketingConsent,
} from "@/modules/crm/domain/crm-rules"
import {
  projectCustomerSalesCard,
  projectOccasionReminder,
  projectMarketingAudience,
  type CustomerMasterIndex,
} from "@/modules/crm/domain/customer-master-index"

describe("CRM Domain Rules — Ngành hoa M09", () => {
  describe("Phân hạng RFM (deriveCustomerTier)", () => {
    it("đạt VIP khi chi tiêu >= 10 triệu hoặc >= 10 đơn", () => {
      expect(deriveCustomerTier(12_000_000, 2)).toBe("VIP")
      expect(deriveCustomerTier(2_000_000, 10)).toBe("VIP")
    })

    it("đạt GOLD khi chi tiêu >= 5 triệu hoặc >= 5 đơn", () => {
      expect(deriveCustomerTier(6_000_000, 2)).toBe("GOLD")
      expect(deriveCustomerTier(1_000_000, 6)).toBe("GOLD")
    })

    it("đạt SILVER khi chi tiêu >= 2 triệu hoặc >= 3 đơn", () => {
      expect(deriveCustomerTier(2_500_000, 1)).toBe("SILVER")
      expect(deriveCustomerTier(800_000, 3)).toBe("SILVER")
    })

    it("đạt BRONZE khi chi tiêu >= 500k hoặc >= 1 đơn", () => {
      expect(deriveCustomerTier(600_000, 1)).toBe("BRONZE")
    })

    it("xếp hạng NEW khi chưa có đơn hàng nào", () => {
      expect(deriveCustomerTier(0, 0)).toBe("NEW")
    })
  })

  describe("Số điện thoại Việt Nam", () => {
    it("nhận diện đúng các đầu số di động hợp lệ (09x, 08x, 07x, 03x, 05x)", () => {
      expect(isValidVietnamesePhone("0909123456")).toBe(true)
      expect(isValidVietnamesePhone("+84988776655")).toBe(true)
      expect(isValidVietnamesePhone("84345678901")).toBe(true)
      expect(isValidVietnamesePhone("0123456789")).toBe(false) // Đầu 01 cũ
      expect(isValidVietnamesePhone("abcdefghij")).toBe(false)
    })

    it("chuẩn hóa về dạng 0xxxxxxxxx", () => {
      expect(normalizeVietnamesePhone("+84909123456")).toBe("0909123456")
      expect(normalizeVietnamesePhone("84909123456")).toBe("0909123456")
      expect(normalizeVietnamesePhone("0909 123 456")).toBe("0909123456")
    })
  })

  describe("Tính số ngày đến dịp kỷ niệm (calculateDaysUntilOccasion)", () => {
    it("tính chính xác khoảng cách ngày", () => {
      const mockNow = new Date(2026, 9, 13) // Ngày 13/10
      const days = calculateDaysUntilOccasion("10-20", mockNow) // 20/10
      expect(days).toBe(7)
    })
  })

  describe("Quyền tiếp thị (hasMarketingConsent)", () => {
    it("cho phép gửi tin khi đã granted và từ chối khi chưa có consent", () => {
      const consents = [
        { channel: "ZALO_ZNS" as const, granted: true, grantedAt: "2026-01-01" },
        { channel: "PROMOTION" as const, granted: false, grantedAt: "2026-01-01" },
      ]
      expect(hasMarketingConsent(consents, "ZALO_ZNS")).toBe(true)
      expect(hasMarketingConsent(consents, "PROMOTION")).toBe(false)
      expect(hasMarketingConsent(consents, "SMS")).toBe(false)
    })
  })

  describe("Field Projections", () => {
    const mockCustomer: CustomerMasterIndex = {
      id: "c-1",
      organizationId: "org-1",
      code: "KH-0001",
      name: "Chị Lan",
      phone: "0909111222",
      tags: ["VIP"],
      metrics: {
        tier: "VIP",
        totalSpentVnd: 15_000_000,
        orderCount: 12,
        aovVnd: 1_250_000,
      },
      preferences: {
        preferredFlowers: ["Hồng Ecuador", "Baby Hà Lan"],
        preferredColors: ["Đỏ nhung"],
      },
      occasions: [
        { id: "o-1", name: "Sinh nhật sếp", date: "10-20", isRecurring: true, reminderDaysBefore: 7 },
      ],
      consents: [
        { channel: "ZALO_ZNS", granted: true, grantedAt: "2026-01-01" },
      ],
      availableVouchers: [
        { code: "VIP10", discountType: "PERCENTAGE", discountValue: 10 },
      ],
    }

    it("projectCustomerSalesCard trích xuất đúng lát cắt bán hàng", () => {
      const card = projectCustomerSalesCard(mockCustomer)
      expect(card.name).toBe("Chị Lan")
      expect(card.tier).toBe("VIP")
      expect(card.favFlowersSummary).toBe("Hồng Ecuador, Baby Hà Lan")
      expect(card.vouchersCount).toBe(1)
    })

    it("projectOccasionReminder tạo lời nhắc kèm gợi ý hoa", () => {
      const rem = projectOccasionReminder(mockCustomer, mockCustomer.occasions[0]!, 7)
      expect(rem.occasionName).toBe("Sinh nhật sếp")
      expect(rem.daysLeft).toBe(7)
      expect(rem.suggestedFlower).toBe("Hồng Ecuador")
      expect(rem.isZaloAllowed).toBe(true)
    })

    it("projectMarketingAudience chỉ lấy khách có consent", () => {
      expect(projectMarketingAudience(mockCustomer, "ZALO_ZNS")).not.toBeNull()
      expect(projectMarketingAudience(mockCustomer, "SMS")).toBeNull()
    })
  })
})
