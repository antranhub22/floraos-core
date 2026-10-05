/**
 * Domain Registry for Greeting Card Templates (Mẫu Thẻ Chào).
 * Pure TypeScript — No Prisma or external infrastructure imports.
 */

import type {
  GreetingTemplateId,
  GreetingCardTemplateDef,
  TemplateCategory,
} from "./greeting-template-types"
import { GREETING_TEMPLATES } from "./greeting-template-catalog"
import { enabledFieldsFor, readDisplaySettings, type OptionalDisplayField } from "./display-fields"

export type { GreetingTemplateId, GreetingCardTemplateDef, TemplateCategory }
export { GREETING_TEMPLATES }

export const GREETING_TEMPLATE_LIST: GreetingCardTemplateDef[] = Object.values(GREETING_TEMPLATES)

/** 12 phong cách vuốt thẻ cốt lõi theo SSOT */
export const SWIPE_12_STYLES: GreetingCardTemplateDef[] = GREETING_TEMPLATE_LIST.filter(
  (t) => t.styleNumber !== undefined
)

/**
 * Phân giải templateId hợp lệ, mặc định fallback về editorial-luxury.
 */
export function resolveGreetingTemplateId(candidate?: string | null): GreetingTemplateId {
  if (!candidate) return "editorial-luxury"
  if (candidate in GREETING_TEMPLATES) {
    return candidate as GreetingTemplateId
  }
  return "editorial-luxury"
}

/**
 * Phần cấu hình được phép gửi ra trang khách: mẫu đang dùng và các trường thông tin
 * cửa hàng bật cho mẫu đó. Các khóa khác của `filters` (bộ lọc dịp, mức giá…) và của
 * `organizations.settings` là dữ liệu nội bộ, không gửi ra.
 */
export function toPublicCatalogFilters(
  raw: unknown,
  orgSettings?: unknown,
): { templateId: string; displayFields: OptionalDisplayField[] } | null {
  const rawId = raw && typeof raw === "object" ? (raw as Record<string, unknown>).templateId : undefined
  const templateId = resolveGreetingTemplateId(typeof rawId === "string" ? rawId : null)
  const displayFields = enabledFieldsFor(readDisplaySettings(orgSettings), templateId)
  if (typeof rawId !== "string" && orgSettings === undefined) return null
  return { templateId, displayFields }
}
