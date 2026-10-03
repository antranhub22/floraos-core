/**
 * Catalogue Collection Content Generator.
 * Hỗ trợ 3 phong cách trưng bày: EDITORIAL_LOOKBOOK, MODERN_SHOWROOM, COMPACT_LIST.
 * Pure Domain - Không phụ thuộc DB hay mạng.
 */

export type CatalogStyleVariant = "EDITORIAL_LOOKBOOK" | "MODERN_SHOWROOM" | "COMPACT_LIST"

export interface CatalogContentInput {
  shopName: string
  collectionName: string
  occasion?: string | undefined
  productCount: number
  styleVariant: CatalogStyleVariant
  userDirectives?: string | undefined
}

export interface GeneratedCatalogContent {
  styleVariant: CatalogStyleVariant
  badge: string
  title: string
  description: string
  curatorNote: string
  ctaText: string
}

export const CATALOG_STYLE_OPTIONS: Array<{
  id: CatalogStyleVariant
  name: string
  desc: string
  previewIcon: string
}> = [
  {
    id: "MODERN_SHOWROOM",
    name: "Showroom Hiện Đại",
    desc: "Bố cục lưới sản phẩm cân đối, bộ lọc đa năng, tối ưu cho việc lướt xem hàng ngày",
    previewIcon: "grid",
  },
  {
    id: "EDITORIAL_LOOKBOOK",
    name: "Tạp Chí Nghệ Thuật (Lookbook)",
    desc: "Ảnh lớn 4:5 sang trọng, phông chữ thanh lịch, nhấn mạnh câu chuyện và cảm xúc",
    previewIcon: "book-open",
  },
  {
    id: "COMPACT_LIST",
    name: "Đặt Nhanh Sự Kiện (B2B List)",
    desc: "Danh mục hàng ngang cô đọng, hiển thị rõ số lượng cành và nút chọn đặt số lượng lớn",
    previewIcon: "list",
  },
]

/**
 * Sinh nội dung giới thiệu bộ sưu tập Catalogue theo phong cách đã chọn
 */
export function generateCatalogContent(input: CatalogContentInput): GeneratedCatalogContent {
  const shop = input.shopName || "Tiệm Hoa Mộc Lan"
  const collection = input.collectionName || "Bộ Sưu Tập Mẫu Hoa Tuyển Chọn"
  const occasion = input.occasion ? `cho dịp ${input.occasion}` : "dành cho những khoảnh khắc đáng nhớ"

  switch (input.styleVariant) {
    case "EDITORIAL_LOOKBOOK":
      return {
        styleVariant: "EDITORIAL_LOOKBOOK",
        badge: "Editorial Lookbook • Nghệ Thuật Hoa Tươi",
        title: collection,
        description: `Mỗi tác phẩm là một bản hòa ca thị giác giữa màu sắc và hương thơm, được tạo tác thủ công bởi nghệ nhân ${shop} ${occasion}.`,
        curatorNote: "Từng cành hoa mang một rung cảm riêng biệt, tôn vinh gu thẩm mỹ thanh lịch của người trao và người nhận.",
        ctaText: "Khám phá tác phẩm",
      }

    case "COMPACT_LIST":
      return {
        styleVariant: "COMPACT_LIST",
        badge: "Bảng Danh Mục Đặt Nhanh • Ưu Đãi Sự Kiện",
        title: collection,
        description: `Danh mục ${input.productCount} mẫu hoa tiêu chuẩn, tối ưu thời gian chọn mẫu và đặt số lượng lớn cho công ty, sự kiện và hội nghị.`,
        curatorNote: "Hỗ trợ xuất hóa đơn VAT điện tử, in logo thương hiệu lên banner nhũ và giao đồng loạt nhiều địa điểm.",
        ctaText: "Đặt nhanh mẫu hoa",
      }

    case "MODERN_SHOWROOM":
    default:
      return {
        styleVariant: "MODERN_SHOWROOM",
        badge: "Catalog Mẫu Hoa Trực Tuyến",
        title: collection,
        description: `Khám phá bộ sưu tập ${input.productCount} mẫu hoa tươi mới nhất từ ${shop} ${occasion}. Chụp duyệt thực tế trước khi giao.`,
        curatorNote: "Cam kết hoa tươi giữ độ bung nở 3–5 ngày, giao nhanh trong 2 giờ nội thành.",
        ctaText: "Tư vấn qua Zalo",
      }
  }
}
