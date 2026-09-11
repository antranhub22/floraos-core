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

// Trạng thái triển khai thật của từng module theo "Bản đồ module" (PRD §5) —
// đối chiếu trực tiếp với mã nguồn ba repo (floraos-core, LocalBudd,
// SocialFlow) ngày 2026-09-11, không suy đoán từ tài liệu:
//   hoat_dong      — có API thật + màn thao tác thật, dữ liệu qua lại đúng.
//   chua_san_sang  — đã xây (API và/hoặc màn hình) nhưng chưa dùng được
//                    trọn vẹn: thiếu một đầu (màn hoặc API), hoặc màn hiện
//                    có chạy giả lập/không nối API thật.
//   chua_co        — chưa có API lẫn màn hình nào cho chức năng này.
export type ModuleStatus = "hoat_dong" | "chua_san_sang" | "chua_co"

export const EXPERIENCE_MODULES = [
  {
    id: "m01",
    name: "Phân tích ảnh sản phẩm",
    desc: "Đưa ảnh lên, nhận diện hoa, lá và số lượng",
    costPerUse: 1,
    status: "hoat_dong" as ModuleStatus,
  },
  {
    id: "m04a",
    name: "Tối ưu ảnh sản phẩm",
    desc: "Ảnh đẹp hơn, giữ đúng sản phẩm thật",
    costPerUse: 2,
    status: "chua_san_sang" as ModuleStatus,
    statusNote:
      "Đã có API tạo, duyệt và tải ảnh tối ưu (dùng được ở màn Duyệt/Job). Chưa có màn nào để bắt đầu một lượt tối ưu ảnh mới.",
  },
  {
    id: "m02",
    name: "Tính giá sản phẩm",
    desc: "Ra giá bán tự động theo cấu phần",
    costPerUse: 0,
    status: "hoat_dong" as ModuleStatus,
  },
  {
    id: "m03",
    name: "Tra cứu sản phẩm",
    desc: "Tìm nhanh trong kho dữ liệu đã có",
    costPerUse: 0,
    status: "hoat_dong" as ModuleStatus,
  },
] as const

export const EXTERNAL_MODULES = [
  {
    id: "m04b",
    name: "Ảnh marketing",
    desc: "Thêm chữ, logo, khung nền theo mẫu thương hiệu",
    product: "SocialFlow",
    status: "chua_co" as ModuleStatus,
    statusNote:
      "Chưa có đường nối tới ảnh sản phẩm đã duyệt (Master Image) bên core. Phần đã có ở SocialFlow chỉ mới sinh gợi ý chữ/khung, chưa ghép lên ảnh sản phẩm thật.",
  },
  {
    id: "m07",
    name: "Đăng bài mạng xã hội",
    desc: "Soạn và đăng lên các nền tảng đã kết nối",
    product: "SocialFlow",
    status: "hoat_dong" as ModuleStatus,
  },
  {
    id: "m05",
    name: "Trang landing page",
    desc: "Dựng trang giới thiệu để chia sẻ sản phẩm",
    product: "LocalBudd",
    status: "hoat_dong" as ModuleStatus,
  },
  {
    id: "m06",
    name: "Catalog sản phẩm",
    desc: "Tạo danh mục sản phẩm dạng in hoặc chia sẻ",
    product: "LocalBudd",
    status: "chua_co" as ModuleStatus,
    statusNote: "Chưa có API lẫn màn hình nào cho chức năng này ở LocalBudd.",
  },
  {
    id: "m08",
    name: "Trò chuyện với khách hàng",
    desc: "Trả lời khách tự động trên các kênh nhắn tin",
    product: "Chưa có repo",
    status: "chua_co" as ModuleStatus,
    statusNote: "Chưa có repo nào phụ trách chức năng này — nằm trong lộ trình, xây sau (PRD §5, M08).",
  },
] as const

export const TRIAL_LIMIT = 20
