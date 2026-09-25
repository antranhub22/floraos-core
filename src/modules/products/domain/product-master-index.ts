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

/** Đơn vị đếm — đúng `dvt_dem` của hợp đồng Vision (`Bông|Cành|Lá|Cây`), viết thường. */
export type DemUnit = "bông" | "cành" | "lá" | "cây"

/** Thành phần cành hoa nguyên tử trong công thức cắm hoa (Atomic BOM) */
export interface FlowerBomItem {
  flowerName: string
  quantity: number
  unit: DemUnit
  color: string
  /**
   * Đúng 4 vai trò của HOA theo hợp đồng Vision (`bom.flowers[].role`) — KHÔNG lẫn với vai
   * trò của LÁ (`bom.foliage[].role`, xem `FoliageBomItem.role`). Trước bản sửa nợ #89,
   * "Hoa điểm xuyết" từng bị dịch nhầm thành `"Lá điểm"`, một khái niệm thuộc về lá.
   */
  role: "Chủ đạo" | "Phụ" | "Điểm xuyến" | "Lấp đầy"
  shade?: string | undefined // Đậm | Vừa | Nhạt
  /** Số nụ chưa nở của riêng loài này (`so_nu`) — đếm riêng, KHÔNG cộng vào `quantity` (nợ #90). */
  budCount?: number | undefined
  /** Số cành hỏng/héo/dập của riêng loài này (`so_hong`) — đã NẰM TRONG `quantity` (nợ #90). */
  damagedCount?: number | undefined
}

/** Lá/cành trang trí — cấu trúc nguyên tử thay vì chỉ giữ tên trần (nợ #88). */
export interface FoliageBomItem {
  name: string
  /** `null` khi chưa xác định được số — quy ước đếm cho phép lá/cành trang trí không đếm số (nợ #51). */
  quantity: number | null
  unit: DemUnit
  color: string
  role: "Nền" | "Viền" | "Điểm nhấn" | "Lấp đầy"
}

/** Phụ kiện trang trí — cấu trúc nguyên tử thay vì chỉ giữ tên trần (nợ #88). */
export interface AccessoryBomItem {
  name: string
  material: string
  color: string
  quantity: number | null
  /** Chữ in trên chính phụ kiện, nguyên văn — `null` khi không có. */
  printedText: string | null
}

/** Một lớp trong công thức gói — hợp đồng Vision khai đủ 4 lớp (nợ #88, phần wrapping). */
export interface WrappingLayer {
  layer: string
  material: string
  color: string
  texture: string
}

/**
 * Một biến thể kích thước/gói của sản phẩm — đọc từ bảng `product_variants` đã có sẵn
 * trong Prisma nhưng trước bản sửa P-Fix-3a (17/09) chưa được Master Index đọc tới.
 * Chốt với chủ sản phẩm 17/09: chưa có dữ liệu size thật nào — trường này chỉ dựng KHUNG,
 * mảng rỗng cho tới khi có size thật được nhập.
 */
export interface ProductVariant {
  id: string
  name: string
  size?: string | undefined
  /** Hệ số nhân lên công thức/giá gốc của biến thể — vd 1.5 cho size "Lớn". */
  multiplier: number
}

/** Một ảnh phụ ngoài ảnh chính (`masterImageUrl`) — đúng 3 vai trò còn lại của `product_images.role`. */
export interface ProductGalleryImage {
  role: "GALLERY" | "CATALOG" | "SOCIAL"
  url: string
}

/**
 * Trạng thái còn hàng của MẪU SẢN PHẨM (bó/giỏ dựng sẵn) — chốt với chủ sản phẩm 17/09:
 * KHÔNG phải tồn kho nguyên liệu hoa rời. `PRE_ORDER_ONLY` = hết bản dựng sẵn, chỉ nhận đặt
 * trước.
 */
export type StockStatus = "IN_STOCK" | "PRE_ORDER_ONLY" | "OUT_OF_STOCK"

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
    // `harmonyTone` (Pastel/Rực rỡ/Trầm ấm/Đơn sắc) đã BỎ — nợ #91, P-Fix-4 (17/09): khai
    // trước cho đủ hình dạng type nhưng chưa từng có luật nào tính giá trị thật (rà `src/`
    // xác nhận không nơi nào đọc field này). Không xây một luật suy đoán "trông hợp lý" khi
    // chưa có tiêu chí thật — xoá khỏi type, thêm lại khi có luật thật.
  }

  // 4. Công thức cắm hoa xưởng (Florist Recipe / Atomic BOM)
  bom: {
    flowers: FlowerBomItem[]
    /** Lá/cành trang trí — cấu trúc đầy đủ số lượng/màu/vai trò (nợ #88, đã trả 17/09). */
    foliage: FoliageBomItem[]
    /** Đầy đủ các lớp gói theo hợp đồng Vision. `wrapStyle`/`ribbon` bên dưới là suy ra từ
     * mảng này (giữ lại nguyên trạng cho các nơi tiêu thụ cũ đang đọc hai trường chuỗi đó). */
    wrapping: WrappingLayer[]
    wrapStyle: string // Giấy xi măng, giấy lụa mờ, xốp hoa, mica...
    ribbon: string // Nơ nhung đỏ, ruy băng lụa kem, dây thừng mộc...
    /** Phụ kiện trang trí — cấu trúc đầy đủ chất liệu/màu/số lượng/chữ in (nợ #88, đã trả 17/09). */
    accessories: AccessoryBomItem[]
    /** Số tầng cắm (`so_tang_lop`) — phục vụ QC/định giá công thợ (nợ #90). */
    tierCount?: number | undefined
  }

  // 5. Thương mại & Định giá (Commercial & Pricing - M02)
  pricing: {
    costPriceVnd?: number | undefined // Giá vốn (BẢO MẬT NỘI BỘ)
    /**
     * Giá bán chào khách. `null` = CHƯA CÓ giá niêm yết tĩnh cho sản phẩm này.
     *
     * Chốt với chủ sản phẩm 17/09 (nợ #87, `TECHNICAL_DEBT.md`): hệ thống
     * KHÔNG lưu một giá cố định theo từng sản phẩm — mọi giá bán thật phải
     * đi qua `quotePrice()` (M02) gắn với một lượt tư vấn/đơn cụ thể, theo
     * hạng đối tác và phụ phí tại thời điểm đó. Field này gần như luôn
     * `null` theo đúng thiết kế, không phải lỗi.
     *
     * BẮT BUỘC: mọi nơi hiển thị field này phải xử lý `null` thành "Liên hệ
     * để báo giá" — tuyệt đối không coi `null`/thiếu giá trị là 0đ.
     */
    quotePriceVnd: number | null
    // `pricingRuleRef` đã BỎ — nợ #91, P-Fix-4 (17/09): chưa nơi nào từng gán giá trị thật
    // (rà `src/` xác nhận `product-master-index-repository.ts` chỉ từng gán `undefined`).
    // KHÔNG lẫn với `pricingRuleRef` của `orders/domain/order-types.ts` — trường đó thuộc
    // một luồng KHÁC (đơn hàng cụ thể, gắn với `quotePrice()` lúc chốt đơn) và đang dùng thật,
    // không đụng tới. Thêm lại ở đây khi Master Index thật sự cần trỏ tới một luật giá áp dụng.
  }

  // 6. Biến thể & tồn kho (P-Fix-3a, 17/09 — xem KE_HOACH_HOAN_THIEN_TEMPLATE_SYSTEM.md)
  /** Đọc từ `product_variants`. Mảng rỗng khi sản phẩm chưa có biến thể nào (đúng thực trạng hiện tại). */
  variants: ProductVariant[]
  /**
   * `undefined` = tổ chức CHƯA cấu hình theo dõi tồn kho cho sản phẩm này (bảng
   * `product_inventory` chưa được nối — xem nợ mới trong `TECHNICAL_DEBT.md`, chờ migration
   * chạy trước khi repository đọc bảng này). KHÔNG suy diễn "còn hàng" khi chưa có dữ liệu.
   */
  stock?:
    | {
        status: StockStatus
        quantityAvailable?: number | undefined
      }
    | undefined

  // 7. Nội dung thương mại bổ sung (P-Fix-3b, 17/09)
  /** Ảnh phụ ngoài ảnh chính — GALLERY/CATALOG/SOCIAL. Mảng rỗng khi sản phẩm chỉ có ảnh MAIN. */
  galleryImages: ProductGalleryImage[]
  /**
   * Số ngày cam kết tươi — cấu hình CẤP TỔ CHỨC (`organizations.settings.freshness_guarantee_days`),
   * một con số chung áp cho mọi sản phẩm (chốt với chủ sản phẩm 17/09). `undefined` = tổ chức
   * chưa cấu hình — KHÔNG bịa một mặc định "3 ngày" (khác với chuỗi cứng cũ ở Thẻ chào A6).
   */
  freshnessGuaranteeDays?: number | undefined
  /**
   * Tag cảnh báo tự do (dị ứng phấn hoa/mùi hương/độc tính thú cưng) — chốt với chủ sản phẩm
   * 17/09: tính năng THAM KHẢO, nhân viên tự gõ, CHƯA có danh mục tag chuẩn hoá. Mảng rỗng =
   * chưa ai gắn cảnh báo nào, không phải "đã xác nhận an toàn".
   */
  warningTags: string[]
  /** Kích thước vật lý ước tính (cao × rộng). `undefined` khi chưa đo — không bịa số. */
  dimensions?: { heightCm: number; widthCm: number } | undefined
  /** Chính sách thay thế hoa tương đương khi hết nguyên liệu đúng loài trong BOM. */
  substitutionPolicy?: { allowed: boolean; note?: string | undefined } | undefined
}

/**
 * Hợp nhất "dịp sử dụng" từ hai nguồn cùng ghi vào `products.attributes` ở
 * hai đợt duyệt khác nhau: `identity.dip_su_dung` (một giá trị AI đoán, ghi
 * lúc duyệt M01) và `salesData.occasions` (người duyệt M01b chỉnh tay, có
 * thể nhiều dịp — xem `product-master-merge.ts`).
 *
 * Trước bản sửa này, `ProductMasterIndexRepository.mapToMasterIndex` chỉ đọc
 * `identity.dip_su_dung`, làm mất lựa chọn dịp mà người duyệt M01b đã chỉnh
 * tay (nợ kỹ thuật #92, `TECHNICAL_DEBT.md`). Union + khử trùng, giữ dữ liệu
 * người duyệt trước, AI đoán sau — không có nguồn nào thì trả mảng rỗng,
 * không bịa một dịp mặc định.
 */
export function mergeOccasions(
  salesDataOccasions: readonly string[] | undefined,
  aiGuessedOccasion: string | undefined
): string[] {
  const fromSalesData = (salesDataOccasions ?? []).map((o) => o.trim()).filter(Boolean)
  const fromAi = aiGuessedOccasion?.trim() ? [aiGuessedOccasion.trim()] : []
  return Array.from(new Set([...fromSalesData, ...fromAi]))
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

export { type StructuredAddress, formatStructuredAddress } from "@/modules/orders/domain/order-types"

/**
 * 2. PROJECTION CHO GIAO VẬN & THIỆP MỪNG (Delivery Receipt)
 * Lấy thông tin người nhận, địa chỉ, thiệp chúc mừng, tổng tiền cần thu.
 */
export function projectDeliveryReceipt(order: {
  code: string
  recipientName: string
  recipientPhone: string
  deliveryAddress: import("@/modules/orders/domain/order-types").StructuredAddress | string
  deliveryTime: string
  cardMessage?: string
  shippingFeeVnd?: number
  totalAmountVnd: number
}): DeliveryReceiptCardProps {
  const formattedAddr =
    typeof order.deliveryAddress === "string"
      ? order.deliveryAddress
      : [
          order.deliveryAddress.street,
          order.deliveryAddress.ward,
          order.deliveryAddress.district,
          order.deliveryAddress.city,
          order.deliveryAddress.country || "Việt Nam",
        ]
          .filter(Boolean)
          .join(", ")

  return {
    orderCode: order.code,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    deliveryAddress: formattedAddr,
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
