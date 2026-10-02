/**
 * Dev Fixture Data: Tiệm Hoa Mộc Lan
 *
 * Chứa toàn bộ dữ liệu mẫu (Constant Data Fixtures):
 *   • Thông tin tổ chức, user owner, membership
 *   • Hồ sơ kinh doanh (Business Profile)
 *   • Hồ sơ thương hiệu (Brand Profile) kèm đầy đủ ảnh/video upload mẫu
 *   • Danh mục 6 sản phẩm hoa mẫu kèm ảnh thực tế
 */

export const MOCLAN_CONSTANTS = {
  ORG_ID: "dev-moclan-org-0000-0000-000000000001",
  ORG_SLUG: "moc-lan-dev",
  ORG_NAME: "Tiệm Hoa Mộc Lan (Dev)",
  USER_ID: "dev-moclan-usr-0000-0000-000000000001",
  MEMBERSHIP_ID: "dev-moclan-mbr-0000-0000-000000000001",
}

export const MOCLAN_BUSINESS_PROFILE = {
  id: "dev-moclan-biz-0000-0000-000000000001",
  organization_id: MOCLAN_CONSTANTS.ORG_ID,
  legal_name: "Công ty TNHH Hoa Tươi Mộc Lan",
  display_name: "Tiệm Hoa Mộc Lan",
  phone: "0901234567",
  email: "lienhe@tiemhoamoclan.vn",
  address: "42 Nguyễn Huệ, Quận 1, TP.HCM",
  website: "https://tiemhoamoclan.vn",
  tax_code: "0312345678",
  description:
    "Tiệm hoa tươi cao cấp chuyên thiết kế hoa theo phong cách nghệ thuật. Thành lập năm 2018, hơn 5000 tác phẩm đã được trao tay khách hàng tại TP.HCM.",
  social_links: {
    facebook: "https://facebook.com/tiemhoamoclan",
    instagram: "https://instagram.com/tiemhoamoclan",
    tiktok: "https://tiktok.com/@tiemhoamoclan",
    zalo: "https://zalo.me/0901234567",
  },
  operating_hours: {
    monday: { open: "07:00", close: "21:00" },
    tuesday: { open: "07:00", close: "21:00" },
    wednesday: { open: "07:00", close: "21:00" },
    thursday: { open: "07:00", close: "21:00" },
    friday: { open: "07:00", close: "21:30" },
    saturday: { open: "06:30", close: "22:00" },
    sunday: { open: "06:30", close: "20:00" },
  },
}

export const MOCLAN_BRAND_PROFILE = {
  id: "dev-moclan-brn-0000-0000-000000000001",
  organization_id: MOCLAN_CONSTANTS.ORG_ID,
  primary_color: "#c2185b",
  secondary_color: "#f8bbd0",
  accent_color: "#880e4f",
  background_color: "#fff8f9",
  text_color: "#1a0010",
  font_heading: "Cormorant Garamond",
  font_body: "Inter",
  logo_asset_id: "/brand/moc-lan-logo.jpg",
  tone_of_voice:
    "Thanh lịch, ấm áp, tinh tế. Giao tiếp bằng tiếng Việt, xưng hô thân thiện nhưng lịch sự. Tập trung vào cảm xúc và nghệ thuật của hoa.",
  hashtags: {
    default: [
      "#tiemhoamoclan",
      "#hoatuoihochiminh",
      "#hoatuoi",
      "#hoasinhNhat",
      "#hoakyniem",
      "#hoatươiSaigon",
      "#quahoa",
      "#florist",
    ],
  },
  cta_templates: {
    default:
      "Đặt hoa ngay — Giao tận nơi trong 2h nội thành TP.HCM. Hotline: 0901 234 567",
  },
  default_offers: {
    free_gifts: [
      "Thiệp viết tay miễn phí theo thông điệp riêng",
      "Bao bì cao cấp & ruy băng lụa dập kim",
      "Chụp ảnh thành phẩm gửi quý khách duyệt trước khi giao",
    ],
    guarantees: [
      "Cam kết hoa tươi từ 3–5 ngày",
      "Hoàn tiền 100% nếu hoa không tươi khi nhận",
      "Giao đúng giờ cam kết hoặc hoàn phí giao hàng",
    ],
  },
  forbidden_styles: [
    "Dùng hoa nhựa hoặc hoa giả",
    "Màu sắc chói lọi không phù hợp phong cách tiệm",
  ],
  brand_assets: {
    storefront_photos: [
      "/brand/storefront/store-front-01.jpg",
      "/brand/storefront/store-artisan-02.jpg",
      "/brand/storefront/store-display-03.jpg",
      "/brand/storefront/store-workshop-04.jpg",
      "/brand/storefront/store-showcase-05.jpg",
    ],
    intro_video: "/brand/moc-lan-intro.mp4",
    qr_code: "/brand/moc-lan-qr.svg",
  },
}

export interface SampleProductFixture {
  id: string
  code: string
  name: string
  category: string
  shape: string
  facing: string
  container: string
  imagePath: string
  price: number
  originalPrice: number
  description: string
}

export const MOCLAN_SAMPLE_PRODUCTS: SampleProductFixture[] = [
  {
    id: "dev-moclan-prd-0000-0000-000000000001",
    code: "ML-OHARA-01",
    name: "Bó Hoa Hồng Ohara Giấc Mơ Tình Yêu",
    category: "BOUQUET",
    shape: "ROUND",
    facing: "ALL_AROUND",
    container: "WRAPPING_PAPER",
    imagePath: "/images/flowers/g001.jpeg",
    price: 850000,
    originalPrice: 1050000,
    description: "Hoa hồng Ohara nhập khẩu kết hợp cúc Tana và lá bạc sang trọng.",
  },
  {
    id: "dev-moclan-prd-0000-0000-000000000002",
    code: "ML-BASKET-02",
    name: "Giỏ Hoa Khai Trương Phát Tài Kim Ngân",
    category: "BASKET",
    shape: "TRIANGLE",
    facing: "FRONT_FACING",
    container: "WOODEN_BASKET",
    imagePath: "/images/flowers/g002.jpeg",
    price: 1250000,
    originalPrice: 1500000,
    description: "Giỏ hoa khai trương tông cam vàng rực rỡ mang lại may mắn, thịnh vượng.",
  },
  {
    id: "dev-moclan-prd-0000-0000-000000000003",
    code: "ML-VASE-03",
    name: "Bình Hoa Tulip Hà Lan Tinh Khôi",
    category: "VASE",
    shape: "CASCADE",
    facing: "ALL_AROUND",
    container: "CERAMIC_VASE",
    imagePath: "/images/flowers/g010.jpeg",
    price: 1650000,
    originalPrice: 1900000,
    description: "Bình hoa gốm trắng tinh tế phối hoa Tulip Hà Lan thanh tao.",
  },
  {
    id: "dev-moclan-prd-0000-0000-000000000004",
    code: "ML-BOX-04",
    name: "Hộp Hoa Sang Trọng Mùa Yêu Dấu",
    category: "BOX",
    shape: "HEART",
    facing: "TOP_DOWN",
    container: "PREMIUM_BOX",
    imagePath: "/images/flowers/g040.jpg",
    price: 950000,
    originalPrice: 1150000,
    description: "Hộp hoa tròn nắp mica sang trọng, giữ hoa tươi lâu và dễ di chuyển.",
  },
  {
    id: "dev-moclan-prd-0000-0000-000000000005",
    code: "ML-TANA-05",
    name: "Bó Hoa Cúc Tana Nắng Ban Mai",
    category: "BOUQUET",
    shape: "ROUND",
    facing: "ALL_AROUND",
    container: "WRAPPING_PAPER",
    imagePath: "/images/flowers/g041.jpg",
    price: 480000,
    originalPrice: 580000,
    description: "Bó hoa cúc Tana mộc mạc, trẻ trung tặng bạn bè và người thân.",
  },
  {
    id: "dev-moclan-prd-0000-0000-000000000006",
    code: "ML-STAND-06",
    name: "Kệ Hoa Chúc Mừng Thịnh Vượng Đại Cát",
    category: "STAND",
    shape: "VERTICAL",
    facing: "FRONT_FACING",
    container: "WOODEN_STAND",
    imagePath: "/images/flowers/g070.jpeg",
    price: 1950000,
    originalPrice: 2400000,
    description: "Kệ hoa chân gỗ 2 tầng hiện đại mừng sự kiện, kỷ niệm thành lập công ty.",
  },
]
