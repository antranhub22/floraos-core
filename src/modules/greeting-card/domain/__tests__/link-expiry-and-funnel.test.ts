import { describe, it, expect } from "vitest"
import { computeLinkExpiry, linkAvailability } from "../greeting-card-rules"
import { buildSalesFunnel } from "../sales-funnel"

describe("computeLinkExpiry", () => {
  const now = new Date("2026-10-05T00:00:00Z")
  it("mặc định 30 ngày, null = không hết hạn, kẹp về [1, 365]", () => {
    expect(computeLinkExpiry(undefined, now)?.toISOString()).toBe("2026-11-04T00:00:00.000Z")
    expect(computeLinkExpiry(null, now)).toBeNull()
    expect(computeLinkExpiry(0, now)?.toISOString()).toBe("2026-10-06T00:00:00.000Z")
    expect(computeLinkExpiry(9999, now)?.getTime()).toBe(now.getTime() + 365 * 86_400_000)
  })
})

describe("linkAvailability", () => {
  const now = new Date("2026-10-05T00:00:00Z")
  const past = new Date("2026-10-01T00:00:00Z")
  it("hết hạn / thu hồi chỉ áp dụng khi chưa có đơn", () => {
    expect(linkAvailability({ expiresAt: past, revokedAt: null, hasOrder: false }, now)).toBe("EXPIRED")
    expect(linkAvailability({ expiresAt: null, revokedAt: past, hasOrder: false }, now)).toBe("REVOKED")
    expect(linkAvailability({ expiresAt: past, revokedAt: past, hasOrder: true }, now)).toBe("ACTIVE")
    expect(linkAvailability({ expiresAt: null, revokedAt: null, hasOrder: false }, now)).toBe("ACTIVE")
  })
})

describe("buildSalesFunnel", () => {
  it("tính tỷ lệ, sắp theo doanh thu, có dòng tổng và tên link công khai", () => {
    const { rows, total } = buildSalesFunnel(
      [
        { saleId: "u1", sent: 10, opened: 8, selected: 5, ordered: 4, paid: 3, revenueVnd: 2_000_000 },
        { saleId: "public", sent: 2, opened: 2, selected: 2, ordered: 2, paid: 1, revenueVnd: 3_000_000 },
        { saleId: "gone", sent: 3, opened: 0, selected: 0, ordered: 0, paid: 0, revenueVnd: 0 },
      ],
      new Map([["u1", "Lan"]])
    )
    expect(rows.map((r) => r.saleName)).toEqual(["Link bộ sưu tập công khai", "Lan", "Nhân viên đã rời"])
    expect(rows[1]?.openRate).toBe(80)
    expect(total.sent).toBe(15)
    expect(total.paidRate).toBe(26.7)
    expect(rows[2]?.orderRate).toBe(0)
  })
})
