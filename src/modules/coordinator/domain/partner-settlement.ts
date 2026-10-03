/**
 * Partner Settlement & Workmanship Financial Ledger Domain (TC-01 -> TC-06).
 * Pure TypeScript Domain - Không phụ thuộc Prisma hay UI.
 * Quản lý chi phí đơn hàng, tiền công gia công, đối soát công nợ xưởng và biên lợi nhuận.
 */

export type SettlementStatus = "CHO_DOI_SOAT" | "DA_DOI_SOAT" | "DA_THANH_TOAN" | "TRANH_CHAP"

export type FlowerArrangementType =
  | "BO_HOA" // Bó hoa tiêu chuẩn
  | "GIO_HOA" // Giỏ hoa / Hộp hoa
  | "LANG_HOA" // Lẵng hoa bàn tiệc
  | "KE_KHAI_TRUONG" // Kệ hoa khai trương 2-3 tầng
  | "HOA_CUOI" // Hoa cầm tay cô dâu / Xe hoa
  | "HOA_VIENG" // Kệ hoa chia buồn trang nghiêm

export interface PartnerWorkmanshipBaseRate {
  arrangementType: FlowerArrangementType
  baseFeeVnd: number
  rushHourMultiplier: number // Ví dụ 1.2 (giao gấp < 2h)
  peakHolidayMultiplier: number // Ví dụ 1.35 (Lễ 8/3, 20/10, Valentine)
}

/**
 * Biểu phí gia công cơ sở khuyến nghị cho mạng lưới điện hoa
 */
export const DEFAULT_WORKMANSHIP_RATES: Record<FlowerArrangementType, PartnerWorkmanshipBaseRate> = {
  BO_HOA: {
    arrangementType: "BO_HOA",
    baseFeeVnd: 50_000,
    rushHourMultiplier: 1.2,
    peakHolidayMultiplier: 1.3,
  },
  GIO_HOA: {
    arrangementType: "GIO_HOA",
    baseFeeVnd: 70_000,
    rushHourMultiplier: 1.25,
    peakHolidayMultiplier: 1.3,
  },
  LANG_HOA: {
    arrangementType: "LANG_HOA",
    baseFeeVnd: 90_000,
    rushHourMultiplier: 1.25,
    peakHolidayMultiplier: 1.35,
  },
  KE_KHAI_TRUONG: {
    arrangementType: "KE_KHAI_TRUONG",
    baseFeeVnd: 150_000,
    rushHourMultiplier: 1.3,
    peakHolidayMultiplier: 1.4,
  },
  HOA_CUOI: {
    arrangementType: "HOA_CUOI",
    baseFeeVnd: 180_000,
    rushHourMultiplier: 1.3,
    peakHolidayMultiplier: 1.35,
  },
  HOA_VIENG: {
    arrangementType: "HOA_VIENG",
    baseFeeVnd: 140_000,
    rushHourMultiplier: 1.3,
    peakHolidayMultiplier: 1.3,
  },
}

export interface CalculateWorkmanshipInput {
  arrangementType: FlowerArrangementType
  isRushOrder?: boolean | undefined
  isHolidayPeak?: boolean | undefined
  customBaseFeeVnd?: number | undefined
  materialAllowanceVnd?: number | undefined
  shippingAllowanceVnd?: number | undefined
  penaltyVnd?: number | undefined
  bonusVnd?: number | undefined
}

export interface WorkmanshipPayoutResult {
  baseFeeVnd: number
  rushSurchargeVnd: number
  holidaySurchargeVnd: number
  totalCraftFeeVnd: number
  materialAllowanceVnd: number
  shippingAllowanceVnd: number
  bonusVnd: number
  penaltyVnd: number
  netPayableVnd: number
}

/**
 * Tính toán tiền công gia công chi tiết theo loại sản phẩm và phụ cấp
 */
export function calculatePartnerWorkmanship(input: CalculateWorkmanshipInput): WorkmanshipPayoutResult {
  const rateConfig = DEFAULT_WORKMANSHIP_RATES[input.arrangementType]
  const baseFee = input.customBaseFeeVnd ?? rateConfig.baseFeeVnd

  const rushSurcharge = input.isRushOrder ? Math.round(baseFee * (rateConfig.rushHourMultiplier - 1)) : 0
  const holidaySurcharge = input.isHolidayPeak ? Math.round(baseFee * (rateConfig.peakHolidayMultiplier - 1)) : 0

  const totalCraftFee = baseFee + rushSurcharge + holidaySurcharge
  const materialAllowance = Math.max(0, input.materialAllowanceVnd ?? 0)
  const shippingAllowance = Math.max(0, input.shippingAllowanceVnd ?? 0)
  const bonus = Math.max(0, input.bonusVnd ?? 0)
  const penalty = Math.max(0, input.penaltyVnd ?? 0)

  const netPayable = Math.max(0, totalCraftFee + materialAllowance + shippingAllowance + bonus - penalty)

  return {
    baseFeeVnd: baseFee,
    rushSurchargeVnd: rushSurcharge,
    holidaySurchargeVnd: holidaySurcharge,
    totalCraftFeeVnd: totalCraftFee,
    materialAllowanceVnd: materialAllowance,
    shippingAllowanceVnd: shippingAllowance,
    bonusVnd: bonus,
    penaltyVnd: penalty,
    netPayableVnd: netPayable,
  }
}

export interface PartnerSettlementItem {
  id: string
  orderId: string
  orderCode: string
  partnerId: string
  partnerName: string
  arrangementType: FlowerArrangementType
  craftFeeVnd: number
  materialAllowanceVnd: number
  shippingAllowanceVnd: number
  bonusVnd: number
  penaltyVnd: number
  netPayableVnd: number
  orderPriceVnd: number
  status: SettlementStatus
  completedAt: string // ISO string
  notes?: string | undefined
}

export interface PartnerSettlementPeriod {
  periodId: string
  partnerId: string
  partnerName: string
  totalOrders: number
  totalOrderPriceVnd: number
  totalCraftFeeVnd: number
  totalMaterialAllowanceVnd: number
  totalShippingAllowanceVnd: number
  totalBonusVnd: number
  totalPenaltyVnd: number
  totalNetPayableVnd: number
  settlementStatus: SettlementStatus
  items: PartnerSettlementItem[]
}

/**
 * Tổng hợp kỳ đối soát tài chính của đối tác xưởng ngoài
 */
export function aggregatePartnerSettlementPeriod(
  items: PartnerSettlementItem[],
  partnerId: string,
  partnerName: string,
  periodId: string,
): PartnerSettlementPeriod {
  const filtered = items.filter((item) => item.partnerId === partnerId)

  const totalOrders = filtered.length
  let totalOrderPrice = 0
  let totalCraftFee = 0
  let totalMaterial = 0
  let totalShipping = 0
  let totalBonus = 0
  let totalPenalty = 0
  let totalNetPayable = 0

  let allPaid = totalOrders > 0
  let anyPending = false
  let anyDispute = false

  for (const item of filtered) {
    totalOrderPrice += item.orderPriceVnd
    totalCraftFee += item.craftFeeVnd
    totalMaterial += item.materialAllowanceVnd
    totalShipping += item.shippingAllowanceVnd
    totalBonus += item.bonusVnd
    totalPenalty += item.penaltyVnd
    totalNetPayable += item.netPayableVnd

    if (item.status === "TRANH_CHAP") anyDispute = true
    if (item.status === "CHO_DOI_SOAT") anyPending = true
    if (item.status !== "DA_THANH_TOAN") allPaid = false
  }

  let status: SettlementStatus = "DA_DOI_SOAT"
  if (totalOrders === 0 || anyPending) {
    status = "CHO_DOI_SOAT"
  } else if (anyDispute) {
    status = "TRANH_CHAP"
  } else if (allPaid) {
    status = "DA_THANH_TOAN"
  }

  return {
    periodId,
    partnerId,
    partnerName,
    totalOrders,
    totalOrderPriceVnd: totalOrderPrice,
    totalCraftFeeVnd: totalCraftFee,
    totalMaterialAllowanceVnd: totalMaterial,
    totalShippingAllowanceVnd: totalShipping,
    totalBonusVnd: totalBonus,
    totalPenaltyVnd: totalPenalty,
    totalNetPayableVnd: totalNetPayable,
    settlementStatus: status,
    items: filtered,
  }
}

export interface NetworkMarginCalculation {
  orderPriceVnd: number
  partnerPayoutVnd: number
  estimatedMaterialCostVnd: number
  grossProfitVnd: number
  grossMarginPercent: number
  isHealthyMargin: boolean
}

/**
 * Phân tích biên lợi nhuận gộp của đơn điều phối (TC-05)
 */
export function calculateNetworkMargin(
  orderPriceVnd: number,
  partnerPayoutVnd: number,
  estimatedMaterialCostVnd = 0,
): NetworkMarginCalculation {
  const safeOrderPrice = Math.max(0, orderPriceVnd)
  const totalCost = partnerPayoutVnd + estimatedMaterialCostVnd
  const grossProfit = safeOrderPrice - totalCost
  const grossMarginPercent = safeOrderPrice > 0 ? Math.round((grossProfit / safeOrderPrice) * 1000) / 10 : 0

  return {
    orderPriceVnd: safeOrderPrice,
    partnerPayoutVnd,
    estimatedMaterialCostVnd,
    grossProfitVnd: grossProfit,
    grossMarginPercent,
    isHealthyMargin: grossMarginPercent >= 25, // Biên lợi nhuận chuẩn ngành điện hoa >= 25%
  }
}

/**
 * Xuất bảng kê đối soát CSV tiếng Việt UTF-8 BOM (TC-06)
 */
export function generateSettlementCsv(period: PartnerSettlementPeriod): string {
  const headers = [
    "Mã đơn hàng",
    "Ngày hoàn tất",
    "Kiểu cắm hoa",
    "Giá trị đơn (VNĐ)",
    "Tiền công (VNĐ)",
    "Vật tư ứng (VNĐ)",
    "Phí ship (VNĐ)",
    "Thưởng (VNĐ)",
    "Phạt vi phạm (VNĐ)",
    "Thực nhận (VNĐ)",
    "Trạng thái",
    "Ghi chú",
  ]

  const typeLabels: Record<FlowerArrangementType, string> = {
    BO_HOA: "Bó hoa",
    GIO_HOA: "Giỏ hoa",
    LANG_HOA: "Lẵng hoa",
    KE_KHAI_TRUONG: "Kệ khai trương",
    HOA_CUOI: "Hoa cưới",
    HOA_VIENG: "Hoa viếng",
  }

  const statusLabels: Record<SettlementStatus, string> = {
    CHO_DOI_SOAT: "Chờ đối soát",
    DA_DOI_SOAT: "Đã đối soát",
    DA_THANH_TOAN: "Đã thanh toán",
    TRANH_CHAP: "Tranh chấp",
  }

  const rows = period.items.map((item) => [
    `"${item.orderCode}"`,
    `"${new Date(item.completedAt).toLocaleDateString("vi-VN")}"`,
    `"${typeLabels[item.arrangementType] ?? item.arrangementType}"`,
    item.orderPriceVnd,
    item.craftFeeVnd,
    item.materialAllowanceVnd,
    item.shippingAllowanceVnd,
    item.bonusVnd,
    item.penaltyVnd,
    item.netPayableVnd,
    `"${statusLabels[item.status] ?? item.status}"`,
    `"${(item.notes ?? "").replace(/"/g, '""')}"`,
  ])

  // Thêm dòng tổng cộng
  const summaryRow = [
    `"TỔNG CỘNG (${period.totalOrders} đơn)"`,
    '""',
    '""',
    period.totalOrderPriceVnd,
    period.totalCraftFeeVnd,
    period.totalMaterialAllowanceVnd,
    period.totalShippingAllowanceVnd,
    period.totalBonusVnd,
    period.totalPenaltyVnd,
    period.totalNetPayableVnd,
    `"${statusLabels[period.settlementStatus]}"`,
    '""',
  ]

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(",")), summaryRow.join(",")].join("\r\n")

  // Thêm ký tự UTF-8 BOM (\uFEFF) để Excel mở hiển thị đúng tiếng Việt có dấu
  return "\uFEFF" + csvContent
}
