import { z } from "zod"
import { ORDER_FIELD_MAX } from "../domain/greeting-card-rules"
import { MAX_ORDER_QUANTITY } from "../domain/brochure-pricing"

/**
 * Hình dạng thân yêu cầu đặt hoa công khai. Chỉ kiểm kiểu + độ dài ở biên;
 * luật nghiệp vụ (SĐT, ngày giao) nằm ở `validateCustomerOrderInput`.
 */
export const publicOrderBodySchema = z.object({
  customerName: z.string().max(ORDER_FIELD_MAX.name),
  customerPhone: z.string().max(20),
  recipientName: z.string().max(ORDER_FIELD_MAX.name),
  recipientPhone: z.string().max(20),
  deliveryDate: z.string().max(10),
  deliveryTimeSlot: z.string().max(ORDER_FIELD_MAX.timeSlot).optional(),
  deliveryAddress: z.string().max(ORDER_FIELD_MAX.address),
  cardMessage: z.string().max(ORDER_FIELD_MAX.cardMessage).optional(),
  senderNote: z.string().max(ORDER_FIELD_MAX.senderNote).optional(),
  variantId: z.string().max(64).optional(),
  quantity: z.number().int().min(1).max(MAX_ORDER_QUANTITY).optional(),
  shippingZoneId: z.string().max(40).optional(),
  voucherCode: z.string().trim().max(40).optional(),
})

/** Báo giá: chỉ các lựa chọn mua (+ SĐT để kiểm mã giảm giá dành riêng một khách). */
export const publicQuoteBodySchema = z.object({
  variantId: z.string().max(64).optional(),
  quantity: z.number().int().min(1).max(MAX_ORDER_QUANTITY).optional(),
  shippingZoneId: z.string().max(40).optional(),
  voucherCode: z.string().trim().max(40).optional(),
  customerPhone: z.string().max(20).optional(),
})

export function issuesToDetails(issues: z.core.$ZodIssue[]): Record<string, string> {
  const details: Record<string, string> = {}
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "body")
    details[field] ??= "Giá trị không hợp lệ hoặc quá dài"
  }
  return details
}
