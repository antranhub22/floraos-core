/**
 * Tính tiền đơn Thẻ chào: biến thể (size), số lượng, phí giao theo khu vực,
 * mã giảm giá. Pure TypeScript — dùng chung cho báo giá (quote) và tạo đơn
 * nên con số khách thấy luôn trùng con số ghi vào đơn.
 */

import { resolveProductPriceVnd } from "./brochure-commerce-rules"

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
  return { zones: zones.slice(0, 30), freeShippingOverVnd: positiveInt(raw.free_shipping_over_vnd) }
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
}

export function computeQuote(input: QuoteInput): BrochureQuote {
  const quantity = Math.min(Math.max(Math.round(input.quantity), 1), MAX_ORDER_QUANTITY)
  const subtotalVnd = input.unitPriceVnd * quantity
  const discountVnd = input.voucher ? voucherDiscountVnd(input.voucher, subtotalVnd) : 0
  const afterDiscount = subtotalVnd - discountVnd
  const free = input.shipping.freeShippingOverVnd !== null && afterDiscount >= input.shipping.freeShippingOverVnd
  const shippingFeeVnd = input.zone && !free ? input.zone.feeVnd : 0
  return {
    unitPriceVnd: input.unitPriceVnd,
    quantity,
    subtotalVnd,
    discountVnd,
    shippingFeeVnd,
    totalVnd: afterDiscount + shippingFeeVnd,
    shippingZone: input.zone ? { id: input.zone.id, name: input.zone.name } : null,
    voucherCode: input.voucher?.code ?? null,
  }
}
