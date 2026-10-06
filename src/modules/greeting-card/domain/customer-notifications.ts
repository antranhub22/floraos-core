/**
 * Thông báo khách theo mốc đơn Thẻ chào (Zalo ZNS / SMS). Pure TypeScript.
 */

export const NOTIFY_EVENTS = ["ORDER_RECEIVED", "QUOTED", "PAYMENT_REMINDER", "DEPOSIT_RECEIVED", "PAYMENT_COMPLETED", "READY", "DISPATCHED", "DELIVERED", "CANCELLED"] as const
export type NotifyEvent = (typeof NOTIFY_EVENTS)[number]

export const NOTIFY_EVENT_LABELS: Record<NotifyEvent, string> = {
  ORDER_RECEIVED: "Đã nhận đơn",
  QUOTED: "Đã báo giá",
  PAYMENT_REMINDER: "Nhắc chuyển khoản",
  DEPOSIT_RECEIVED: "Đã nhận tiền cọc",
  PAYMENT_COMPLETED: "Đã thanh toán đủ",
  READY: "Hoa đã cắm xong",
  DISPATCHED: "Đang giao hoa",
  DELIVERED: "Giao hoa thành công",
  CANCELLED: "Đơn bị huỷ",
}

export type NotifyChannel = "ZNS" | "ESMS"

/** Tham số gửi kèm mẫu tin — tên khoá trùng với tham số khai trong mẫu ZNS đã duyệt. */
export interface NotifyParams {
  order_code: string
  customer_name: string
  shop_name: string
  status: string
  amount: string
  tracking_url: string
}

/** `0912345678` / `+84912345678` → `84912345678` (định dạng ZNS & eSMS). `null` nếu không phải số VN. */
export function toInternationalPhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "")
  if (/^0[35789]\d{8}$/.test(digits)) return `84${digits.slice(1)}`
  if (/^84[35789]\d{8}$/.test(digits)) return digits
  return null
}

/** Che SĐT khi lưu nhật ký: 84912***678. */
export function maskPhone(phone: string): string {
  return phone.length > 6 ? `${phone.slice(0, 5)}***${phone.slice(-3)}` : "***"
}

function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
}

/**
 * Nội dung SMS (không dấu — tin brandname có dấu tính gấp đôi phí và dễ lỗi
 * mã hoá). Giữ dưới 160 ký tự khi có thể.
 */
export function smsText(event: NotifyEvent, p: NotifyParams): string {
  const body: Record<NotifyEvent, string> = {
    ORDER_RECEIVED: `${p.shop_name}: Da nhan don ${p.order_code}. Cua hang se bao khi nhan duoc thanh toan va khi hoa duoc giao.`,
    QUOTED: `${p.shop_name}: Don ${p.order_code} da co gia ${p.amount}. Mo link de xem ma QR thanh toan.`,
    PAYMENT_REMINDER: `${p.shop_name}: Don ${p.order_code} dang cho chuyen khoan ${p.amount}. Mo link de xem ma QR.`,
    DEPOSIT_RECEIVED: `${p.shop_name}: Da nhan tien coc ${p.amount} cho don ${p.order_code}.`,
    PAYMENT_COMPLETED: `${p.shop_name}: Da nhan du ${p.amount} cho don ${p.order_code}. Cam on quy khach!`,
    READY: `${p.shop_name}: Hoa don ${p.order_code} da cam xong, chuan bi giao.`,
    DISPATCHED: `${p.shop_name}: Don ${p.order_code} dang duoc giao den nguoi nhan.`,
    DELIVERED: `${p.shop_name}: Don ${p.order_code} da giao thanh cong. Cam on quy khach!`,
    CANCELLED: `${p.shop_name}: Don ${p.order_code} da duoc huy. Lien he cua hang neu can ho tro.`,
  }
  const link = p.tracking_url ? ` Theo doi: ${p.tracking_url}` : ""
  return stripDiacritics(body[event] + link).slice(0, 306)
}

/** Mốc thanh toán: lần thu chưa đủ → DEPOSIT_RECEIVED, thu đủ → PAYMENT_COMPLETED. */
export function paymentNotifyEvent(balanceAfterVnd: number): NotifyEvent {
  return balanceAfterVnd > 0 ? "DEPOSIT_RECEIVED" : "PAYMENT_COMPLETED"
}
