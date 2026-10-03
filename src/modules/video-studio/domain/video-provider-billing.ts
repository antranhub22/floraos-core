import { videoRenderCredit } from "@/modules/usage/domain/pricing"

/**
 * Phần credit hoàn lại sau một lượt render video nhà cung cấp (PO 25/09/2026,
 * bảng giá v1 nguyên tắc 3 "thu theo đường thật đã chạy"). Đã tính theo bên
 * đứng đầu thứ tự (`cost_plan`); worker báo bên THẬT đã dựng clip
 * (`clip_provider`) hoặc đã lùi Ken Burns cục bộ (`provider_fallback`).
 * Chỉ hoàn, không thu thêm: bên thật đắt hơn bên đã tính thì nền tảng chịu.
 */
export function videoRenderRefund(
  plan: { provider?: string | null; scenes?: number; credit?: number } | null | undefined,
  output: { clip_provider?: string | null; provider_fallback?: boolean } | null | undefined
): number {
  if (!plan || !output || typeof plan.credit !== "number" || typeof plan.scenes !== "number") return 0
  const actual = output.provider_fallback === true ? null : output.clip_provider ?? plan.provider ?? null
  return Math.max(0, plan.credit - videoRenderCredit(actual, plan.scenes))
}
