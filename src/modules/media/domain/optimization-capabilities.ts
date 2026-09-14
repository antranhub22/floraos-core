/**
 * Extensible Optimization Capability Registry — Quản lý danh mục năng lực tối ưu ảnh M04a.
 *
 * Cho phép mở rộng thêm năng lực mới mà không làm vỡ kiến trúc UI hoặc pipeline.
 * Luật thuần, không import hạ tầng hay Prisma.
 */

export type CapabilityCategory = "enhancement" | "cleanup" | "composition" | "creative"

export type EnhancerProviderKey = "openai" | "gemini" | "replicate" | "local" | "realesrgan" | "pil"

export interface OptimizationCapability {
  /** Mã định danh duy nhất (kebab-case hoặc snake_case) */
  id: string
  /** Tên hiển thị tiếng Việt */
  name: string
  /** Mô tả chi tiết giá trị nghiệp vụ */
  description: string
  /** Phân loại */
  category: CapabilityCategory
  /** Biểu tượng trực quan đại diện (Lucide icon identifier) */
  iconName: string
  /** Danh sách nhà cung cấp hỗ trợ năng lực này. "all" nghĩa là mọi provider đều hỗ trợ. */
  supportedProviders: EnhancerProviderKey[] | "all"
  /** Có nằm trong gói Tự động hoàn toàn (Full Auto) không */
  defaultInAuto: boolean
  /** Thông điệp báo cáo minh bạch khi hoàn thành */
  executionNote: string
}

/**
 * Registry Danh mục các năng lực tối ưu hóa hình ảnh M04a.
 * Có thể mở rộng tự do trong tương lai (ví dụ: color_grade_cinematic, hdr_boost, deglare_flash...).
 */
export const OPTIMIZATION_CAPABILITIES: readonly OptimizationCapability[] = [
  {
    id: "upscale_clarity",
    name: "Siêu phân giải & Tăng nét cánh hoa",
    description: "Tăng kích thước 2x, khôi phục chi tiết viền, làm rõ vân cánh hoa và độ sắc nét tổng thể.",
    category: "enhancement",
    iconName: "Zap",
    supportedProviders: "all", // Cả OpenAI lẫn Real-ESRGAN/PIL đều hỗ trợ xuất sắc
    defaultInAuto: true,
    executionNote: "Đã tăng nét siêu phân giải 2x & làm rõ từng đường vân cánh hoa",
  },
  {
    id: "enhance_lighting",
    name: "Cân bằng dải sáng & Tương phản Studio",
    description: "Bù sáng vùng khuất bóng, dịu vùng cháy sáng và cân bằng tương phản theo phong cách studio chuyên nghiệp.",
    category: "enhancement",
    iconName: "SunMedium",
    supportedProviders: "all",
    defaultInAuto: true,
    executionNote: "Đã cân bằng dải sáng và nâng cấp độ tương phản studio mềm mại",
  },
  {
    id: "remove_watermark",
    name: "Xóa Watermark & Chữ chìm",
    description: "Tự động phát hiện và xóa bỏ hình mờ, số điện thoại, logo đóng dấu và vẽ bù kết cấu tự nhiên.",
    category: "cleanup",
    iconName: "Eraser",
    supportedProviders: ["openai", "gemini", "replicate"], // Cần AI Inpainting
    defaultInAuto: true,
    executionNote: "Đã xóa sạch watermark, số điện thoại và logo đóng dấu trên ảnh",
  },
  {
    id: "remove_background",
    name: "Tách nền & Phông Studio Ambiance",
    description: "Loại bỏ hậu cảnh rườm rà tại xưởng cắm hoa, thay bằng phông nền studio sang trọng với ánh sáng dịu.",
    category: "composition",
    iconName: "Layers",
    supportedProviders: ["openai", "gemini"], // Cần Generative Studio Backdrop
    defaultInAuto: true,
    executionNote: "Đã tách nền và chuyển sang phông Studio Ambiance ánh sáng dịu",
  },
  {
    id: "smart_reframe",
    name: "Tự động sinh 4 tỷ lệ chuẩn Marketing",
    description: "Tạo 4 kích thước (1:1 Vuông, 4:5 Chân dung, 9:16 Story/Reels, 16:9 Banner) bảo toàn 100% chủ thể hoa.",
    category: "composition",
    iconName: "Maximize2",
    supportedProviders: "all",
    defaultInAuto: true,
    executionNote: "Đã tạo 4 tỷ lệ chuẩn (1:1, 4:5, 9:16, 16:9) bảo toàn 100% bó hoa",
  },
  {
    id: "add_marketing_text",
    name: "Chèn thông điệp Marketing cao cấp",
    description: "Chèn dòng chữ nghệ thuật hoặc slogan thương hiệu hài hòa vào góc ảnh.",
    category: "creative",
    iconName: "Type",
    supportedProviders: ["openai", "gemini"],
    defaultInAuto: false,
    executionNote: "Đã chèn thông điệp thương hiệu nghệ thuật vào bố cục ảnh",
  },
] as const

/**
 * Kiểm tra một capability có được hỗ trợ bởi provider cụ thể hay không.
 */
export function isCapabilitySupported(
  capability: OptimizationCapability,
  providerKey: string
): boolean {
  if (capability.supportedProviders === "all") return true
  const normalized = providerKey.toLowerCase().trim() as EnhancerProviderKey
  // "local", "realesrgan", "pil" đều thuộc nhóm local
  if (normalized === "local" || normalized === "pil" || normalized === "realesrgan") {
    return capability.supportedProviders.includes("local") ||
      capability.supportedProviders.includes("realesrgan") ||
      capability.supportedProviders.includes("pil")
  }
  return capability.supportedProviders.includes(normalized)
}

/**
 * Lấy danh sách ID các capability mặc định cho chế độ "auto".
 */
export function getDefaultAutoCapabilityIds(): string[] {
  return OPTIMIZATION_CAPABILITIES.filter((c) => c.defaultInAuto).map((c) => c.id)
}

/**
 * Lấy danh sách ghi chú thực thi từ danh sách các capability IDs đã chạy.
 */
export function resolveExecutionNotes(capabilityIds: string[]): string[] {
  const map = new Map(OPTIMIZATION_CAPABILITIES.map((c) => [c.id, c.executionNote]))
  return capabilityIds.map((id) => map.get(id) || `Đã tối ưu hạng mục: ${id}`)
}
