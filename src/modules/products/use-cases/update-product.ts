import { conflict, notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { ProductRepository, type UpdateProductInput } from "@/modules/products/infra/product-repository"

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

  const updated = await repo.update(ctx, id, input)
  if (!updated) throw notFound()
  return updated
}
