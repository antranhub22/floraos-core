import { describe, it, expect } from "vitest"
import {
  computeBusinessReport,
  generateReportCsvContent,
  type OrderReportingItem,
} from "../business-reporting"

describe("business-reporting — BC-01..06", () => {
  const sampleOrders: OrderReportingItem[] = [
    {
      id: "ord-1",
      code: "FLR-001",
      status: "COMPLETED",
      totalVnd: 500000,
      productTitle: "Bó Hoa Hướng Dương Rực Rỡ",
      createdAt: new Date(),
    },
    {
      id: "ord-2",
      code: "FLR-002",
      status: "COMPLETED",
      totalVnd: 850000,
      productTitle: "Kệ Hoa Khai Trương Hồng Phát",
      createdAt: new Date(),
    },
    {
      id: "ord-3",
      code: "FLR-003",
      status: "COMPLETED",
      totalVnd: 500000,
      productTitle: "Bó Hoa Hướng Dương Rực Rỡ",
      createdAt: new Date(),
    },
    {
      id: "ord-4",
      code: "FLR-004",
      status: "CANCELLED",
      totalVnd: 600000,
      productTitle: "Hộp Hoa Tulip Pastel",
      createdAt: new Date(),
    },
    {
      id: "ord-5",
      code: "FLR-005",
      status: "DRAFT",
      totalVnd: 400000,
      productTitle: "Bó Hoa Baby Trắng",
      createdAt: new Date(),
    },
  ]

  describe("computeBusinessReport (BC-01, BC-02, BC-03)", () => {
    it("tính chính xác doanh thu, tỷ lệ hoàn tất và top sản phẩm bán chạy", () => {
      const report = computeBusinessReport(sampleOrders, 120)

      expect(report.totalOrders).toBe(5)
      expect(report.completedOrders).toBe(3)
      expect(report.cancelledOrders).toBe(1)
      expect(report.draftOrders).toBe(1)
      // 3 completed / (3 + 1) = 75%
      expect(report.fulfillmentRatePercent).toBe(75)
      // Doanh thu hoàn tất = 500k + 850k + 500k = 1.850.000
      expect(report.totalRevenueVnd).toBe(1850000)
      expect(report.aiCreditUsed).toBe(120)

      expect(report.topSellingItems.length).toBeGreaterThanOrEqual(2)
      // Bó Hoa Hướng Dương Rực Rỡ bán 2 lần = 1.000.000đ -> đứng đầu
      expect(report.topSellingItems[0]?.title).toBe("Bó Hoa Hướng Dương Rực Rỡ")
      expect(report.topSellingItems[0]?.orderCount).toBe(2)
      expect(report.topSellingItems[0]?.totalRevenueVnd).toBe(1000000)
    })

    it("xử lý trường hợp không có đơn hàng nào", () => {
      const report = computeBusinessReport([], 0)
      expect(report.totalOrders).toBe(0)
      expect(report.fulfillmentRatePercent).toBe(0)
      expect(report.totalRevenueVnd).toBe(0)
      expect(report.topSellingItems).toHaveLength(0)
    })
  })

  describe("generateReportCsvContent (BC-06)", () => {
    it("sinh định dạng CSV hợp lệ chứa đầy đủ thông tin", () => {
      const report = computeBusinessReport(sampleOrders, 50)
      const csv = generateReportCsvContent(report, "Tiệm Hoa Mộc Lan")

      expect(csv).toContain("BÁO CÁO HIỆU NĂNG KINH DOANH — TIỆM HOA MỘC LAN")
      expect(csv).toContain("Tổng doanh thu (VND),1850000")
      expect(csv).toContain("Tỷ lệ hoàn tất thành công,75%")
      expect(csv).toContain('"Bó Hoa Hướng Dương Rực Rỡ",2,1000000')
    })
  })
})
