import { describe, it, expect } from "vitest"
import {
  calculatePartnerWorkmanship,
  aggregatePartnerSettlementPeriod,
  calculateNetworkMargin,
  generateSettlementCsv,
  DEFAULT_WORKMANSHIP_RATES,
  type PartnerSettlementItem,
} from "../partner-settlement"

describe("Partner Settlement Domain (TC-01 -> TC-06)", () => {
  describe("calculatePartnerWorkmanship (TC-01, TC-02)", () => {
    it("tính toán tiền công cơ sở cho bó hoa tiêu chuẩn", () => {
      const res = calculatePartnerWorkmanship({
        arrangementType: "BO_HOA",
      })

      expect(res.baseFeeVnd).toBe(50_000)
      expect(res.rushSurchargeVnd).toBe(0)
      expect(res.holidaySurchargeVnd).toBe(0)
      expect(res.totalCraftFeeVnd).toBe(50_000)
      expect(res.netPayableVnd).toBe(50_000)
    })

    it("áp dụng phụ cấp đơn gấp và dịp lễ tết chính xác", () => {
      const res = calculatePartnerWorkmanship({
        arrangementType: "KE_KHAI_TRUONG",
        isRushOrder: true, // +30%
        isHolidayPeak: true, // +40%
        bonusVnd: 50_000,
        penaltyVnd: 20_000,
        shippingAllowanceVnd: 30_000,
      })

      const base = DEFAULT_WORKMANSHIP_RATES.KE_KHAI_TRUONG.baseFeeVnd // 150_000
      expect(res.baseFeeVnd).toBe(base)
      expect(res.rushSurchargeVnd).toBe(45_000) // 150_000 * 0.3
      expect(res.holidaySurchargeVnd).toBe(60_000) // 150_000 * 0.4
      expect(res.totalCraftFeeVnd).toBe(255_000)
      // net = 255_000 + 30_000 (ship) + 50_000 (bonus) - 20_000 (penalty) = 315_000
      expect(res.netPayableVnd).toBe(315_000)
    })

    it("hỗ trợ đơn giá gia công tùy chỉnh cho thợ bậc cao", () => {
      const res = calculatePartnerWorkmanship({
        arrangementType: "HOA_CUOI",
        customBaseFeeVnd: 300_000,
        materialAllowanceVnd: 100_000,
      })

      expect(res.baseFeeVnd).toBe(300_000)
      expect(res.materialAllowanceVnd).toBe(100_000)
      expect(res.netPayableVnd).toBe(400_000)
    })
  })

  describe("aggregatePartnerSettlementPeriod (TC-03, TC-04)", () => {
    const mockItems: PartnerSettlementItem[] = [
      {
        id: "item-1",
        orderId: "ord-1",
        orderCode: "FL-001",
        partnerId: "partner-A",
        partnerName: "Xưởng Hoa Tươi An Nhiên",
        arrangementType: "BO_HOA",
        craftFeeVnd: 60_000,
        materialAllowanceVnd: 0,
        shippingAllowanceVnd: 20_000,
        bonusVnd: 10_000,
        penaltyVnd: 0,
        netPayableVnd: 90_000,
        orderPriceVnd: 500_000,
        status: "DA_DOI_SOAT",
        completedAt: "2026-09-28T10:00:00Z",
      },
      {
        id: "item-2",
        orderId: "ord-2",
        orderCode: "FL-002",
        partnerId: "partner-A",
        partnerName: "Xưởng Hoa Tươi An Nhiên",
        arrangementType: "KE_KHAI_TRUONG",
        craftFeeVnd: 150_000,
        materialAllowanceVnd: 50_000,
        shippingAllowanceVnd: 0,
        bonusVnd: 0,
        penaltyVnd: 30_000,
        netPayableVnd: 170_000,
        orderPriceVnd: 1_200_000,
        status: "DA_DOI_SOAT",
        completedAt: "2026-09-29T14:30:00Z",
      },
      {
        id: "item-3",
        orderId: "ord-3",
        orderCode: "FL-003",
        partnerId: "partner-B", // Khác đối tác
        partnerName: "Xưởng Hoa Quận 1",
        arrangementType: "GIO_HOA",
        craftFeeVnd: 70_000,
        materialAllowanceVnd: 0,
        shippingAllowanceVnd: 0,
        bonusVnd: 0,
        penaltyVnd: 0,
        netPayableVnd: 70_000,
        orderPriceVnd: 600_000,
        status: "CHO_DOI_SOAT",
        completedAt: "2026-09-29T16:00:00Z",
      },
    ]

    it("lọc chính xác theo partnerId và tổng hợp công nợ", () => {
      const period = aggregatePartnerSettlementPeriod(mockItems, "partner-A", "Xưởng Hoa Tươi An Nhiên", "2026-W39")

      expect(period.totalOrders).toBe(2)
      expect(period.totalOrderPriceVnd).toBe(1_700_000)
      expect(period.totalCraftFeeVnd).toBe(210_000)
      expect(period.totalPenaltyVnd).toBe(30_000)
      expect(period.totalBonusVnd).toBe(10_000)
      expect(period.totalNetPayableVnd).toBe(260_000) // 90_000 + 170_000
      expect(period.settlementStatus).toBe("DA_DOI_SOAT")
    })

    it("đánh dấu trạng thái CHO_DOI_SOAT nếu có bất kỳ đơn nào chưa chốt", () => {
      const pendingItems = [
        ...mockItems,
        {
          ...mockItems[0]!,
          id: "item-4",
          status: "CHO_DOI_SOAT" as const,
        },
      ]

      const period = aggregatePartnerSettlementPeriod(pendingItems, "partner-A", "Xưởng Hoa Tươi An Nhiên", "2026-W39")
      expect(period.settlementStatus).toBe("CHO_DOI_SOAT")
    })
  })

  describe("calculateNetworkMargin (TC-05)", () => {
    it("tính đúng biên lợi nhuận gộp và cảnh báo biên độ an toàn", () => {
      // Đơn 1.000.000đ, trả thợ 200.000đ, tiền hoa 400.000đ -> lãi gộp 400.000đ (40%)
      const healthy = calculateNetworkMargin(1_000_000, 200_000, 400_000)
      expect(healthy.grossProfitVnd).toBe(400_000)
      expect(healthy.grossMarginPercent).toBe(40)
      expect(healthy.isHealthyMargin).toBe(true)

      // Đơn 500.000đ, trả thợ 250.000đ, tiền hoa 200.000đ -> lãi gộp 50.000đ (10%)
      const slim = calculateNetworkMargin(500_000, 250_000, 200_000)
      expect(slim.grossProfitVnd).toBe(50_000)
      expect(slim.grossMarginPercent).toBe(10)
      expect(slim.isHealthyMargin).toBe(false)
    })
  })

  describe("generateSettlementCsv (TC-06)", () => {
    it("xuất chuỗi CSV có UTF-8 BOM và đầy đủ tiêu đề cột", () => {
      const period = aggregatePartnerSettlementPeriod(
        [
          {
            id: "item-1",
            orderId: "ord-1",
            orderCode: "FL-001",
            partnerId: "partner-A",
            partnerName: "Xưởng Hoa Tươi An Nhiên",
            arrangementType: "BO_HOA",
            craftFeeVnd: 60_000,
            materialAllowanceVnd: 0,
            shippingAllowanceVnd: 20_000,
            bonusVnd: 0,
            penaltyVnd: 0,
            netPayableVnd: 80_000,
            orderPriceVnd: 500_000,
            status: "DA_THANH_TOAN",
            completedAt: "2026-09-28T10:00:00Z",
            notes: "Giao đúng hẹn, hoa tươi đẹp",
          },
        ],
        "partner-A",
        "Xưởng Hoa Tươi An Nhiên",
        "2026-W39",
      )

      const csv = generateSettlementCsv(period)
      expect(csv.startsWith("\uFEFF")).toBe(true)
      expect(csv).toContain("Mã đơn hàng,Ngày hoàn tất,Kiểu cắm hoa")
      expect(csv).toContain('"FL-001"')
      expect(csv).toContain('"Bó hoa"')
      expect(csv).toContain("TỔNG CỘNG (1 đơn)")
    })
  })
})
