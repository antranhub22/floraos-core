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
 * Phần `filters` được phép gửi ra trang khách: chỉ `templateId`.
 * Các khóa khác (bộ lọc dịp, mức giá…) là dữ liệu nội bộ của cửa hàng.
 */
export function toPublicCatalogFilters(raw: unknown): { templateId: string } | null {
  if (!raw || typeof raw !== "object") return null
  const templateId = (raw as Record<string, unknown>).templateId
  return typeof templateId === "string" ? { templateId } : null
}
