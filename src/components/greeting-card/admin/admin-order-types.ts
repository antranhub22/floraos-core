export interface AdminOrder {
  id: string
  code: string
  status: string
  delivery_status: string
  total_vnd: number
  paid_vnd: number
  balance_vnd: number
  customer: { name: string; phone: string | null } | null
  greeting_sessions: Array<{ send_code: string; status: string; product_snapshot?: unknown }>
  items?: Array<{ metadata?: unknown; quantity?: number; unit_price_vnd?: number }>
  pricing_rule_ref?: unknown
  payments: Array<{ id: string; kind: string; amount_vnd: number; collected_at: string; reference: string | null }>
  created_at: string
}

export type OrderAction = { type: "quote" | "collect" | "cancel" | "refund"; order: AdminOrder }

/** Kết quả thao tác: lời báo cho Điều hành + (khi vừa thu tiền) tin soạn sẵn để gửi khách qua Zalo. */
export type ActionResult = { message: string; customerMessage?: string | undefined }

export const ORDER_FILTERS = [
  { id: "reported", label: "Khách báo đã chuyển", query: "payment=OUTSTANDING&reported=1" },
  { id: "outstanding", label: "Còn phải thu", query: "payment=OUTSTANDING" },
  { id: "paid", label: "Đã thu đủ", query: "payment=PAID" },
  { id: "cancelled", label: "Đã huỷ", query: "status=CANCELLED" },
  { id: "all", label: "Tất cả", query: "" },
] as const

export type OrderFilterId = (typeof ORDER_FILTERS)[number]["id"]

export const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`
