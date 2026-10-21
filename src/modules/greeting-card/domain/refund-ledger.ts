/**
 * Ghi khoản hoàn vào sổ thu đơn Thẻ chào (PO 17/10/2026). Pure TypeScript.
 *
 * `balance_vnd` là số CÒN PHẢI THU của khách. Hoàn tiền là tiệm trả lại tiền (huỷ, đền bù, giảm sau
 * giao…), không phải khách nợ thêm — nên hoàn chỉ giảm `paid_vnd`, giữ nguyên `balance_vnd`. Trước đây
 * `balance_vnd = total - paid` sau hoàn khiến đơn đã giao + đã hoàn hiện "Thu phần tiền còn lại sau giao".
 */
export function moneyAfterRefund(
  order: { paidVnd: number; balanceVnd: number },
  refundVnd: number,
): { paidVnd: number; balanceVnd: number } {
  return { paidVnd: order.paidVnd - refundVnd, balanceVnd: Math.max(0, order.balanceVnd) }
}
