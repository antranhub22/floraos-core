/**
 * Các trang tính của `du-lieu-cua-hang.xlsx` — cột tiếng Việt, chỉ dữ liệu đang dùng
 * (mục trong Thùng rác chỉ có ở `data.json`). Pure TypeScript.
 */

type Row = Record<string, unknown>
export interface SheetSpec {
  name: string
  rows: Array<Record<string, string | number | boolean | null>>
}

const VN_OFFSET_MS = 7 * 60 * 60 * 1000

function vnDate(value: unknown): string {
  if (!(value instanceof Date)) return ""
  return new Date(value.getTime() + VN_OFFSET_MS).toISOString().replace("T", " ").slice(0, 16)
}

function num(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number") return value
  const maybe = value as { toNumber?: () => number }
  if (typeof maybe.toNumber === "function") return maybe.toNumber()
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function str(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

function active(rows: Row[]): Row[] {
  return rows.filter((row) => !row["deleted_at"])
}

const PRODUCT_STATUS: Record<string, string> = { DRAFT: "Nháp", ACTIVE: "Đang bán", ARCHIVED: "Ngừng kinh doanh" }
const ORDER_STATUS: Record<string, string> = {
  DRAFT: "Nháp", CONFIRMED: "Đã xác nhận", PROCESSING: "Đang làm", DELIVERED: "Đã giao", COMPLETED: "Hoàn tất", CANCELLED: "Đã huỷ",
}

export function buildStoreSheets(data: {
  products: Row[]
  customers: Row[]
  orders: Row[]
  order_items: Row[]
  vouchers: Row[]
}): SheetSpec[] {
  const customerName = new Map(data.customers.map((c) => [c["id"], str(c["name"])]))
  const itemCount = new Map<unknown, number>()
  for (const item of data.order_items) {
    itemCount.set(item["order_id"], (itemCount.get(item["order_id"]) ?? 0) + (num(item["quantity"]) ?? 0))
  }

  return [
    {
      name: "Sản phẩm",
      rows: active(data.products).map((p) => {
        const attrs = (p["attributes"] as Row | null) ?? {}
        return {
          "Mã": str(p["code"]),
          "Tên": str(p["name"]),
          "Loại": str(p["category"]),
          "Trạng thái": PRODUCT_STATUS[str(p["status"])] ?? str(p["status"]),
          "Giá (VNĐ)": num(attrs["price"]),
          "Ngày tạo": vnDate(p["created_at"]),
        }
      }),
    },
    {
      name: "Khách hàng",
      rows: active(data.customers).map((c) => ({
        "Mã": str(c["code"]),
        "Tên": str(c["name"]),
        "Số điện thoại": str(c["phone"]),
        "Email": str(c["email"]),
        "Địa chỉ": str(c["address"]),
        "Hạng": str(c["tier"]),
        "Tổng chi tiêu (VNĐ)": num(c["total_spent"]),
        "Số đơn": num(c["order_count"]),
        "Ghi chú": str(c["notes"]),
      })),
    },
    {
      name: "Đơn hàng",
      rows: data.orders.map((o) => ({
        "Mã đơn": str(o["code"]),
        "Khách hàng": customerName.get(o["customer_id"]) ?? "",
        "Trạng thái": ORDER_STATUS[str(o["status"])] ?? str(o["status"]),
        "Số lượng": itemCount.get(o["id"]) ?? 0,
        "Tổng tiền (VNĐ)": num(o["total_vnd"]),
        "Đã thu (VNĐ)": num(o["paid_vnd"]),
        "Còn lại (VNĐ)": num(o["balance_vnd"]),
        "Lời nhắn thiệp": str(o["card_message"]),
        "Ngày tạo": vnDate(o["created_at"]),
      })),
    },
    {
      name: "Mã giảm giá",
      rows: active(data.vouchers).map((v) => ({
        "Mã": str(v["code"]),
        "Kiểu giảm": v["discount_type"] === "PERCENTAGE" ? "Phần trăm" : "Số tiền",
        "Mức giảm": num(v["discount_value"]),
        "Đơn tối thiểu (VNĐ)": num(v["min_order_vnd"]),
        "Hết hạn": vnDate(v["expires_at"]),
        "Đã dùng": v["is_used"] === true,
      })),
    },
  ]
}
