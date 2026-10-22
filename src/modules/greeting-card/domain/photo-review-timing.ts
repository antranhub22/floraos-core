/**
 * Thời gian chờ khách duyệt ảnh thành phẩm và có tự duyệt khi hết giờ không (PO 17/10/2026).
 *
 * Chế độ duyệt (Bỏ qua / Tự duyệt / Bắt buộc khách) lấy từ "Quy trình vận hành" (`brochure_workflow_policy`).
 *
 * SỐ PHÚT CHỜ — thứ tự ưu tiên:
 *   1. Thẻ chào ghi đè "Thời hạn từng bước": `greeting_catalogs.filters.stepTimeoutOverride.policy.photoReviewTimeoutMinutes`
 *   2. Thẻ chào cài kiểu cũ: `filters.appliedPolicies.photoApprovalCountdownMinutes`
 *   3. "Thời hạn từng bước" của tiệm: `settings.step_timeout_policy.photo_review_timeout_minutes` (khi tiệm đã lưu)
 *   4. Tiệm chưa lưu thời hạn từng bước: `settings.brochure_policy.product_photo_review_minutes` (mặc định 10 — giữ
 *      đúng số phút tiệm cũ đang chạy, không đổi ngầm sang 15)
 *
 * TỰ DUYỆT KHI HẾT GIỜ:
 *   - "Bắt buộc khách bấm duyệt": KHÔNG BAO GIỜ tự duyệt — đơn chờ khách thật (trước đây tự qua sau 30 phút).
 *   - "Tự duyệt": theo công tắc `autoApprovePhotoOnTimeout` (Thẻ chào ghi đè > tiệm; tiệm chưa lưu = bật).
 *     Tắt → hết giờ vẫn chờ khách, Điều phối thấy lý do rõ.
 * Pure TypeScript — không Prisma, không I/O.
 */

import { parseBrochureWorkflowPolicy, type CustomerApprovalMode } from "./brochure-workflow-policy"
import { parsePaymentPolicy } from "./brochure-payment-policy"
import { parseCatalogTimeoutOverride, parseStepTimeoutPolicy, STEP_TIMEOUT_SETTINGS_KEY } from "./step-timeout-policy"

export const DEFAULT_PHOTO_REVIEW_MINUTES = 10

export type PhotoReviewMinutesSource = "CATALOG_OVERRIDE" | "CATALOG_LEGACY" | "STEP_TIMEOUT" | "PAYMENT_POLICY"

export interface PhotoReviewTiming {
  mode: CustomerApprovalMode
  /** Số phút chờ khách trước khi (nếu được) tự duyệt */
  minutes: number
  /** Hết giờ có tự coi như khách đồng ý không */
  autoApprove: boolean
  minutesSource: PhotoReviewMinutesSource
}

function hasSavedStepTimeout(settings: unknown): boolean {
  const raw = settings && typeof settings === "object" ? (settings as Record<string, unknown>)[STEP_TIMEOUT_SETTINGS_KEY] : null
  return Boolean(raw) && typeof raw === "object"
}

function positiveMinutes(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : null
}

export function resolvePhotoReviewTiming(shopSettings: unknown, catalogFilters?: unknown): PhotoReviewTiming {
  const mode = parseBrochureWorkflowPolicy(shopSettings).customerApprovalMode
  const override = parseCatalogTimeoutOverride(catalogFilters)?.policy
  const legacyCatalog = positiveMinutes(
    (catalogFilters as { appliedPolicies?: { photoApprovalCountdownMinutes?: unknown } } | null | undefined)?.appliedPolicies?.photoApprovalCountdownMinutes,
  )
  const storeSaved = hasSavedStepTimeout(shopSettings)
  const store = parseStepTimeoutPolicy(shopSettings)

  let minutes: number
  let minutesSource: PhotoReviewMinutesSource
  if (override?.photoReviewTimeoutMinutes !== undefined) {
    minutes = override.photoReviewTimeoutMinutes
    minutesSource = "CATALOG_OVERRIDE"
  } else if (legacyCatalog !== null) {
    minutes = legacyCatalog
    minutesSource = "CATALOG_LEGACY"
  } else if (storeSaved) {
    minutes = store.photoReviewTimeoutMinutes
    minutesSource = "STEP_TIMEOUT"
  } else {
    minutes = positiveMinutes(parsePaymentPolicy(shopSettings).productPhotoReviewMinutes) ?? DEFAULT_PHOTO_REVIEW_MINUTES
    minutesSource = "PAYMENT_POLICY"
  }

  const autoSetting = override?.autoApprovePhotoOnTimeout ?? (storeSaved ? store.autoApprovePhotoOnTimeout : true)
  return { mode, minutes, autoApprove: mode === "AUTO_PASS_10M" && autoSetting, minutesSource }
}
