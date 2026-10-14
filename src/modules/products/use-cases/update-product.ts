import { conflict, notFound } from "@/core/http/errors"
import { hasCapability } from "@/core/rbac/capabilities"
import type { TenantContext } from "@/core/tenancy"
import { ProductRepository, type UpdateProductInput } from "@/modules/products/infra/product-repository"
import { PRICING_ONLY_ATTRIBUTE_KEYS } from "@/modules/products/domain/product-lookup"

/**
 * `PATCH /products/:id` (`L3`, đặc tả 06 mục 6). Sửa tay thông tin sản phẩm
 * — tách khỏi luồng duyệt phân tích ảnh (`H3`, ghi cả bốn trường nhận dạng
 * cùng lúc qua `updateIdentity`).
 */
export async function updateProduct(ctx: TenantContext, id: string, input: UpdateProductInput) {
  const repo = new ProductRepository()

  if (input.code !== undefined) {
    const existing = await repo.findByCode(ctx, input.code)
    if (existing && existing.id !== id) {
      throw conflict(`Mã sản phẩm "${input.code}" đã tồn tại trong tổ chức`)
    }
  }

  // Người không có L5 chưa từng thấy BOM/giá sàn-trần (bị lọc khi đọc) → gửi `attributes` thiếu các khoá
  // đó không có nghĩa là xoá: giữ nguyên giá trị đang lưu, và không cho họ ghi đè.
  if (input.attributes && !hasCapability(ctx, "L5")) {
    const current = await repo.findById(ctx, id)
    if (!current) throw notFound()
    const stored = (current.attributes as Record<string, unknown> | null) ?? {}
    const kept = Object.fromEntries(PRICING_ONLY_ATTRIBUTE_KEYS.filter((k) => k in stored).map((k) => [k, stored[k]]))
    const incoming = Object.fromEntries(
      Object.entries(input.attributes).filter(([k]) => !(PRICING_ONLY_ATTRIBUTE_KEYS as readonly string[]).includes(k))
    )
    input = { ...input, attributes: { ...incoming, ...kept } }
  }

  const updated = await repo.update(ctx, id, input)
  if (!updated) throw notFound()
  return updated
}
