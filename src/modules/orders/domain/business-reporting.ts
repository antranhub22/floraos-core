/**
 * Domain: Business Reporting & Revenue Analytics (BC-01..06)
 * Tổng hợp số liệu kinh doanh, doanh thu, tỷ lệ hoàn tất đơn và hiệu năng sản phẩm.
 * Pure logic — không import Prisma hay thư viện ngoài.
 */

export interface OrderReportingItem {
  id: string
  code: string
  status: "DRAFT" | "PENDING" | "CONFIRMED" | "PROCESSING" | "COMPLETED" | "CANCELLED"
  totalVnd: number
  customerName?: string | undefined
  productTitle?: string | undefined
  createdAt: Date | string
}

export interface TopSellingItem {
  title: string
  orderCount: number
  totalRevenueVnd: number
}

export interface BusinessReportSummary {
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  draftOrders: number
  fulfillmentRatePercent: number
  totalRevenueVnd: number
  averageOrderValueVnd: number
  topSellingItems: TopSellingItem[]
  aiCreditUsed: number
}

/**
 * Tính toán báo cáo kinh doanh tổng hợp từ danh sách đơn hàng (BC-01, BC-02, BC-03, BC-04).
 */
export function computeBusinessReport(
  orders: OrderReportingItem[],
  aiCreditUsed = 0
): BusinessReportSummary {
  const total = orders.length
  let completed = 0
  let cancelled = 0
  let draft = 0
  let totalRevenue = 0

  const productMap: Record<string, { count: number; revenue: number }> = {}

  for (const o of orders) {
    if (o.status === "COMPLETED") {
      completed += 1
      totalRevenue += o.totalVnd
    } else if (o.status === "CANCELLED") {
      cancelled += 1
    } else if (o.status === "DRAFT") {
      draft += 1
    } else {
      // Các trạng thái đang xử lý (PENDING, CONFIRMED, PROCESSING) vẫn tính vào GMV tiềm năng
      totalRevenue += o.totalVnd
    }

    if (o.productTitle && o.status !== "CANCELLED") {
      const existing = productMap[o.productTitle] ?? { count: 0, revenue: 0 }
      productMap[o.productTitle] = {
        count: existing.count + 1,
        revenue: existing.revenue + o.totalVnd,
      }
    }
  }

  // Tỷ lệ hoàn tất = đơn hoàn tất / (đơn hoàn tất + đơn huỷ)
  const resolvedOrders = completed + cancelled
  const fulfillmentRate = resolvedOrders > 0
    ? Math.round((completed / resolvedOrders) * 100)
    : total > 0 ? 100 : 0

  const validRevenueCount = completed + (total - completed - cancelled - draft)
  const aov = validRevenueCount > 0 ? Math.round(totalRevenue / validRevenueCount) : 0

  const topSellingItems: TopSellingItem[] = Object.entries(productMap)
    .map(([title, data]) => ({
      title,
      orderCount: data.count,
      totalRevenueVnd: data.revenue,
    }))
    .sort((a, b) => b.totalRevenueVnd - a.totalRevenueVnd)
    .slice(0, 5)

  return {
    totalOrders: total,
    completedOrders: completed,
    cancelledOrders: cancelled,
    draftOrders: draft,
    fulfillmentRatePercent: fulfillmentRate,
    totalRevenueVnd: totalRevenue,
    averageOrderValueVnd: aov,
    topSellingItems,
    aiCreditUsed,
  }
}

/**
 * Sinh nội dung CSV cho báo cáo kinh doanh để tải về (BC-06).
 */
export function generateReportCsvContent(
  report: BusinessReportSummary,
  shopName: string,
  exportDate = new Date()
): string {
  const dateStr = exportDate.toLocaleDateString("vi-VN")

  const lines = [
    `BÁO CÁO HIỆU NĂNG KINH DOANH — ${shopName.toUpperCase()}`,
    `Ngày xuất báo cáo: ${dateStr}`,
    "",
    "CHỈ SỐ TỔNG QUAN,GIÁ TRỊ",
    `Tổng số đơn hàng,${report.totalOrders}`,
    `Đơn hoàn tất,${report.completedOrders}`,
    `Đơn bị huỷ,${report.cancelledOrders}`,
    `Đơn nháp,${report.draftOrders}`,
    `Tỷ lệ hoàn tất thành công,${report.fulfillmentRatePercent}%`,
    `Tổng doanh thu (VND),${report.totalRevenueVnd}`,
    `Giá trị đơn trung bình AOV (VND),${report.averageOrderValueVnd}`,
    `Credit AI đã sử dụng,${report.aiCreditUsed}`,
    "",
    "TOP SẢN PHẨM BÁN CHẠY,SỐ ĐƠN,DOANH THU (VND)",
  ]

  for (const item of report.topSellingItems) {
    lines.push(`"${item.title}",${item.orderCount},${item.totalRevenueVnd}`)
  }

  return lines.join("\n")
}
