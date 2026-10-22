import { describe, expect, it } from "vitest"
import {
  orderPhotoApproval,
  photoApprovalBlockerAt,
  photoApprovalDispatchBlocker,
  photoApprovalState,
  photoMilestonesOf,
  photoWasSkipped,
} from "@/modules/greeting-card/domain/photo-approval"
import { BROCHURE_WORKFLOW_POLICY_KEY, LEAN_WORKFLOW_POLICY, STANDARD_WORKFLOW_POLICY, STRICT_WORKFLOW_POLICY, serializeWorkflowPolicy } from "@/modules/greeting-card/domain/brochure-workflow-policy"

const uploadedAt = new Date("2026-10-20T08:00:00Z")
const at = (min: number) => new Date(uploadedAt.getTime() + min * 60_000)

describe("khách duyệt ảnh thành phẩm trước khi giao", () => {
  it("Bỏ qua: không chờ khách", () => {
    const s = photoApprovalState({ mode: "BYPASS", uploadedAt, customerApprovedAt: null, now: at(1) })
    expect(s.status).toBe("BYPASSED")
    expect(photoApprovalDispatchBlocker(s, at(1))).toBeNull()
  })

  it("Tự duyệt: chờ đúng số phút tiệm cài rồi tự qua", () => {
    const pending = photoApprovalState({ mode: "AUTO_PASS_10M", reviewMinutes: 10, uploadedAt, customerApprovedAt: null, now: at(4) })
    expect(pending.status).toBe("PENDING")
    expect(photoApprovalDispatchBlocker(pending, at(4))).toContain("còn 6 phút")
    expect(photoApprovalState({ mode: "AUTO_PASS_10M", reviewMinutes: 10, uploadedAt, customerApprovedAt: null, now: at(10) }).status).toBe("AUTO_APPROVED")
  })

  it("Tự duyệt nhưng tiệm tắt 'tự duyệt khi hết giờ': quá giờ vẫn chờ khách, Điều phối thấy lý do", () => {
    const s = photoApprovalState({ mode: "AUTO_PASS_10M", reviewMinutes: 10, autoApprove: false, uploadedAt, customerApprovedAt: null, now: at(60) })
    expect(s.status).toBe("PENDING")
    expect(photoApprovalDispatchBlocker(s, at(60))).toMatch(/khách bấm duyệt/)
  })

  it("Bắt buộc khách duyệt: KHÔNG tự qua dù khách im lặng bao lâu (sửa 17/10/2026 — trước tự qua sau 30 phút)", () => {
    const s = photoApprovalState({ mode: "REQUIRE_CUSTOMER", reviewMinutes: 10, uploadedAt, customerApprovedAt: null, now: at(600) })
    expect(s.status).toBe("PENDING")
    expect(s.autoApprove).toBe(false)
    expect(photoApprovalDispatchBlocker(s, at(600))).not.toBeNull()
  })

  it("khách bấm duyệt thì giao ngay; chưa có ảnh (đã bỏ qua ảnh) thì không chờ", () => {
    expect(photoApprovalState({ mode: "REQUIRE_CUSTOMER", uploadedAt, customerApprovedAt: at(2), now: at(3) }).status).toBe("APPROVED")
    expect(photoApprovalDispatchBlocker(photoApprovalState({ mode: "REQUIRE_CUSTOMER", uploadedAt: null, customerApprovedAt: null, now: at(3) }))).toBeNull()
  })

  it("tải ảnh mới sau khi khách đã duyệt → phải duyệt lại", () => {
    const m = photoMilestonesOf([
      { notes: "PRODUCT_PHOTO_UPLOADED", created_at: uploadedAt },
      { notes: "CUSTOMER_PHOTO_APPROVED", created_at: at(2) },
      { notes: "PRODUCT_PHOTO_UPLOADED", created_at: at(5) },
    ])
    expect(m.uploadedAt).toEqual(at(5))
    expect(photoApprovalState({ mode: "REQUIRE_CUSTOMER", ...m, now: at(6) }).status).toBe("PENDING")
  })

  it("chụp lại ảnh thì tính từ lần tải mới nhất", () => {
    const m = photoMilestonesOf([
      { notes: "PRODUCT_PHOTO_UPLOADED", created_at: at(20) },
      { notes: "PRODUCT_PHOTO_UPLOADED", created_at: uploadedAt },
    ])
    expect(m.uploadedAt).toEqual(at(20))
  })

  it("giao diện đếm ngược theo giờ máy, cùng lý do với máy chủ", () => {
    const s = photoApprovalState({ mode: "AUTO_PASS_10M", reviewMinutes: 10, uploadedAt, customerApprovedAt: null, now: at(1) })
    expect(photoApprovalBlockerAt(s, at(8).getTime())).toContain("còn 2 phút")
    expect(photoApprovalBlockerAt(s, at(11).getTime())).toBeNull()
  })

  it("bỏ qua ảnh = hoa xong mà không có lần tải ảnh nào", () => {
    expect(photoWasSkipped(photoApprovalState({ mode: "AUTO_PASS_10M", uploadedAt: null, customerApprovedAt: null, now: at(1) }))).toBe(true)
    expect(photoWasSkipped(photoApprovalState({ mode: "BYPASS", uploadedAt, customerApprovedAt: null, now: at(1) }))).toBe(false)
    expect(photoWasSkipped(null)).toBe(false)
  })
})

describe("orderPhotoApproval — đọc Quy trình vận hành + Thời hạn từng bước", () => {
  const order = (filters: unknown) => ({ qc_records: [{ notes: "PRODUCT_PHOTO_UPLOADED", created_at: uploadedAt }], greeting_sessions: [{ catalog: { filters } }] })
  const wf = (p: typeof LEAN_WORKFLOW_POLICY) => ({ [BROCHURE_WORKFLOW_POLICY_KEY]: serializeWorkflowPolicy(p) })

  it("chế độ theo gói tiệm chọn", () => {
    expect(orderPhotoApproval(order(null), wf(LEAN_WORKFLOW_POLICY), at(1)).status).toBe("BYPASSED")
    expect(orderPhotoApproval(order(null), wf(STRICT_WORKFLOW_POLICY), at(500)).status).toBe("PENDING")
  })

  it("tiệm chưa lưu Thời hạn từng bước: giữ số phút cũ (chính sách thanh toán, mặc định 10)", () => {
    expect(orderPhotoApproval(order(null), wf(STANDARD_WORKFLOW_POLICY), at(1)).countdownMinutes).toBe(10)
    expect(orderPhotoApproval(order(null), { ...wf(STANDARD_WORKFLOW_POLICY), brochure_policy: { product_photo_review_minutes: 20 } }, at(1)).countdownMinutes).toBe(20)
  })

  it("Thời hạn từng bước của tiệm thắng chính sách thanh toán; tắt tự duyệt → chờ khách", () => {
    const settings = { ...wf(STANDARD_WORKFLOW_POLICY), brochure_policy: { product_photo_review_minutes: 20 }, step_timeout_policy: { photo_review_timeout_minutes: 15, auto_approve_photo_on_timeout: false } }
    const s = orderPhotoApproval(order(null), settings, at(16))
    expect(s.countdownMinutes).toBe(15)
    expect(s.status).toBe("PENDING")
    expect(s.autoApprove).toBe(false)
  })

  it("thẻ chào ghi đè thời hạn > cài kiểu cũ của thẻ chào > tiệm", () => {
    const settings = { ...wf(STANDARD_WORKFLOW_POLICY), step_timeout_policy: { photo_review_timeout_minutes: 30 } }
    expect(orderPhotoApproval(order({ appliedPolicies: { photoApprovalCountdownMinutes: 5 } }), settings, at(6)).status).toBe("AUTO_APPROVED")
    const override = { stepTimeoutOverride: { enabled: true, policy: { photoReviewTimeoutMinutes: 45 } }, appliedPolicies: { photoApprovalCountdownMinutes: 5 } }
    expect(orderPhotoApproval(order(override), settings, at(6)).countdownMinutes).toBe(45)
  })
})
