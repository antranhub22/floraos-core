/**
 * sales-pitch-template.ts
 *
 * Domain logic tạo Thẻ Chào Sản Phẩm (M01c) và Kịch bản tư vấn Zalo/Messenger cho Sales.
 * Tổng hợp dữ liệu từ:
 *  - M01a (BOM, cấu phần hoa, số lượng, vật chứa, hình dáng)
 *  - M01b (Tên gợi ý, mô tả cảm xúc, phong cách, dịp phù hợp, phân khúc giá)
 *  - Overrides từ nhân viên kinh doanh: Cho phép chỉnh sửa 100% tất cả các trường
 *    trước khi chốt duyệt xuất bản final (status: DRAFT | FINALIZED).
 */

export interface SalesPitchItem {
  id?: string | undefined
  name: string
  quantity: number | string | null
  unit: string
  color?: string | null | undefined
  role?: string | null | undefined
}

export interface SalesPitchData {
  id?: string | undefined
  analysisId?: string | null | undefined
  productId?: string | null | undefined
  productName: string
  sku?: string | null | undefined
  imageUrl?: string | null | undefined
  style: string
  occasions: string[]
  description: string
  mainFlowers: SalesPitchItem[]
  foliageItems: SalesPitchItem[]
  accessoryItems: SalesPitchItem[]
  wrapping: string
  container: string
  dimensions: {
    heightCm: number
    widthCm: number
  }
  priceVnd: number | null
  originalPriceVnd: number | null
  priceSegment: string
  freeGifts: string[]
  guarantees: string[]
  shopName?: string | null | undefined
  shopHotline?: string | null | undefined
  customNote?: string | null | undefined
  status: "DRAFT" | "FINALIZED"
  finalizedAt?: string | null | undefined
  updatedAt?: string | null | undefined
}

export interface SalesPitchOverrides {
  id?: string | undefined
  analysisId?: string | null | undefined
  productId?: string | null | undefined
  productName?: string | undefined
  sku?: string | null | undefined
  imageUrl?: string | null | undefined
  style?: string | undefined
  occasions?: string[] | undefined
  description?: string | undefined
  mainFlowers?: SalesPitchItem[] | undefined
  foliageItems?: SalesPitchItem[] | undefined
  accessoryItems?: SalesPitchItem[] | undefined
  wrapping?: string | undefined
  container?: string | undefined
  heightCm?: number | undefined
  widthCm?: number | undefined
  priceVnd?: number | null | undefined
  originalPriceVnd?: number | null | undefined
  priceSegment?: string | undefined
  freeGifts?: string[] | undefined
  guarantees?: string[] | undefined
  shopName?: string | null | undefined
  shopHotline?: string | null | undefined
  customNote?: string | null | undefined
  status?: ("DRAFT" | "FINALIZED") | undefined
  finalizedAt?: string | null | undefined
}

export const DEFAULT_FREE_GIFTS = [
  "Tặng thiệp / banner chúc mừng thiết kế riêng theo thông điệp",
  "Tặng gói nước dưỡng hoa Chrysal giúp hoa tươi lâu 5 - 7 ngày",
  "Ruy băng lụa cao cấp in nhũ sang trọng",
]

export const DEFAULT_GUARANTEES = [
  "100% hoa tươi mới tuyển chọn nhập trong ngày",
  "Chụp hình hoa thực tế gửi quý khách duyệt trước khi giao",
  "Giao hoa hỏa tốc đúng giờ (60 - 90 phút nội thành)",
  "Bảo hành đổi mới nếu hoa bị dập héo khi vận chuyển",
]

/**
 * Xây dựng dữ liệu Thẻ Chào Sản Phẩm từ M01a + M01b + Overrides
 * Cho phép ghi đè 100% bất kỳ trường nào theo mong muốn của Sales.
 */
export function buildSalesPitchData(
  analysisRaw: Record<string, unknown> | null | undefined,
  copyRaw?: Record<string, unknown> | null | undefined,
  overrides?: SalesPitchOverrides,
  imageUrl?: string | null
): SalesPitchData {
  const a = analysisRaw ?? {}
  const bom = (a.bom as Record<string, unknown> | undefined) ?? {}
  const identity = (a.identity as Record<string, unknown> | undefined) ?? {}
  const c = copyRaw ?? {}

  // 1. Tên sản phẩm & SKU
  const defaultName =
    (c.suggested_name as string) ||
    (a.product_name as string) ||
    (identity.category as string) ||
    "Bó hoa thiết kế cao cấp"
  const productName = overrides?.productName ?? defaultName
  const sku = overrides?.sku ?? (a.sku as string) ?? (a.code as string) ?? null

  // 2. Phong cách & Dịp
  const defaultStyle =
    (c.suggested_style as string) ||
    (identity.phong_cach as string) ||
    (identity.style as string) ||
    "Hiện đại & Tinh tế"
  const style = overrides?.style ?? defaultStyle

  const rawOccasions =
    (c.suggested_occasions as string[]) ||
    (identity.dip_su_dung ? [String(identity.dip_su_dung)] : [])
  const defaultOccasions = rawOccasions.length > 0 ? rawOccasions : ["Sinh nhật", "Chúc mừng", "Kỷ niệm"]
  const occasions = overrides?.occasions ?? defaultOccasions

  // 3. Mô tả
  const defaultDescription =
    (c.suggested_description as string) ||
    (a.description as string) ||
    "Thiết kế hoa tươi được tuyển chọn kỹ lưỡng từ những bông hoa tươi thắm nhất, mang thông điệp trao gửi yêu thương và trân trọng."
  const description = overrides?.description ?? defaultDescription

  // 4. Hoa chính
  const rawFlowers = Array.isArray(bom.flowers) ? bom.flowers : []
  const defaultMainFlowers: SalesPitchItem[] = rawFlowers.map((f: any, idx: number) => ({
    id: f.id || `flower-${idx}`,
    name: f.name || f.nhom_hoa || "Hoa tươi",
    quantity: f.quantity ?? f.count ?? null,
    unit: f.dvt_dem || "cành",
    color: f.mo_ta_mau || f.mau || f.color || null,
    role: f.role || null,
  }))
  const mainFlowers = overrides?.mainFlowers ?? defaultMainFlowers

  // 5. Lá & Phụ kiện
  const rawFoliage = Array.isArray(bom.foliage) ? bom.foliage : []
  const defaultFoliage: SalesPitchItem[] = rawFoliage.map((f: any, idx: number) => ({
    id: f.id || `foliage-${idx}`,
    name: f.name || "Lá phụ",
    quantity: f.quantity ?? f.count ?? null,
    unit: f.dvt_dem || "cành",
    color: f.color || f.mau || null,
    role: f.role || null,
  }))
  const foliageItems = overrides?.foliageItems ?? defaultFoliage

  const rawAcc = Array.isArray(bom.accessories) ? bom.accessories : []
  const defaultAcc: SalesPitchItem[] = rawAcc.map((acc: any, idx: number) => ({
    id: acc.id || `acc-${idx}`,
    name: acc.name || "Phụ kiện",
    quantity: acc.quantity ?? 1,
    unit: "cái",
    color: acc.color || null,
  }))
  const accessoryItems = overrides?.accessoryItems ?? defaultAcc

  // 6. Vật chứa & Giấy gói
  const defaultContainer = (identity.container as string) || "Giấy gói cao cấp"
  const container = overrides?.container ?? defaultContainer

  const rawWrapping = Array.isArray(bom.wrapping) ? bom.wrapping : []
  const defaultWrapping = rawWrapping.length > 0
    ? rawWrapping.map((w: any) => w.material || w.name || "Giấy gói").filter(Boolean).join(", ")
    : "Giấy gói phong cách Hàn Quốc cao cấp"
  const wrapping = overrides?.wrapping ?? defaultWrapping

  // 7. Kích thước
  const heightCm = overrides?.heightCm ?? 55
  const widthCm = overrides?.widthCm ?? 40

  // 8. Giá chào & Phân khúc
  const priceSegment = overrides?.priceSegment ?? (c.suggested_price_segment as string) ?? "standard"
  const defaultPriceBySegment: Record<string, number> = {
    budget: 450000,
    standard: 750000,
    premium: 1250000,
    luxury: 2500000,
  }
  const fallbackPrice = defaultPriceBySegment[priceSegment] ?? 750000
  const priceVnd = overrides?.priceVnd !== undefined ? overrides.priceVnd : fallbackPrice
  const originalPriceVnd = overrides?.originalPriceVnd !== undefined
    ? overrides.originalPriceVnd
    : priceVnd != null ? Math.round(priceVnd * 1.15 / 10000) * 10000 : null

  // 9. Quà tặng & Cam kết
  const freeGifts = overrides?.freeGifts ?? DEFAULT_FREE_GIFTS
  const guarantees = overrides?.guarantees ?? DEFAULT_GUARANTEES

  // 10. Thông tin cửa hàng & Trạng thái xuất bản
  const shopName = overrides?.shopName ?? "FloraOS Flower Boutique"
  const shopHotline = overrides?.shopHotline ?? "1900 xxxx"
  const customNote = overrides?.customNote ?? null
  const status = overrides?.status ?? "DRAFT"
  const finalizedAt = overrides?.finalizedAt ?? null

  return {
    id: overrides?.id,
    analysisId: overrides?.analysisId ?? (a.id as string) ?? null,
    productId: overrides?.productId ?? (a.product_id as string) ?? null,
    productName,
    sku,
    imageUrl: overrides?.imageUrl ?? imageUrl ?? null,
    style,
    occasions,
    description,
    mainFlowers,
    foliageItems,
    accessoryItems,
    wrapping,
    container,
    dimensions: { heightCm, widthCm },
    priceVnd,
    originalPriceVnd,
    priceSegment,
    freeGifts,
    guarantees,
    shopName,
    shopHotline,
    customNote,
    status,
    finalizedAt,
  }
}

/**
 * Định dạng số tiền VND: 850000 -> "850.000 ₫"
 */
export function formatCurrencyVnd(amount: number | null | undefined): string {
  if (amount == null) return "Liên hệ báo giá"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
}

/**
 * Sinh kịch bản tư vấn Zalo / Messenger có định dạng emoji trực quan cho Sales
 */
export function generateZaloPitchScript(pitch: SalesPitchData): string {
  const priceStr = formatCurrencyVnd(pitch.priceVnd)
  const origPriceStr = pitch.originalPriceVnd && pitch.priceVnd && pitch.originalPriceVnd > pitch.priceVnd
    ? ` (Giá gốc: ${formatCurrencyVnd(pitch.originalPriceVnd)})`
    : ""

  const flowersStr = pitch.mainFlowers.length > 0
    ? pitch.mainFlowers.map((f) => `  • ${f.name}${f.quantity ? ` (${f.quantity} ${f.unit})` : ""}${f.color ? ` — Tone ${f.color}` : ""}`).join("\n")
    : "  • Hoa tươi tuyển chọn theo mẫu"

  const foliageStr = pitch.foliageItems.length > 0
    ? `\n🌿 Lá đệm: ${pitch.foliageItems.map((f) => `${f.name}${f.quantity ? ` (${f.quantity} ${f.unit})` : ""}`).join(", ")}`
    : ""

  const accStr = pitch.accessoryItems.length > 0
    ? `\n🎀 Phụ kiện: ${pitch.accessoryItems.map((a) => `${a.name}${a.quantity ? ` (${a.quantity} ${a.unit})` : ""}`).join(", ")}`
    : ""

  const giftsStr = pitch.freeGifts.map((g) => `  🎁 ${g}`).join("\n")
  const guaranteesStr = pitch.guarantees.map((g) => `  ✓ ${g}`).join("\n")

  const noteStr = pitch.customNote ? `\n📌 LƯU Ý / ƯU ĐÃI RIÊNG:\n${pitch.customNote}\n` : ""
  const hotlineStr = pitch.shopHotline ? ` 📞 Hotline: ${pitch.shopHotline}` : ""

  return `🌸 [THÔNG TIN SẢN PHẨM] ${pitch.productName.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━
✨ Phong cách: ${pitch.style}
🎯 Phù hợp dịp: ${pitch.occasions.join(", ")}
📐 Kích thước ước tính: Cao ~${pitch.dimensions.heightCm}cm × Rộng ~${pitch.dimensions.widthCm}cm
🎀 Quy cách: ${pitch.container} (${pitch.wrapping})

💬 Ý NGHĨA & MÔ TẢ:
"${pitch.description}"

🌺 THÀNH PHẦN HOA CHÍNH:
${flowersStr}${foliageStr}${accStr}

💰 GIÁ ƯU ĐÃI: ${priceStr}${origPriceStr}

🎁 QUÀ TẶNG KÈM THEO:
${giftsStr}

🛡️ CAM KẾT DỊCH VỤ TỪ SHOP:
${guaranteesStr}
${noteStr}
━━━━━━━━━━━━━━━━━━━━
Quý khách cần tư vấn thiệp chúc mừng riêng hoặc đặt giao hoa hỏa tốc, xin vui lòng nhắn tin trực tiếp cho shop ạ!${hotlineStr} ❤️`
}
