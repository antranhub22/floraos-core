/**
 * Hoá đơn VAT của đơn Thẻ chào (PO 15/10/2026): chọn 8% hoặc 10% (mặc định 10%),
 * thông tin xuất hoá đơn tách ô riêng để lưu và dùng lại. Thuần domain.
 */

export const VAT_RATES = [8, 10] as const
export type VatRate = (typeof VAT_RATES)[number]
export const DEFAULT_VAT_RATE: VatRate = 10

export interface VatInvoiceInfo {
  companyName: string | null
  taxCode: string | null
  companyAddress: string | null
  email: string | null
}

export interface OrderVatState {
  status: string
  totalVnd: number
  paidVnd: number
  vatAmountVnd: number
}

export interface VatChange {
  enabled: boolean
  rate: VatRate
}

export interface VatTotals {
  subtotalVnd: number
  vatAmountVnd: number
  totalVnd: number
  balanceVnd: number
}

export function isVatRate(value: unknown): value is VatRate {
  return VAT_RATES.includes(value as VatRate)
}

/** Tiền thuế làm tròn tới đồng: 3.300.000 × 10% = 330.000. */
export function vatAmountOf(subtotalVnd: number, rate: VatRate): number {
  return Math.round((Math.max(0, subtotalVnd) * rate) / 100)
}

/** Giá trước thuế = tổng hiện tại − thuế đã cộng trước đó. */
export function subtotalOf(state: Pick<OrderVatState, "totalVnd" | "vatAmountVnd">): number {
  return Math.max(0, state.totalVnd - state.vatAmountVnd)
}

/** Lý do không được đổi VAT, hoặc `null` nếu được. */
export function vatChangeBlocker(state: OrderVatState, change: VatChange): string | null {
  if (state.status === "CANCELLED") return "Đơn hàng đã huỷ, không thể đổi hoá đơn VAT"
  if (state.status === "COMPLETED") return "Đơn hàng đã hoàn tất, không thể đổi hoá đơn VAT"
  if (state.totalVnd <= 0) return "Đơn đang chờ báo giá — hãy báo giá trước khi thêm VAT"
  const next = applyVat(state, change)
  if (next.totalVnd < state.paidVnd) return "Khách đã trả nhiều hơn tổng mới — hãy hoàn tiền trước khi bỏ VAT"
  return null
}

export function applyVat(state: OrderVatState, change: VatChange): VatTotals {
  const subtotalVnd = subtotalOf(state)
  const vatAmountVnd = change.enabled ? vatAmountOf(subtotalVnd, change.rate) : 0
  const totalVnd = subtotalVnd + vatAmountVnd
  return { subtotalVnd, vatAmountVnd, totalVnd, balanceVnd: totalVnd - state.paidVnd }
}

/** Chuẩn hoá ô nhập: bỏ khoảng trắng thừa, rỗng → null. */
export function normalizeInvoiceInfo(input: Partial<Record<keyof VatInvoiceInfo, string | null | undefined>>): VatInvoiceInfo {
  const clean = (v: string | null | undefined) => (v?.trim() ? v.trim() : null)
  return {
    companyName: clean(input.companyName),
    taxCode: clean(input.taxCode)?.replace(/\s+/g, "") ?? null,
    companyAddress: clean(input.companyAddress),
    email: clean(input.email),
  }
}
