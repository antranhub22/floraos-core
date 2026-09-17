/**
 * Product Master Index & Field Projection Engine (Chuẩn Hóa Ngành Hoa SSOT).
 *
 * Master Index là nguồn sự thật duy nhất (Single Source of Truth) lưu giữ toàn bộ
 * trường thông tin của một sản phẩm hoa từ lúc nhận diện ảnh (M01 Vision/BOM)
 * tới giá bán (M02), bán hàng (M01b), đơn hàng (M10), và marketing (M04/M07).
 *
 * Các chức năng khác nhau chỉ được phép trích xuất lát cắt trường (Field Projections)
 * phù hợp với vai trò và nhiệm vụ của mình.
 */

import type { FloristFlowerItem, FloristTicketCardProps } from "@/components/templates/orders/florist-ticket-card"
import type { DeliveryReceiptCardProps } from "@/components/templates/orders/delivery-receipt-card"

/** Thành phần cành hoa nguyên tử trong công thức cắm hoa (Atomic BOM) */
export interface FlowerBomItem {
  flowerName: string
  quantity: number
  unit: string // cành | bông | nhánh | chùm
  color: string
  role: "Chủ đạo" | "Phụ" | "Lấp đầy" | "Lá điểm"
  shade?: string // Đậm | Vừa | Nhạt
}

/** Cấu trúc Master Index hoàn chỉnh của một sản phẩm hoa */
export interface ProductMasterIndex {
  // 1. Định danh cốt lõi
  id: string
  organizationId: string
  code: string
  name: string
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"

  // 2. Định danh dáng hoa & phong cách (Hợp đồng Vision Schema.json)
  category: string // Bó hoa, Giỏ hoa, Kệ khai trương, Hộp hoa, Bình hoa
  shape: string // Tròn, Bán cầu, Tam giác, Thác đổ, Chữ L, Thẳng đứng, Tự do
  facing: string // Một mặt, Hai mặt, Toàn diện 360
  container?: string | undefined // Giỏ mây, Bình gốm, Hộp mica, Kệ gỗ, Kệ sắt
  style: string // Hàn Quốc, Hiện đại, Cổ điển Châu Âu, Tự nhiên mộc mạc
  occasions: string[] // Sinh nhật, Khai trương, Kỷ niệm, Tình yêu, Chia buồn

  // 3. Thị giác & Hình ảnh (Visual & Palette)
  masterImageUrl?: string | undefined
  colorPalette: {
    primaryColor: string
    secondaryColor?: string | undefined
    harmonyTone?: string | undefined // Pastel, Rực rỡ, Trầm ấm, Đơn sắc
  }

  // 4. Công thức cắm hoa xưởng (Florist Recipe / Atomic BOM)
  bom: {
    flowers: FlowerBomItem[]
    foliage: string[] // Lá phụ (lá bạc, lá trầu bà, cỏ đồng tiền...)
    wrapStyle: string // Giấy xi măng, giấy lụa mờ, xốp hoa, mica...
    ribbon: string // Nơ nhung đỏ, ruy băng lụa kem, dây thừng mộc...
    accessories?: string[] | undefined // Đèn led, topper chữ, quả thông...
  }

  // 5. Thương mại & Định giá (Commercial & Pricing - M02)
  pricing: {
    costPriceVnd?: number | undefined // Giá vốn (BẢO MẬT NỘI BỘ)
    quotePriceVnd: number // Giá bán chào khách
    pricingRuleRef?: Record<string, unknown> | undefined
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD PROJECTIONS (Trích xuất lát cắt trường theo chức năng)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. PROJECTION CHO XƯỞNG CẮM HOA (Florist Ticket)
 * Lấy công thức BOM hoa, ảnh mẫu, kiểu gói nơ, hạn giao.
 * ẨN HOÀN TOÀN: Giá vốn, giá bán, thông tin thanh toán của khách.
 */
export function projectFloristTicket(
  product: ProductMasterIndex,
  order: {
    code: string
    deadlineTime: string
    floristName?: string
    internalNote?: string
  }
): FloristTicketCardProps {
  const items: FloristFlowerItem[] = product.bom.flowers.map((f) => ({
    flowerName: f.flowerName,
    quantity: f.quantity,
    unit: f.unit,
    color: f.color,
  }))

  return {
    orderCode: order.code,
    productName: product.name,
    sampleImageUrl: product.masterImageUrl,
    deadlineTime: order.deadlineTime,
    floristName: order.floristName ?? "Chưa nhận thợ",
    items,
    wrapStyle: `${product.bom.wrapStyle}${product.bom.ribbon ? " + " + product.bom.ribbon : ""}`,
    notes: order.internalNote,
  }
}

/**
 * 2. PROJECTION CHO GIAO VẬN & THIỆP MỪNG (Delivery Receipt)
 * Lấy thông tin người nhận, địa chỉ, thiệp chúc mừng, tổng tiền cần thu.
 */
export function projectDeliveryReceipt(order: {
  code: string
  recipientName: string
  recipientPhone: string
  deliveryAddress: string
  deliveryTime: string
  cardMessage?: string
  shippingFeeVnd?: number
  totalAmountVnd: number
}): DeliveryReceiptCardProps {
  return {
    orderCode: order.code,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    deliveryAddress: order.deliveryAddress,
    deliveryTime: order.deliveryTime,
    cardMessage: order.cardMessage || "Không có thiệp",
    shippingFee: (order.shippingFeeVnd ?? 0).toLocaleString("vi-VN") + " đ",
    totalAmount: order.totalAmountVnd.toLocaleString("vi-VN") + " đ",
  }
}

/**
 * 3. PROJECTION CHO TẠO ĐƠN HÀNG (Order Checkout)
 * Khi nhân viên chọn 1 mẫu hoa từ Catalog, trích xuất cấu trúc đơn hàng chuẩn
 * tự động điền sẵn tên hoa, giá tiền, BOM và ảnh mẫu.
 */
export function projectOrderLineItem(product: ProductMasterIndex) {
  const flowerSummary = product.bom.flowers
    .map((f) => `${f.flowerName} (${f.quantity} ${f.unit})`)
    .join(", ")

  return {
    productId: product.id,
    productCode: product.code,
    productName: product.name,
    sampleImageUrl: product.masterImageUrl,
    priceVnd: product.pricing.quotePriceVnd,
    wrapStyle: product.bom.wrapStyle,
    recipeSummary: flowerSummary,
    bom: product.bom,
  }
}
