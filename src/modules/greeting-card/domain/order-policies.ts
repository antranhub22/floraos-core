/**
 * Ưu đãi & Thỏa thuận áp vào một đơn Thẻ chào lúc khách đặt (Spec #2, #5). Pure TypeScript.
 * - Mỗi đơn nhận TỐI ĐA 01 ưu đãi, và chỉ ưu đãi bộ sưu tập đang áp dụng.
 *   Tiệm không cho khách chọn → luôn là ưu đãi đầu tiên, bỏ qua lựa chọn client gửi.
 * - Bộ sưu tập có thỏa thuận → khách phải xác nhận đã đọc trước khi đặt.
 * Máy chủ chụp lại đúng ưu đãi + các thỏa thuận khách đã đồng ý để lưu cùng đơn.
 */
import type { PublicAppliedPolicies } from "./store-policy"

export interface OrderPolicySnapshot {
  promotion: { id: string; title: string; customerText: string } | null
  agreements: Array<{ id: string; title: string }>
  termsConfirmed: boolean
}

export type OrderPolicyResult =
  | { ok: true; snapshot: OrderPolicySnapshot }
  | { ok: false; field: "selectedPromotionId" | "confirmedTerms"; message: string }

export function resolveOrderPolicies(
  applied: PublicAppliedPolicies,
  input: { selectedPromotionId?: string | undefined; confirmedTerms?: boolean | undefined },
): OrderPolicyResult {
  let promotion: OrderPolicySnapshot["promotion"] = null
  if (applied.promotions.length > 0) {
    const chosenId = applied.allowCustomerPromotionChoice ? input.selectedPromotionId : undefined
    if (chosenId) {
      promotion = applied.promotions.find((p) => p.id === chosenId) ?? null
      if (!promotion) {
        return { ok: false, field: "selectedPromotionId", message: "Ưu đãi đã chọn không còn áp dụng. Vui lòng chọn lại." }
      }
    } else {
      promotion = applied.promotions[0] ?? null
    }
  }

  const needsConfirm = applied.agreements.length > 0
  if (needsConfirm && input.confirmedTerms !== true) {
    return { ok: false, field: "confirmedTerms", message: "Vui lòng xác nhận đã đọc các thỏa thuận trước khi đặt hoa." }
  }

  return {
    ok: true,
    snapshot: {
      promotion: promotion ? { id: promotion.id, title: promotion.title, customerText: promotion.customerText } : null,
      agreements: applied.agreements.map((a) => ({ id: a.id, title: a.title })),
      termsConfirmed: needsConfirm,
    },
  }
}

/** Dòng ghi chú cho xưởng/Điều phối thấy ngay ưu đãi phải tặng kèm. */
export function promotionNote(snapshot: OrderPolicySnapshot): string {
  return snapshot.promotion ? `[Ưu đãi: ${snapshot.promotion.title}]` : ""
}
