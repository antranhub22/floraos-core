/**
 * Các trường thông tin sản phẩm có thể hiển thị trên mẫu Thẻ chào, và cấu hình
 * bật/tắt theo từng mẫu của mỗi cửa hàng (lưu ở `organizations.settings`).
 * Hàm thuần — không Prisma.
 */

/** Luôn hiển thị, không tắt được (chốt với PO 05/10/2026). */
export const REQUIRED_DISPLAY_FIELDS = ["code", "name", "price"] as const

/** Các trường cửa hàng được bật/tắt — thứ tự ở đây là thứ tự hiển thị. */
export const OPTIONAL_DISPLAY_FIELDS = [
  { key: "flowers", label: "Thành phần hoa" },
  { key: "color", label: "Màu chủ đạo" },
  { key: "style", label: "Phong cách" },
  { key: "dimensions", label: "Kích thước" },
  { key: "wrapStyle", label: "Kiểu gói" },
  { key: "category", label: "Loại sản phẩm" },
  { key: "description", label: "Mô tả / ý nghĩa" },
] as const

export type OptionalDisplayField = (typeof OPTIONAL_DISPLAY_FIELDS)[number]["key"]

const OPTIONAL_KEYS = new Set<string>(OPTIONAL_DISPLAY_FIELDS.map((f) => f.key))

/** Mặc định khi cửa hàng chưa chỉnh: bật tất cả (trường không có dữ liệu vẫn tự ẩn). */
export const DEFAULT_ENABLED_FIELDS: OptionalDisplayField[] = OPTIONAL_DISPLAY_FIELDS.map((f) => f.key)

/** Khoá trong `organizations.settings`: `{ [templateId]: OptionalDisplayField[] }` */
export const DISPLAY_SETTINGS_KEY = "greetingCardDisplay"

export type DisplaySettings = Record<string, OptionalDisplayField[]>

/** Lọc bỏ khoá lạ/trùng, giữ đúng thứ tự chuẩn. */
export function sanitizeEnabledFields(input: unknown): OptionalDisplayField[] {
  if (!Array.isArray(input)) return [...DEFAULT_ENABLED_FIELDS]
  const wanted = new Set(input.filter((v): v is string => typeof v === "string" && OPTIONAL_KEYS.has(v)))
  return OPTIONAL_DISPLAY_FIELDS.map((f) => f.key).filter((k) => wanted.has(k))
}

/** Đọc toàn bộ cấu hình từ `organizations.settings` (bỏ qua dữ liệu hỏng). */
export function readDisplaySettings(orgSettings: unknown): DisplaySettings {
  const raw = orgSettings && typeof orgSettings === "object" ? (orgSettings as Record<string, unknown>)[DISPLAY_SETTINGS_KEY] : null
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const out: DisplaySettings = {}
  for (const [templateId, fields] of Object.entries(raw as Record<string, unknown>)) {
    out[templateId] = sanitizeEnabledFields(fields)
  }
  return out
}

/** Các trường đang bật cho một mẫu (mặc định nếu chưa chỉnh). */
export function enabledFieldsFor(settings: DisplaySettings, templateId: string): OptionalDisplayField[] {
  return settings[templateId] ?? [...DEFAULT_ENABLED_FIELDS]
}
