/**
 * Thẻ Đơn Khách hàng — dựng nội dung xác nhận đơn gửi khách qua Zalo.
 * Thuần domain: không import Prisma/infra.
 */

export interface CustomerOrderSlipInput {
  orderCode?: string | null | undefined
  saleName?: string | null | undefined
  totalVnd?: number | null | undefined
  paidVnd?: number | null | undefined
  balanceVnd?: number | null | undefined
  productName?: string | null | undefined
  flowersSummary?: string | null | undefined
  cardMessage?: string | null | undefined
  createdAt?: string | null | undefined
  deliveryDate?: string | null | undefined
  deliveryTimeSlot?: string | null | undefined
  deliveryAddress?: string | null | undefined
  recipientName?: string | null | undefined
  customerName?: string | null | undefined
}

export interface CustomerOrderSlipLine {
  label: string
  value: string
}

const SEPARATOR = "---------------------------------------"

/** Viết gọn số tiền kiểu tiệm hoa: 330000 → "330k", 3300000 → "3tr3", 2030000 → "2tr030". */
export function formatCompactVnd(amount: number | null | undefined): string {
  const v = Math.round(amount ?? 0)
  if (v <= 0) return "0đ"
  if (v % 1000 !== 0) return `${v.toLocaleString("vi-VN")}đ`
  const thousands = v / 1000
  if (thousands < 1000) return `${thousands}k`
  const millions = Math.floor(thousands / 1000)
  const rest = thousands % 1000
  if (rest === 0) return `${millions}tr`
  if (rest % 100 === 0) return `${millions}tr${rest / 100}`
  return `${millions}tr${String(rest).padStart(3, "0")}`
}

/** "2026-05-25" hoặc ISO datetime → "25/5". Chuỗi không nhận dạng được giữ nguyên. */
export function formatDayMonth(value: string | null | undefined): string | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!m) return value
  return `${Number(m[3])}/${Number(m[2])}`
}

export function buildCustomerOrderSlipLines(input: CustomerOrderSlipInput): CustomerOrderSlipLine[][] {
  const total = input.totalVnd ?? 0
  const paid = input.paidVnd ?? 0
  const balance = input.balanceVnd ?? Math.max(total - paid, 0)
  const delivery = [formatDayMonth(input.deliveryDate), input.deliveryTimeSlot ? `(${input.deliveryTimeSlot})` : null]
    .filter(Boolean)
    .join(" ")

  const groups: CustomerOrderSlipLine[][] = [
    [
      { label: "Giá", value: formatCompactVnd(total) },
      { label: "Đã thanh toán", value: formatCompactVnd(paid) },
      { label: "Còn lại", value: formatCompactVnd(balance) },
    ],
    [{ label: "Mẫu", value: [input.productName || "Hoa tươi theo mẫu", input.flowersSummary ? `(${input.flowersSummary})` : null].filter(Boolean).join(" ") }],
    [{ label: "Nội dung", value: input.cardMessage?.trim() || "gửi sau" }],
  ]
  const created = formatDayMonth(input.createdAt)
  if (created) groups.push([{ label: "Ngày tạo đơn", value: created }])
  groups.push(
    [{ label: "Ngày giao hàng", value: delivery || "Chưa hẹn" }],
    [{ label: "Địa chỉ", value: input.deliveryAddress || "Chưa có địa chỉ" }],
    [
      { label: "Người nhận", value: input.recipientName || "Chưa có" },
      { label: "Người gửi", value: input.customerName || "Chưa có" },
    ],
  )
  return groups
}

export function buildCustomerOrderSlipText(input: CustomerOrderSlipInput): string {
  const header = [`Xác nhận đơn hàng #${input.orderCode || "---"}`]
  if (input.saleName) header.push(`Nhân viên tư vấn: ${input.saleName}`)
  const body = buildCustomerOrderSlipLines(input).map((g) => g.map((l) => `${l.label}: ${l.value}`).join("\n"))
  return [header.join("\n"), ...body].join(`\n${SEPARATOR}\n`)
}
