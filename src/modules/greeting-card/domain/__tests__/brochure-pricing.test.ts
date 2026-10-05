import { describe, it, expect } from "vitest"
import {
  awaitingQuote,
  computeQuote,
  parseShippingConfig,
  resolvePricedVariants,
  voucherBlocker,
  voucherDiscountVnd,
  type VoucherFacts,
} from "../brochure-pricing"

const voucher = (over: Partial<VoucherFacts> = {}): VoucherFacts => ({
  id: "v1", code: "FLORA10", discountType: "PERCENTAGE", discountValue: 10, minOrderVnd: 0,
  maxDiscountVnd: null, expiresAt: null, isUsed: false, customerId: null, ...over,
})

describe("resolvePricedVariants", () => {
  it("giá riêng của biến thể, nếu không thì giá gốc × hệ số; bỏ biến thể không suy ra được giá", () => {
    const out = resolvePricedVariants({ price: 500000 }, [
      { id: "a", name: "Size M", size: null, multiplier: 1.5, attributes: null },
      { id: "b", name: "Size L", size: "L", multiplier: 2, attributes: { price: 1_200_000 } },
    ])
    expect(out).toEqual([
      { id: "a", name: "Size M", priceVnd: 750000 },
      { id: "b", name: "Size L", priceVnd: 1_200_000 },
    ])
    expect(resolvePricedVariants(null, [{ id: "c", name: "X", size: null, multiplier: 2, attributes: null }])).toEqual([])
  })
})

describe("parseShippingConfig", () => {
  it("bỏ khu vực thiếu tên/phí âm/trùng id", () => {
    const c = parseShippingConfig({
      brochure_shipping: {
        zones: [
          { id: "q1", name: "Quận 1", fee_vnd: 30000 },
          { id: "q1", name: "Trùng", fee_vnd: 1 },
          { id: "x", name: "", fee_vnd: 1 },
          { id: "y", name: "Âm", fee_vnd: -5 },
        ],
        free_shipping_over_vnd: 1_000_000,
      },
    })
    expect(c.zones).toEqual([{ id: "q1", name: "Quận 1", feeVnd: 30000 }])
    expect(c.freeShippingOverVnd).toBe(1_000_000)
    expect(parseShippingConfig(null)).toEqual({ zones: [], freeShippingOverVnd: null })
  })
})

describe("voucher", () => {
  const now = new Date("2026-10-05T00:00:00Z")
  it("chặn mã đã dùng, hết hạn, của khách khác, chưa đủ đơn tối thiểu", () => {
    expect(voucherBlocker(voucher({ isUsed: true }), 1e6, null, now)).toMatch(/đã được sử dụng/)
    expect(voucherBlocker(voucher({ expiresAt: new Date("2026-10-01") }), 1e6, null, now)).toMatch(/hết hạn/)
    expect(voucherBlocker(voucher({ customerId: "c1" }), 1e6, "c2", now)).toMatch(/khách hàng khác/)
    expect(voucherBlocker(voucher({ minOrderVnd: 2e6 }), 1e6, null, now)).toMatch(/tối thiểu/)
    expect(voucherBlocker(voucher({ customerId: "c1" }), 1e6, "c1", now)).toBeNull()
  })

  it("giảm % có trần, giảm cố định không vượt tạm tính", () => {
    expect(voucherDiscountVnd(voucher({ maxDiscountVnd: 50000 }), 1_000_000)).toBe(50000)
    expect(voucherDiscountVnd(voucher({ discountType: "FIXED_AMOUNT", discountValue: 900000 }), 500000)).toBe(500000)
  })
})

describe("computeQuote", () => {
  const shipping = { zones: [{ id: "q1", name: "Quận 1", feeVnd: 30000 }], freeShippingOverVnd: 1_500_000 }
  it("tạm tính × số lượng − giảm giá + phí giao; kẹp số lượng 1–20", () => {
    const q = computeQuote({ unitPriceVnd: 500000, quantity: 2, zone: shipping.zones[0]!, shipping, voucher: voucher() })
    expect(q).toMatchObject({ subtotalVnd: 1_000_000, discountVnd: 100000, shippingFeeVnd: 30000, totalVnd: 930000 })
    expect(computeQuote({ unitPriceVnd: 1, quantity: 99, zone: null, shipping, voucher: null }).quantity).toBe(20)
  })

  it("miễn phí giao khi sau giảm giá đạt ngưỡng", () => {
    const q = computeQuote({ unitPriceVnd: 800000, quantity: 2, zone: shipping.zones[0]!, shipping, voucher: null })
    expect(q.shippingFeeVnd).toBe(0)
    expect(q.totalVnd).toBe(1_600_000)
  })
})

describe("awaitingQuote", () => {
  it("mẫu chưa niêm yết giá: tổng 0, không phí giao, giữ khu vực và số lượng (kẹp 1–20)", () => {
    const q = awaitingQuote(50, { id: "q1", name: "Quận 1", feeVnd: 30_000 })
    expect(q).toMatchObject({ totalVnd: 0, shippingFeeVnd: 0, quantity: 20, awaitingQuote: true, shippingZone: { id: "q1" } })
  })
})
