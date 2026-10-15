/** Hình dạng tối thiểu của một đơn Thẻ chào để bù ảnh mẫu hoa (dòng đơn + phiên link). */
export interface OrderWithProductRefs {
  items: Array<{ product_id?: string | null; metadata?: unknown }>
  greeting_sessions: Array<{ selected_product_id?: string | null; product_snapshot?: unknown }>
}

/** Sản phẩm của đơn: dòng đơn trước, mẫu khách chọn trên link sau. */
export function orderProductId(order: OrderWithProductRefs): string {
  return order.items[0]?.product_id ?? order.greeting_sessions[0]?.selected_product_id ?? ""
}

function withImage<T>(snap: T, url: string | undefined): T {
  if (!url) return snap
  const obj = snap && typeof snap === "object" ? (snap as Record<string, unknown>) : null
  if (obj && typeof obj.imageUrl === "string" && obj.imageUrl) return snap
  return { ...(obj ?? {}), imageUrl: url } as T
}

/**
 * Ảnh chụp mẫu lúc chọn thiếu ảnh (đơn tạo tay, mẫu chọn trước khi có ảnh) → điền ảnh hiện tại trong kho
 * vào cả `product_snapshot` lẫn `items[0].metadata`, để mọi màn đọc một trong hai đều thấy ảnh.
 */
export function fillOrderProductImage<T extends OrderWithProductRefs>(order: T, images: Map<string, string>): T {
  const url = images.get(orderProductId(order))
  if (!url) return order
  return {
    ...order,
    items: order.items.map((it, i) => (i === 0 ? { ...it, metadata: withImage(it.metadata, url) } : it)),
    greeting_sessions: order.greeting_sessions.map((s, i) =>
      i === 0 && s.product_snapshot ? { ...s, product_snapshot: withImage(s.product_snapshot, url) } : s
    ),
  }
}
