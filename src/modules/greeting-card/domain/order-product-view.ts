/**
 * SSOT thông tin mẫu hoa của một đơn / link Thẻ chào — mọi API trả đơn (theo dõi, điều phối, thanh toán)
 * dựng `product` bằng hàm này, giao diện chỉ đọc `product`, không tự chọn giữa ảnh chụp mẫu và dòng đơn.
 * Pure TypeScript.
 */

export interface OrderProductView {
  productId: string | null
  name: string
  code: string | null
  imageUrl: string | null
  price: number
  flowersSummary: string | null
}

/** Hình dạng tối thiểu của đơn (hoặc một phiên link chưa có đơn: `items: []`). */
export interface OrderProductSource {
  items: Array<{ product_id?: string | null; metadata?: unknown; description?: string | null; unit_price_vnd?: unknown }>
  greeting_sessions: Array<{ selected_product_id?: string | null; product_snapshot?: unknown }>
}

type Loose = Record<string, unknown>
const obj = (v: unknown): Loose => (v && typeof v === "object" ? (v as Loose) : {})
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)
/** Số dương (nhận cả Prisma Decimal qua `Number()`), không thì `null`. */
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : v != null && v !== "" ? Number(v) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Sản phẩm của đơn: dòng đơn trước, mẫu khách chọn trên link sau. */
export function orderProductId(source: OrderProductSource): string | null {
  return source.items[0]?.product_id ?? source.greeting_sessions[0]?.selected_product_id ?? null
}

/**
 * Ưu tiên: ảnh chụp mẫu lúc khách chọn → metadata dòng đơn → ảnh hiện tại trong kho (`images`, theo productId)
 * — đơn tạo tay hoặc mẫu chọn trước khi có ảnh vẫn hiện được ảnh cho mọi vai trò.
 */
export function orderProductView(source: OrderProductSource, images: ReadonlyMap<string, string>, fallbackName = "Hoa tươi theo mẫu"): OrderProductView {
  const snap = obj(source.greeting_sessions[0]?.product_snapshot)
  const item = source.items[0]
  const meta = obj(item?.metadata)
  const productId = orderProductId(source)
  return {
    productId,
    name: str(snap.name) ?? str(meta.name) ?? str(item?.description) ?? fallbackName,
    code: str(snap.code) ?? str(meta.code),
    imageUrl: str(snap.imageUrl) ?? str(meta.imageUrl) ?? (productId ? images.get(productId) ?? null : null),
    price: num(snap.price) ?? num(meta.price) ?? num(item?.unit_price_vnd) ?? 0,
    flowersSummary: str(snap.flowersSummary) ?? str(meta.flowersSummary),
  }
}
