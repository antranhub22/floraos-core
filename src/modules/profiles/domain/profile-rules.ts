/**
 * Luật về hồ sơ kinh doanh và hồ sơ thương hiệu — đặc tả 07 mục 4, Checklist
 * P4. Thuần: không import hạ tầng, test không cần cơ sở dữ liệu.
 */
import { isValidEmail } from "@/modules/organization/domain/credentials"

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}){1,2}$/

/** `#RGB` hoặc `#RRGGBB` — hình dạng mà LocalBudd/SocialFlow đọc trực tiếp. */
export function isValidHexColor(value: string): boolean {
  return HEX_COLOR.test(value)
}

// `| undefined` tường minh trên mọi trường tuỳ chọn — tsconfig của repo bật
// `exactOptionalPropertyTypes`, nên `field?: T` và `field?: T | undefined`
// là hai kiểu khác nhau; body JSON đã qua zod `.optional()` luôn có thể là
// `undefined` tường minh (khác PATCH tổ chức, không có trường nào optional
// kiểu này ở entities.ts vì P1/P2 chưa cần).
export type BusinessProfileInput = {
  legal_name?: string | null | undefined
  display_name: string
  phone?: string | null | undefined
  email?: string | null | undefined
  address?: string | null | undefined
  website?: string | null | undefined
  social_links?: Record<string, unknown> | null | undefined
  tax_code?: string | null | undefined
  description?: string | null | undefined
  operating_hours?: Record<string, unknown> | null | undefined
}

/**
 * `display_name` là trường bắt buộc duy nhất — mọi trường khác của hồ sơ
 * kinh doanh là tuỳ chọn (đặc tả 07 mục 4 khai `String?`). `email` được kiểm
 * bằng đúng luật của `credentials.ts` để không có hai định nghĩa "email hợp
 * lệ" khác nhau trong cùng một hệ thống.
 */
export function validateBusinessProfileInput(
  input: Pick<BusinessProfileInput, "display_name" | "email">
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (input.display_name.trim().length === 0) {
    errors.display_name = "Tên hiển thị không được để trống"
  }
  if (input.email && !isValidEmail(input.email)) {
    errors.email = "Địa chỉ thư không hợp lệ"
  }
  return errors
}

export const BRAND_COLOR_FIELDS = [
  "primary_color",
  "secondary_color",
  "accent_color",
  "background_color",
  "text_color",
] as const

export type BrandColorField = (typeof BRAND_COLOR_FIELDS)[number]

export type BrandProfileInput = {
  [K in BrandColorField]?: string | null | undefined
} & {
  font_heading?: string | null | undefined
  font_body?: string | null | undefined
  logo_asset_id?: string | null | undefined
  tone_of_voice?: string | null | undefined
  hashtags?: Record<string, unknown> | null | undefined
  cta_templates?: Record<string, unknown> | null | undefined
  forbidden_styles?: Record<string, unknown> | null | undefined
}

/**
 * Chỉ năm trường màu có hình dạng kiểm được (mã hex). Các trường Json
 * (`hashtags`/`cta_templates`/`forbidden_styles`) khác nhau theo nền tảng
 * (đặc tả 07 mục 4) nên không có một hình dạng chung để khoá ở đây — giao
 * diện tự validate theo nền tảng nó hiển thị.
 */
export function validateBrandProfileInput(
  input: Partial<Record<BrandColorField, string | null | undefined>>
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of BRAND_COLOR_FIELDS) {
    const value = input[field]
    if (value != null && value !== "" && !isValidHexColor(value)) {
      errors[field] = "Mã màu phải dạng #RGB hoặc #RRGGBB"
    }
  }
  return errors
}
