export interface AdminOrder {
  id: string
  code: string
  status: string
  delivery_status: string
  total_vnd: number
  paid_vnd: number
  balance_vnd: number
  customer: { name: string; phone: string | null } | null
  greeting_sessions: Array<{ send_code: string; status: string }>
  payments: Array<{ id: string; kind: string; amount_vnd: number; collected_at: string; reference: string | null }>
  created_at: string
}

export type OrderAction = { type: "collect" | "cancel" | "refund"; order: AdminOrder }

export const ORDER_FILTERS = [
  { id: "outstanding", label: "Còn phải thu", query: "payment=OUTSTANDING" },
  { id: "paid", label: "Đã thu đủ", query: "payment=PAID" },
  { id: "cancelled", label: "Đã huỷ", query: "status=CANCELLED" },
  { id: "all", label: "Tất cả", query: "" },
] as const

export type OrderFilterId = (typeof ORDER_FILTERS)[number]["id"]

export const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`
