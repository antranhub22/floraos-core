import { parseBrochurePaymentConfig } from "../domain/brochure-commerce-rules"
import { parsePaymentPolicy, paymentHoldUntil } from "../domain/brochure-payment-policy"
import { buildPaymentInstructions } from "../adapters/vietqr-helper"
import type { BrochurePaymentInstructions } from "../domain/greeting-card-types"

/** Hướng dẫn chuyển khoản cho lần thu kế tiếp, theo tài khoản + chính sách của tiệm. */
export function paymentInstructionsFor(
  shopSettings: unknown,
  order: { totalVnd: number; paidVnd: number; createdAt?: Date | undefined },
  orderCode: string
): BrochurePaymentInstructions | null {
  const policy = parsePaymentPolicy(shopSettings)
  const base = buildPaymentInstructions(parseBrochurePaymentConfig(shopSettings), order, policy, orderCode)
  return base ? { ...base, holdUntil: paymentHoldUntil(policy, order) } : null
}
