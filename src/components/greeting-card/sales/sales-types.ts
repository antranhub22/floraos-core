export interface CatalogOption {
  id: string
  name: string
  code: string
}

export interface SessionRow {
  id: string
  send_code: string
  customer_name: string | null
  customer_phone: string | null
  status: string
  order_id: string | null
  expires_at: string | null
  link_state: "ACTIVE" | "EXPIRED" | "REVOKED"
  last_active_at: string
  catalog: { id: string; name: string; code: string }
  order: { id: string; code: string; status: string; total_vnd: number; paid_vnd: number } | null
}

export const SESSION_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  CREATED: { label: "Chưa mở link", className: "bg-surface-muted text-text-muted" },
  OPENED: { label: "Đang xem mẫu hoa", className: "bg-warning/15 text-warning" },
  BROWSING: { label: "Đang xem mẫu hoa", className: "bg-warning/15 text-warning" },
  SELECTED: { label: "Đã chọn mẫu hoa", className: "bg-primary/10 text-primary" },
  ORDER_SUBMITTED: { label: "Đã tạo đơn hàng", className: "bg-info-bg text-info" },
  PAYMENT_REPORTED: { label: "Khách báo đã chuyển tiền", className: "bg-warning-bg text-warning" },
  COMPLETED: { label: "Đã xác nhận thanh toán", className: "bg-success-bg text-success" },
}

export const LINK_EXPIRY_OPTIONS: Array<{ value: string; label: string; days: number | null }> = [
  { value: "7", label: "7 ngày", days: 7 },
  { value: "30", label: "30 ngày (mặc định)", days: 30 },
  { value: "90", label: "90 ngày", days: 90 },
  { value: "never", label: "Không hết hạn", days: null },
]
