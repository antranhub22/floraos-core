import { describe, expect, it } from "vitest"
import { effectivePaymentPolicy, hasSavedWorkflowPolicy, isUrgentDeliveryWindow, resolveWorkflowGates } from "../workflow-gates"
import { BROCHURE_WORKFLOW_POLICY_KEY, LEAN_WORKFLOW_POLICY, STANDARD_WORKFLOW_POLICY, STRICT_WORKFLOW_POLICY, serializeWorkflowPolicy } from "../brochure-workflow-policy"
import { paymentGateBlocker } from "../brochure-payment-policy"

const wf = (p: typeof LEAN_WORKFLOW_POLICY, legacy?: Record<string, unknown>) => ({
  [BROCHURE_WORKFLOW_POLICY_KEY]: serializeWorkflowPolicy(p),
  ...(legacy ? { brochure_policy: legacy } : {}),
})

/** Quy trình vận hành là chuẩn duy nhất (PO 17/10/2026). */
describe("resolveWorkflowGates", () => {
  it("tiệm đã lưu quy trình: đọc quy trình, bỏ qua các trường trùng của chính sách thanh toán", () => {
    const settings = wf(STRICT_WORKFLOW_POLICY, { require_full_before_dispatch: false, require_product_photo_qc: false })
    expect(hasSavedWorkflowPolicy(settings)).toBe(true)
    expect(resolveWorkflowGates(settings)).toEqual({
      source: "WORKFLOW", canSkipFinishedPhoto: false, dispatchNeedsPhotoStep: true, requireFullBeforeDispatch: true, canSkipDeliveryPhoto: false,
    })
    expect(resolveWorkflowGates(wf(LEAN_WORKFLOW_POLICY, { require_full_before_dispatch: true }))).toMatchObject({
      canSkipFinishedPhoto: true, dispatchNeedsPhotoStep: false, requireFullBeforeDispatch: false, canSkipDeliveryPhoto: true,
    })
  })

  it("tiệm chưa lưu quy trình: giữ nguyên hành vi đang chạy (không đổi ngầm)", () => {
    expect(resolveWorkflowGates(null)).toEqual({
      source: "LEGACY", canSkipFinishedPhoto: true, dispatchNeedsPhotoStep: true, requireFullBeforeDispatch: false, canSkipDeliveryPhoto: true,
    })
    expect(resolveWorkflowGates({ brochure_policy: { require_full_before_dispatch: true, require_product_photo_qc: false } })).toMatchObject({
      source: "LEGACY", dispatchNeedsPhotoStep: false, requireFullBeforeDispatch: true,
    })
  })

  it("chính sách hiệu lực: máy chủ và giao diện đọc cùng một cờ thu đủ trước giao", () => {
    const settings = wf(STANDARD_WORKFLOW_POLICY, { require_full_before_dispatch: false, deposit_percent: 30 })
    const policy = effectivePaymentPolicy(settings)
    expect(policy.requireFullBeforeDispatch).toBe(true)
    expect(policy.depositPercent).toBe(30)
    expect(paymentGateBlocker("dispatch-shipping", policy, { totalVnd: 500_000, paidVnd: 0 })).toMatch(/thu đủ/)
  })

  it("đơn hoả tốc được miễn chốt thu đủ trước giao — như luật của Quy trình vận hành", () => {
    const policy = effectivePaymentPolicy(wf(STANDARD_WORKFLOW_POLICY))
    expect(paymentGateBlocker("dispatch-shipping", policy, { totalVnd: 500_000, paidVnd: 0 }, { isUrgent: true })).toBeNull()
    // Đơn cọc vẫn chờ xác nhận lần 2 (PO 11/10/2026), hoả tốc hay không
    expect(paymentGateBlocker("dispatch-shipping", policy, { totalVnd: 500_000, paidVnd: 100_000 }, { isUrgent: true })).toMatch(/lần 2/)
  })

  it("nhận diện hoả tốc từ khung giờ giao lưu trên đơn", () => {
    const now = new Date("2026-10-20T01:00:00Z") // 08:00 giờ Việt Nam
    expect(isUrgentDeliveryWindow({ date: "2026-10-20", timeSlot: "09:00 - 10:00" }, now)).toBe(true)
    expect(isUrgentDeliveryWindow({ date: "2026-10-21", timeSlot: "09:00 - 10:00" }, now)).toBe(false)
    expect(isUrgentDeliveryWindow(null, now)).toBe(false)
  })
})
