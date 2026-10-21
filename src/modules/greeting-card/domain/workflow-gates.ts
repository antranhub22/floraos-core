/**
 * Chốt chặn vận hành Thẻ chào — MỘT nguồn sự thật cho máy chủ và mọi màn Điều phối (PO 17/10/2026).
 *
 * THỨ TỰ ƯU TIÊN (đọc từ `organizations.settings`):
 *   1. `brochure_workflow_policy` ("Quy trình vận hành") — khi tiệm ĐÃ LƯU quy trình, đây là chuẩn duy nhất
 *      cho: bắt buộc ảnh thành phẩm, thu đủ trước khi giao (kèm miễn cho đơn hoả tốc), bắt buộc ảnh bàn giao.
 *      Các trường trùng trong `brochure_policy` ("Chính sách thanh toán") khi đó chỉ để hiển thị, bị bỏ qua.
 *   2. Tiệm CHƯA từng lưu quy trình → giữ nguyên hành vi đang chạy (không đổi ngầm):
 *      - thu đủ trước khi giao = `brochure_policy.require_full_before_dispatch` (mặc định tắt);
 *      - giao ship phải qua bước ảnh (đã chụp hoặc đã bấm bỏ qua) = `brochure_policy.require_product_photo_qc`
 *        (mặc định bật);
 *      - được bỏ qua ảnh thành phẩm / ảnh bàn giao = có (PO 15/10/2026: chỉ gói Nghiêm ngặt khoá nút bỏ qua).
 *
 * Thời gian chờ khách duyệt ảnh: xem `photo-review-timing.ts`.
 * Pure TypeScript — không Prisma, không I/O.
 */

import { BROCHURE_WORKFLOW_POLICY_KEY, isUrgentOrder, parseBrochureWorkflowPolicy } from "./brochure-workflow-policy"
import { parsePaymentPolicy, type BrochurePaymentPolicy } from "./brochure-payment-policy"

export type WorkflowGateSource = "WORKFLOW" | "LEGACY"

export interface WorkflowGates {
  /** Nguồn đang áp dụng: quy trình đã lưu, hay chính sách thanh toán cũ (tiệm chưa lưu quy trình). */
  source: WorkflowGateSource
  /** Điều phối được bấm "Bỏ qua ảnh thành phẩm". */
  canSkipFinishedPhoto: boolean
  /** Giao ship chỉ khi hoa đã qua bước ảnh (đã chụp hoặc đã bỏ qua ảnh) — `false` = giao thẳng được. */
  dispatchNeedsPhotoStep: boolean
  /** Thu đủ tiền trước khi giao (đơn hoả tốc được miễn — xem `paymentGateBlocker`). */
  requireFullBeforeDispatch: boolean
  /** Điều phối được bấm "Bỏ qua ảnh bàn giao" (hoàn tất không cần ảnh người nhận). */
  canSkipDeliveryPhoto: boolean
}

function settingsRoot(settings: unknown): Record<string, unknown> {
  return settings && typeof settings === "object" ? (settings as Record<string, unknown>) : {}
}

/** Tiệm đã lưu "Quy trình vận hành" chưa (khoá `brochure_workflow_policy` là object). */
export function hasSavedWorkflowPolicy(settings: unknown): boolean {
  const raw = settingsRoot(settings)[BROCHURE_WORKFLOW_POLICY_KEY]
  return Boolean(raw) && typeof raw === "object"
}

export function resolveWorkflowGates(settings: unknown): WorkflowGates {
  if (hasSavedWorkflowPolicy(settings)) {
    const wf = parseBrochureWorkflowPolicy(settings)
    return {
      source: "WORKFLOW",
      canSkipFinishedPhoto: !wf.requireFinishedPhoto,
      dispatchNeedsPhotoStep: wf.requireFinishedPhoto,
      requireFullBeforeDispatch: wf.requireFullPaymentBeforeDispatch,
      canSkipDeliveryPhoto: !wf.requireDeliveryProofPhoto,
    }
  }
  const legacy = parsePaymentPolicy(settings)
  return {
    source: "LEGACY",
    canSkipFinishedPhoto: true,
    dispatchNeedsPhotoStep: legacy.requireProductPhotoQC !== false,
    requireFullBeforeDispatch: legacy.requireFullBeforeDispatch,
    canSkipDeliveryPhoto: true,
  }
}

/**
 * Chính sách thanh toán đã thay các trường trùng bằng giá trị hiệu lực của `resolveWorkflowGates` —
 * máy chủ và giao diện Điều phối đọc qua hàm này thay cho `parsePaymentPolicy` khi xét chốt giao hoa.
 */
export function effectivePaymentPolicy(settings: unknown): BrochurePaymentPolicy {
  return withWorkflowGates(parsePaymentPolicy(settings), resolveWorkflowGates(settings))
}

export function withWorkflowGates(policy: BrochurePaymentPolicy, gates: WorkflowGates): BrochurePaymentPolicy {
  return {
    ...policy,
    requireFullBeforeDispatch: gates.requireFullBeforeDispatch,
    requireProductPhotoQC: gates.dispatchNeedsPhotoStep,
    requireRecipientPhoto: !gates.canSkipDeliveryPhoto,
  }
}

/** Đơn hoả tốc theo khung giờ giao lưu trong `orders.delivery_window` — cùng luật với thẻ đơn. */
export function isUrgentDeliveryWindow(deliveryWindow: unknown, now: Date = new Date()): boolean {
  const w = (deliveryWindow && typeof deliveryWindow === "object" ? deliveryWindow : {}) as { date?: unknown; timeSlot?: unknown }
  return isUrgentOrder(
    { deliveryDate: typeof w.date === "string" ? w.date : null, deliveryTimeSlot: typeof w.timeSlot === "string" ? w.timeSlot : null },
    now,
  )
}
