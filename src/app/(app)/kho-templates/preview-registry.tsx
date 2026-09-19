// Registry hợp nhất — 18/09, hạ tầng cho popup xem trước trực quan trong
// Kho Templates. Gộp dữ liệu mẫu từ 7 tệp preview-data/*.tsx (chia theo
// nhóm chức năng để mỗi tệp không quá dài) thành một bảng tra cứu duy nhất
// theo tên file, khớp đúng danh sách `files` đã khai báo trong page.tsx.
import type React from "react"
import { productAnalysisPreviews } from "./preview-data/product-analysis"
import { creativeStudioPreviews } from "./preview-data/creative-studio"
import { videoStudioPreviews } from "./preview-data/video-studio"
import { contentEnginePreviews } from "./preview-data/content-engine"
import { socialPublishingPreviews, SOCIAL_PUBLISHING_SELF_MODAL_FILES } from "./preview-data/social-publishing"
import { catalogCrmOrdersPreviews } from "./preview-data/catalog-crm-orders"
import {
  chatAnalyticsPlatformPreviews,
  CHAT_ANALYTICS_PLATFORM_SELF_MODAL_FILES,
} from "./preview-data/chat-analytics-platform"

export const TEMPLATE_PREVIEW_REGISTRY: Record<string, React.ReactNode> = {
  ...productAnalysisPreviews,
  ...creativeStudioPreviews,
  ...videoStudioPreviews,
  ...contentEnginePreviews,
  ...socialPublishingPreviews,
  ...catalogCrmOrdersPreviews,
  ...chatAnalyticsPlatformPreviews,
}

/**
 * Hai template (`schedule-confirm-modal.tsx`, `connect-account-modal.tsx`)
 * tự dựng overlay `fixed inset-0 z-50` riêng của chính nó (đúng như khi
 * chạy thật trong luồng nghiệp vụ). Khi mở popup xem trước cho các file
 * này, page.tsx render thẳng component thay vì bọc thêm
 * `TemplatePreviewModal`, để tránh lồng 2 lớp overlay mờ chồng lên nhau.
 */
export const SELF_MODAL_TEMPLATE_FILES = new Set<string>([
  ...SOCIAL_PUBLISHING_SELF_MODAL_FILES,
  ...CHAT_ANALYTICS_PLATFORM_SELF_MODAL_FILES,
])
