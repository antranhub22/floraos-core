import { parseBrochurePaymentConfig } from "../domain/brochure-commerce-rules"
import { parsePaymentPolicy } from "../domain/brochure-payment-policy"
import { buildPaymentInstructions } from "../adapters/vietqr-helper"
import type { BrochurePaymentInstructions } from "../domain/greeting-card-types"

/** Hướng dẫn chuyển khoản cho lần thu kế tiếp, theo tài khoản + chính sách của tiệm. */
export function paymentInstructionsFor(
  shopSettings: unknown,
  order: { totalVnd: number; paidVnd: number },
  orderCode: string
): BrochurePaymentInstructions | null {
  return buildPaymentInstructions(
    parseBrochurePaymentConfig(shopSettings),
    order,
    parsePaymentPolicy(shopSettings),
    orderCode
  )
}
