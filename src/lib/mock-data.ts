import { LucideIcon, ScanSearch, Sparkles, Video, FileText, Rss, LayoutGrid, Users, Package, MessageSquare, BarChart3, Zap } from "lucide-react"

export type WorkspaceKind = "EXPERIENCE" | "PRODUCTION"
export type FeatureId =
  | "phân-tích-sản-phẩm"
  | "creative-studio"
  | "video-studio"
  | "content-engine"
  | "social-publishing"
  | "catalog-website"
  | "crm-khách-hàng"
  | "đơn-hàng-vận-hành"
  | "chat-assistant"
  | "analytics-learning"
  | "ai-features"

export type ModuleStatus = "hoat_dong" | "chua_san_sang" | "chua_co" | "disabled"

export type FeatureStatusMeta = {
  label: string
  dotClass: string
  textClass: string
  bgClass: string
}

export type FeatureItem = {
  id: FeatureId
  name: string
  desc: string
  iconName: keyof typeof FEATURE_ICONS
  status?: ModuleStatus
  statusMeta?: FeatureStatusMeta
  route?: string
  waiting?: boolean
  disabled?: boolean
}

export const FEATURE_ICONS: Record<FeatureId, LucideIcon> = {
  "phân-tích-sản-phẩm": ScanSearch,
  "creative-studio": Sparkles,
  "video-studio": Video,
  "content-engine": FileText,
  "social-publishing": Rss,
  "catalog-website": LayoutGrid,
  "crm-khách-hàng": Users,
  "đơn-hàng-vận-hành": Package,
  "chat-assistant": MessageSquare,
  "analytics-learning": BarChart3,
  "ai-features": Zap,
}

export const STATUS_META: Record<ModuleStatus, FeatureStatusMeta> = {
  hoat_dong: { label: "Hoạt động", dotClass: "bg-secondary-text", textClass: "text-secondary-text", bgClass: "bg-success-bg" },
  chua_san_sang: { label: "Chưa sẵn sàng", dotClass: "bg-warning", textClass: "text-warning", bgClass: "bg-warning-bg" },
  chua_co: { label: "Chưa có", dotClass: "bg-text-muted", textClass: "text-text-muted", bgClass: "bg-surface-alt" },
  disabled: { label: "Sắp có", dotClass: "bg-text-muted", textClass: "text-text-muted", bgClass: "bg-surface-alt" },
}

export const FEATURES: FeatureItem[] = [
  {
    id: "phân-tích-sản-phẩm",
    name: "Phân tích sản phẩm bằng AI",
    desc: "Chụp ảnh → nhận diện hoa, lá, cấu phần, màu sắc, số lượng",
    iconName: "phân-tích-sản-phẩm",
    status: "hoat_dong",
    route: "/tai-anh",
    waiting: false,
  },
  {
    id: "creative-studio",
    name: "AI Creative Studio",
    desc: "Tối ưu ảnh → Master Image → biến thể marketing",
    iconName: "creative-studio",
    status: "hoat_dong",
    route: "/creative-studio",
    waiting: false,
  },
  {
    id: "video-studio",
    name: "AI Video Studio",
    desc: "Reel · TikTok · Story · Slideshow · Motion ads",
    iconName: "video-studio",
    status: "chua_san_sang",
    route: "/video",
  },
  {
    id: "content-engine",
    name: "AI Content Engine",
    desc: "Sinh nội dung theo kênh: Facebook · Instagram · TikTok · Zalo",
    iconName: "content-engine",
    status: "chua_san_sang",
    route: "/noi-dung",
  },
  {
    id: "social-publishing",
    name: "Social Publishing",
    desc: "Lịch đăng, xem trước nền tảng, đăng lại thông minh",
    iconName: "social-publishing",
    status: "chua_san_sang",
    route: "/lich-dang",
  },
  {
    id: "catalog-website",
    name: "Catalog & Website",
    desc: "Catalog số + QR, Landing page chiến dịch",
    iconName: "catalog-website",
    status: "chua_san_sang",
    route: "/catalog",
  },
  {
    id: "crm-khách-hàng",
    name: "CRM & Khách hàng",
    desc: "Hồ sơ, ngày đặc biệt, nhắc mua, hội thoại",
    iconName: "crm-khách-hàng",
    status: "chua_co",
    route: "/khach-hang",
  },
  {
    id: "đơn-hàng-vận-hành",
    name: "Đơn hàng & Vận hành",
    desc: "Tạo đơn, phiếu chào giá, bảng Kanban, SLA",
    iconName: "đơn-hàng-vận-hành",
    status: "chua_co",
    route: "/don-hang",
  },
  {
    id: "chat-assistant",
    name: "AI Chat Assistant",
    desc: "Trả lời từ catalog, chuyển nhân viên, cấu hình",
    iconName: "chat-assistant",
    status: "chua_co",
    route: "/hoi-thoai",
  },
  {
    id: "analytics-learning",
    name: "Analytics & Learning",
    desc: "Số liệu, ROI, vòng học phong cách",
    iconName: "analytics-learning",
    status: "chua_san_sang",
    route: "/so-lieu",
  },
  {
    id: "ai-features",
    name: "Tính năng AI cho sản phẩm",
    desc: "Chọn từng tính năng Creative, Video, Content, Catalog, Landing",
    iconName: "ai-features",
    status: "disabled",
    disabled: true,
  },
]

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

export const TRIAL_LIMIT = 20
