/**
 * Tính tiền đơn Thẻ chào: biến thể (size), số lượng, phí giao theo khu vực,
 * mã giảm giá. Pure TypeScript — dùng chung cho báo giá (quote) và tạo đơn
 * nên con số khách thấy luôn trùng con số ghi vào đơn.
 */

import { resolveProductPriceVnd } from "./brochure-commerce-rules"
import { DELIVERY_SLOT_IDS } from "./delivery-schedule"
import { promotionDiscountVnd, promotionWaivesShipping, type PromotionPricing } from "./promotion-pricing"
import { parseSlotCapacity, type SlotCapacityConfig } from "./slot-capacity"

export const MAX_ORDER_QUANTITY = 20

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function positiveInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : null
}

// ── Biến thể ─────────────────────────────────────────────────────────────────

export interface PricedVariant {
  id: string
  name: string
  priceVnd: number
}

/**
 * Giá từng biến thể: `variant.attributes.price` nếu có, ngược lại giá gốc ×
 * `multiplier`. Biến thể không suy ra được giá thì bị bỏ (không bán online).
 */
export function resolvePricedVariants(
  productAttributes: unknown,
  variants: Array<{ id: string; name: string; size?: string | null; multiplier: number; attributes: unknown }>
): PricedVariant[] {
  const base = resolveProductPriceVnd(productAttributes)
  const out: PricedVariant[] = []
  for (const v of variants) {
    const own = positiveInt(asRecord(v.attributes).price)
    const derived = base !== null && v.multiplier > 0 ? Math.round(base * v.multiplier) : null
    const priceVnd = own ?? derived
    if (priceVnd === null) continue
    const label = v.size && !v.name.includes(v.size) ? `${v.name} (${v.size})` : v.name
    out.push({ id: v.id, name: label, priceVnd })
  }
  return out
}

// ── Phí giao theo khu vực ────────────────────────────────────────────────────

export const BROCHURE_SHIPPING_SETTINGS_KEY = "brochure_shipping"

export interface ShippingZone {
  id: string
  name: string
  feeVnd: number
}

export interface ShippingConfig {
  zones: ShippingZone[]
  /** Miễn phí giao khi tạm tính (sau giảm giá) từ mức này; null = không miễn. */
  freeShippingOverVnd: number | null
  /** Sau giờ này (0–23, giờ VN) không nhận giao trong ngày; null = không giới hạn. */
  sameDayCutoffHour?: number | null
  /** Số giờ cần để cắm + giao trước khi hết khung giờ khách chọn (mặc định 0). */
  prepHours?: number
  /** Id khung giờ 2 tiếng đang bật (`delivery_slots`); thiếu = bật tất cả. */
  slotIds?: string[]
  /** Cho khách nhập giờ cụ thể (`allow_custom_time`); thiếu = cho phép. */
  allowCustomTime?: boolean
  /** Miễn phí giao cho MỌI đơn (`free_shipping_all`, PO 08/10/2026); thiếu = tính phí theo khu vực. */
  freeShippingAll?: boolean
  /** Cho khách nhập mã giảm giá (`voucher_enabled`); thiếu = ẩn ô nhập, máy chủ bỏ qua mã gửi lên. */
  vouchersEnabled?: boolean
  /** Trần đơn mỗi khung giờ (`slot_capacity`); thiếu = 100 đơn/khung (`slot-capacity.ts`). */
  slotCapacity?: SlotCapacityConfig
}

/** Đọc `organizations.settings.brochure_shipping`; sai/thiếu → không khu vực nào (phí 0, báo sau). */
export function parseShippingConfig(settings: unknown): ShippingConfig {
  const raw = asRecord(asRecord(settings)[BROCHURE_SHIPPING_SETTINGS_KEY])
  const zones: ShippingZone[] = []
  const seen = new Set<string>()
  for (const z of Array.isArray(raw.zones) ? raw.zones : []) {
    const r = asRecord(z)
    const id = typeof r.id === "string" ? r.id.trim().slice(0, 40) : ""
    const name = typeof r.name === "string" ? r.name.trim().slice(0, 80) : ""
    const fee = typeof r.fee_vnd === "number" && Number.isFinite(r.fee_vnd) && r.fee_vnd >= 0 ? Math.round(r.fee_vnd) : null
    if (!id || !name || fee === null || seen.has(id)) continue
    seen.add(id)
    zones.push({ id, name, feeVnd: fee })
  }
  const cutoff = raw.same_day_cutoff_hour
  const prep = raw.prep_hours
  return {
    zones: zones.slice(0, 30),
    freeShippingOverVnd: positiveInt(raw.free_shipping_over_vnd),
    // Chỉ thêm khoá khi tiệm đã cấu hình — cấu hình cũ giữ nguyên hình dạng
    ...(typeof cutoff === "number" && Number.isInteger(cutoff) && cutoff >= 1 && cutoff <= 23 ? { sameDayCutoffHour: cutoff } : {}),
    ...(typeof prep === "number" && Number.isFinite(prep) && prep > 0 && prep <= 24 ? { prepHours: Math.round(prep) } : {}),
    ...parseSlotSettings(raw.delivery_slots, raw.allow_custom_time),
    ...(raw.free_shipping_all === true ? { freeShippingAll: true } : {}),
    ...(raw.voucher_enabled === true ? { vouchersEnabled: true } : {}),
    ...(raw.slot_capacity ? { slotCapacity: parseSlotCapacity(raw.slot_capacity) } : {}),
  }
}

// ── Mã giảm giá ──────────────────────────────────────────────────────────────

export interface VoucherFacts {
  id: string
  code: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: number
  minOrderVnd: number
  maxDiscountVnd: number | null
  expiresAt: Date | null
  isUsed: boolean
  /** Mã gắn riêng một khách (null = công khai). */
  customerId: string | null
}

/** Lý do mã không dùng được (tiếng Việt) hoặc `null`. */
export function voucherBlocker(
  v: VoucherFacts,
  subtotalVnd: number,
  customerId: string | null,
  now: Date = new Date()
): string | null {
  if (v.isUsed) return "Mã giảm giá đã được sử dụng"
  if (v.expiresAt && v.expiresAt.getTime() <= now.getTime()) return "Mã giảm giá đã hết hạn"
  if (v.customerId && v.customerId !== customerId) return "Mã giảm giá này dành riêng cho một khách hàng khác"
  if (subtotalVnd < v.minOrderVnd) {
    return `Đơn tối thiểu ${v.minOrderVnd.toLocaleString("vi-VN")} đ để dùng mã này`
  }
  return null
}

export function voucherDiscountVnd(v: VoucherFacts, subtotalVnd: number): number {
  const raw = v.discountType === "PERCENTAGE" ? Math.round((subtotalVnd * v.discountValue) / 100) : Math.round(v.discountValue)
  const capped = v.maxDiscountVnd !== null ? Math.min(raw, v.maxDiscountVnd) : raw
  return Math.max(0, Math.min(capped, subtotalVnd))
}

// ── Báo giá ──────────────────────────────────────────────────────────────────

export interface QuoteInput {
  unitPriceVnd: number
  quantity: number
  zone: ShippingZone | null
  shipping: ShippingConfig
  voucher: VoucherFacts | null
  /** Ưu đãi khách chọn (tối đa 01) — máy chủ tự tính, không nhận số tiền từ client. */
  promotion?: PromotionPricing | null | undefined
}

export interface BrochureQuote {
  unitPriceVnd: number
  quantity: number
  subtotalVnd: number
  discountVnd: number
  shippingFeeVnd: number
  totalVnd: number
  shippingZone: { id: string; name: string } | null
  voucherCode: string | null
  /** Số tiền ưu đãi "Giảm %" đã trừ trên tổng đơn (chỉ có khi > 0). */
  promotionDiscountVnd?: number
  /** Mẫu chưa niêm yết giá: đơn được nhận với tổng 0, cửa hàng báo giá sau. */
  awaitingQuote?: boolean
}

export function computeQuote(input: QuoteInput): BrochureQuote {
  const quantity = Math.min(Math.max(Math.round(input.quantity), 1), MAX_ORDER_QUANTITY)
  const subtotalVnd = input.unitPriceVnd * quantity
  const discountVnd = input.voucher ? voucherDiscountVnd(input.voucher, subtotalVnd) : 0
  const afterDiscount = subtotalVnd - discountVnd
  const free =
    input.shipping.freeShippingAll === true ||
    promotionWaivesShipping(input.promotion) ||
    (input.shipping.freeShippingOverVnd !== null && afterDiscount >= input.shipping.freeShippingOverVnd)
  const shippingFeeVnd = input.zone && !free ? input.zone.feeVnd : 0
  // PO 08/10/2026: "Giảm %" tính trên TỔNG đơn (tiền hoa sau mã giảm giá + phí giao)
  const promoVnd = promotionDiscountVnd(input.promotion, afterDiscount + shippingFeeVnd)
  return {
    unitPriceVnd: input.unitPriceVnd,
    quantity,
    subtotalVnd,
    discountVnd,
    shippingFeeVnd,
    totalVnd: afterDiscount + shippingFeeVnd - promoVnd,
    ...(promoVnd > 0 ? { promotionDiscountVnd: promoVnd } : {}),
    shippingZone: input.zone ? { id: input.zone.id, name: input.zone.name } : null,
    voucherCode: input.voucher?.code ?? null,
  }
}

/**
 * Báo giá cho mẫu chưa niêm yết giá: chưa tính tiền hàng, phí giao hay giảm
 * giá — cửa hàng báo trọn gói sau khi nhận đơn.
 */
export function awaitingQuote(quantity: number, zone: ShippingZone | null): BrochureQuote {
  return {
    unitPriceVnd: 0,
    quantity: Math.min(Math.max(Math.round(quantity), 1), MAX_ORDER_QUANTITY),
    subtotalVnd: 0,
    discountVnd: 0,
    shippingFeeVnd: 0,
    totalVnd: 0,
    shippingZone: zone ? { id: zone.id, name: zone.name } : null,
    voucherCode: null,
    awaitingQuote: true,
  }
}

/** Khung giờ bật/tắt: chỉ giữ id hợp lệ; tắt hết khung và tắt giờ cụ thể → về mặc định (luôn còn lựa chọn). */
function parseSlotSettings(slots: unknown, allowCustom: unknown): Pick<ShippingConfig, "slotIds" | "allowCustomTime"> {
  const out: Pick<ShippingConfig, "slotIds" | "allowCustomTime"> = {}
  if (Array.isArray(slots)) out.slotIds = DELIVERY_SLOT_IDS.filter((id) => slots.includes(id))
  if (allowCustom === false) out.allowCustomTime = false
  if (out.slotIds?.length === 0 && out.allowCustomTime === false) return {}
  return out
}
