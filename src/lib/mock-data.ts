// Dữ liệu mẫu cho bản xem UI trên localhost.
// KHÔNG phải dữ liệu thật — thay bằng use-case/API thật khi nối backend.
// Đặt tên và cấu trúc theo docs/dac-ta/09-du-lieu-mau-experience.md để nhất quán
// với workspace trải nghiệm thật của sản phẩm.

export type WorkspaceKind = "EXPERIENCE" | "PRODUCTION"

export type MockSession = {
  userName: string
  userInitials: string
  orgName: string
  workspaceKind: WorkspaceKind
  capabilities: string[]
}

export const MOCK_SESSION: MockSession = {
  userName: "Tony Nguyễn",
  userInitials: "TN",
  orgName: "Tiệm hoa Mộc Lan",
  workspaceKind: "PRODUCTION",
  // H3 = product.approve, I2 = media.approve — theo docs/dac-ta/02-function-catalog.md
  capabilities: ["H3", "I2", "B4"],
}

export const SAMPLE_PRODUCTS = [
  { id: "p1", name: "Bó hồng đỏ 20 cành", category: "Bó hoa", tint: "#FBEAEC", color: "#E48692" },
  { id: "p2", name: "Giỏ hoa chúc mừng", category: "Giỏ hoa", tint: "#EEF4EE", color: "#174C3C" },
  { id: "p3", name: "Hộp hoa hồng phấn", category: "Hộp hoa", tint: "#FBEAEC", color: "#E48692" },
  { id: "p4", name: "Bình hoa để bàn", category: "Bình hoa", tint: "#F5EEE3", color: "#B08D57" },
  { id: "p5", name: "Kệ hoa khai trương", category: "Kệ hoa", tint: "#E7EEE6", color: "#5F9670" },
  { id: "p6", name: "Lẵng hoa chia buồn", category: "Lẵng hoa", tint: "#E7EEE6", color: "#5F9670" },
] as const

export const PENDING_APPROVALS = [
  { id: "a1", name: "Bó hồng đỏ 20 cành", meta: "Sale · Nguyễn Hà · 10 phút trước", tint: "#FBEAEC", color: "#E48692" },
  { id: "a2", name: "Hộp hoa hồng phấn", meta: "Sale · Trần Minh · 40 phút trước", tint: "#EEF4EE", color: "#174C3C" },
  { id: "a3", name: "Kệ hoa khai trương", meta: "Sale · Nguyễn Hà · 1 giờ trước", tint: "#E7EEE6", color: "#5F9670" },
]

export const EXPERIENCE_MODULES = [
  {
    id: "m01",
    name: "Phân tích ảnh sản phẩm",
    desc: "Đưa ảnh lên, nhận diện hoa, lá và số lượng",
    costPerUse: 1,
  },
  {
    id: "m04a",
    name: "Tối ưu ảnh sản phẩm",
    desc: "Ảnh đẹp hơn, giữ đúng sản phẩm thật",
    costPerUse: 2,
  },
  {
    id: "m02",
    name: "Tính giá sản phẩm",
    desc: "Ra giá bán tự động theo cấu phần",
    costPerUse: 0,
  },
  {
    id: "m03",
    name: "Tra cứu sản phẩm",
    desc: "Tìm nhanh trong kho dữ liệu đã có",
    costPerUse: 0,
  },
] as const

export const EXTERNAL_MODULES = [
  {
    id: "m04b",
    name: "Ảnh marketing",
    desc: "Thêm chữ, logo, khung nền theo mẫu thương hiệu",
    product: "SocialFlow",
  },
  {
    id: "m07",
    name: "Đăng bài mạng xã hội",
    desc: "Soạn và đăng lên các nền tảng đã kết nối",
    product: "SocialFlow",
  },
  {
    id: "m05",
    name: "Trang landing page",
    desc: "Dựng trang giới thiệu để chia sẻ sản phẩm",
    product: "LocalBudd",
  },
  {
    id: "m06",
    name: "Catalog sản phẩm",
    desc: "Tạo danh mục sản phẩm dạng in hoặc chia sẻ",
    product: "LocalBudd",
  },
] as const

export const TRIAL_LIMIT = 20
