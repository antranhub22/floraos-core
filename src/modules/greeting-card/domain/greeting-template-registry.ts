/**
 * Domain Registry for Greeting Card Templates (Mẫu Thẻ Chào).
 * Pure TypeScript — No Prisma or external infrastructure imports.
 */

export type GreetingTemplateId =
  | "enterprise-luxury"
  | "swipe-classic"
  | "lookbook-grid"
  | "editorial-story"
  | "video-reels"
  | "occasion-budget-quiz"
  | "event-moodboard"
  | "split-compare"

export interface GreetingCardTemplateDef {
  id: GreetingTemplateId
  name: string
  subtitle: string
  badge: string
  description: string
  tag: string
  isDefault?: boolean
  features: string[]
  recommendedFor: string
}

export const GREETING_TEMPLATES: Record<GreetingTemplateId, GreetingCardTemplateDef> = {
  "enterprise-luxury": {
    id: "enterprise-luxury",
    name: "Enterprise Luxury Deck",
    subtitle: "Giao diện Doanh Nghiệp Sang Trọng",
    badge: "Enterprise",
    description: "Bộ thẻ 3 lớp không gian (3-Layer Spatial Deck), kính mờ Floating Frosted Glass, danh sách thả tim (Shortlist), bóc tách thành phần hoa (BOM), rung xúc giác và huy hiệu xác thực.",
    tag: "Khuyên dùng cho tiệm hoa cao cấp",
    isDefault: true,
    features: [
      "Xếp chồng 3 lớp không gian với hiệu ứng nảy lò xo",
      "Tấm thông tin kính mờ nổi (Floating Frosted Glass)",
      "Chạm đúp (Double-tap) thả tim & khay so sánh mẫu ưng ý",
      "Ngăn kéo xem chi tiết hoa, kích thước & cam kết tiệm",
      "Nút hành động chốt mẫu chuẩn xác, giữ nguyên kênh chuyển đổi",
      "Tối ưu cảm ứng di động & phản hồi rung xúc giác (Haptic)",
    ],
    recommendedFor: "Phù hợp nhất cho khách VIP, bó hoa thiết kế, giỏ hoa khai trương & sự kiện",
  },
  "swipe-classic": {
    id: "swipe-classic",
    name: "Classic Swipe Brochure",
    subtitle: "Lướt Thẻ Cổ Điển Tinh Gọn",
    badge: "Classic",
    description: "Trải nghiệm vuốt thẻ tối giản, thanh tiến trình dạng Story quen thuộc, tập trung tối đa vào hình ảnh hoa và thao tác chốt đơn nhanh.",
    tag: "Tối giản & Tốc độ",
    features: [
      "Vuốt thẻ cơ bản trái / phải mượt mà",
      "Thanh tiến trình Story Bar hiển thị trực quan",
      "Lớp phủ gradient tối làm nổi bật giá bán và tên hoa",
      "Nút chốt mẫu trực tiếp 1-chạm",
    ],
    recommendedFor: "Phù hợp cho khách hàng thích sự quen thuộc, đơn giản, lướt nhanh",
  },
  "lookbook-grid": {
    id: "lookbook-grid",
    name: "Commercial Lookbook Grid",
    subtitle: "Lưới Trưng Bày Thương Mại",
    badge: "Catalog Lookbook",
    description: "Bố cục lưới 2 cột sang trọng cho phép khách hàng nhìn tổng quan tất cả mẫu hoa cùng lúc, hỗ trợ lọc theo mức giá và xem nhanh chi tiết.",
    tag: "Tổng quan danh mục",
    features: [
      "Bố cục lưới thương mại 2 cột tối ưu cho di động",
      "Bộ lọc khoảng giá nhanh (Dưới 500k, 500k - 1tr, Trên 1tr)",
      "Cửa sổ xem nhanh (Quick View Modal) kèm thông số đầy đủ",
      "Nút chốt mẫu tức thời ngay trên từng sản phẩm",
    ],
    recommendedFor: "Phù hợp cho bộ sưu tập nhiều mẫu (>10 mẫu), khách muốn so sánh toàn cảnh",
  },
  "editorial-story": {
    id: "editorial-story",
    name: "Editorial Magazine & Story",
    subtitle: "Tạp Chí Nghệ Thuật & Cảm Xúc",
    badge: "Editorial",
    description: "Bố cục tạp chí nghệ thuật cao cấp với cuộn dọc Parallax, khung hình to bản nghệ thuật, trích dẫn ý nghĩa loài hoa và triết lý cắm hoa.",
    tag: "Cảm xúc & Chiều sâu",
    features: [
      "Khung ảnh to bản tỷ lệ 4:5 sang trọng chuẩn tạp chí",
      "Kể câu chuyện thương hiệu & thông điệp ý nghĩa loài hoa",
      "Thanh điều hướng nhanh giữa các tác phẩm",
      "Nút chốt mẫu cố định chân trang hiển thị giá rõ ràng",
    ],
    recommendedFor: "Phù hợp cho hoa cưới, hoa kỷ niệm, bộ sưu tập phiên bản giới hạn",
  },
  "video-reels": {
    id: "video-reels",
    name: "Video-First Reels & 360",
    subtitle: "Lướt Video Dọc Toàn Màn Hình",
    badge: "Video Reels",
    description: "Trải nghiệm lướt video dọc toàn màn hình 9:16 phong cách TikTok/Reels, hiển thị chuyển động hoa và góc quay 360 độ chân thực.",
    tag: "Trực quan sinh động",
    features: [
      "Khung nhìn tỷ lệ 9:16 toàn màn hình tối ưu di động",
      "Vuốt dọc lướt video / ảnh động 360 độ góc quay thật",
      "Bảng điều khiển kính mờ overlay hiển thị thông số",
      "Nút chốt mẫu 1-chạm nổi bật trên nền video",
    ],
    recommendedFor: "Phù hợp cho bó hoa khổng lồ, giỏ hoa đại tiệc, khách trẻ tuổi",
  },
  "occasion-budget-quiz": {
    id: "occasion-budget-quiz",
    name: "Occasion & Budget Matcher",
    subtitle: "Trợ Lý Gợi Ý Theo Dịp & Ngân Sách",
    badge: "Smart Matcher",
    description: "Trợ lý tương tác thông minh hỏi nhanh 2 câu: Dịp tặng và Ngân sách, tự động lọc và đề xuất 3-5 mẫu hoa khớp nhất để khách chốt đơn trong 30 giây.",
    tag: "Chốt nhanh 30 giây",
    features: [
      "Bộ lọc dịp tặng thông minh (Sinh nhật, Khai trương, Tình yêu, Chúc mừng)",
      "Thang đo ngân sách trực quan (Dưới 500k, 500k-1tr, 1-2tr, Trên 2tr)",
      "Hiển thị bảng đề xuất tối ưu tỷ lệ chuyển đổi",
      "Nút chốt mẫu nhanh chóng, tiết kiệm thời gian cho khách bận rộn",
    ],
    recommendedFor: "Phù hợp cho khách nam giới, khách mua gấp, đơn giao hỏa tốc 60 phút",
  },
  "event-moodboard": {
    id: "event-moodboard",
    name: "Color Moodboard Gallery",
    subtitle: "Bảng Phối Màu & Concept Sự Kiện",
    badge: "Moodboard",
    description: "Phân loại và trưng bày theo dải phổ màu (Pastel, Đỏ may mắn, Cam cháy, Trắng kem, Tím mộng mơ) giúp khách hàng chọn hoa hợp concept và phong thủy.",
    tag: "Đồng điệu sắc màu",
    features: [
      "Bảng chọn dải tông màu nghệ thuật (Color Swatches)",
      "Bộ sưu tập lọc theo moodboard tông màu tương ứng",
      "Hiển thị độ bão hòa màu và chất liệu giấy gói hài hòa",
      "Nút chốt mẫu chuẩn xác ngay theo từng tông màu",
    ],
    recommendedFor: "Phù hợp cho hoa sự kiện, tiệc cưới, khai trương hợp mệnh phong thủy",
  },
  "split-compare": {
    id: "split-compare",
    name: "Split-Screen Lens & Focus",
    subtitle: "Soi Chi Tiết Chia Đôi Màn Hình",
    badge: "Detail Lens",
    description: "Thiết kế chia đôi màn hình độc đáo: nửa trên soi cận cảnh cánh hoa (Kính lúp zoom), nửa dưới hiển thị thông số BOM, độ xòe, độ nở và nút chốt mẫu.",
    tag: "Chính xác & Tinh xảo",
    features: [
      "Nửa trên cố định khung soi chi tiết hoa độ phân giải cao",
      "Nửa dưới cuộn danh mục thông số BOM, nguồn gốc hoa, kích thước",
      "Thước đo đối sánh kích thước thực tế trực quan",
      "Nút chốt mẫu cố định thanh dưới cùng",
    ],
    recommendedFor: "Phù hợp cho hoa nhập khẩu đắt tiền, lan hồ điệp, khách hàng kỹ tính",
  },
}

export const GREETING_TEMPLATE_LIST: GreetingCardTemplateDef[] = Object.values(GREETING_TEMPLATES)

/**
 * Phân giải templateId hợp lệ, mặc định fallback về enterprise-luxury.
 */
export function resolveGreetingTemplateId(candidate?: string | null): GreetingTemplateId {
  if (!candidate) return "enterprise-luxury"
  if (candidate in GREETING_TEMPLATES) {
    return candidate as GreetingTemplateId
  }
  return "enterprise-luxury"
}
