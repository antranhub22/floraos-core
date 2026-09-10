import { conflict } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { ProductRepository, type CreateProductInput } from "@/modules/products/infra/product-repository"

/**
 * `POST /products` (`L2`, đặc tả 06 mục 6). `products` có
 * `@@unique([organization_id, code])` — kiểm trước khi ghi để trả 409 với
 * câu rõ nghĩa thay vì để lỗi ràng buộc cơ sở dữ liệu (`P2002`) lộ ra ngoài.
 * Còn một khe hẹp đua giữa kiểm và ghi (cùng dạng đã chấp nhận ở
 * `sign-up.ts` cho email/slug) — mức rủi ro chấp nhận được cho một thao tác
 * do người thao tác tay, không phải job chạy hàng loạt.
 */
export async function createProduct(ctx: TenantContext, input: CreateProductInput) {
  const repo = new ProductRepository()
  const existing = await repo.findByCode(ctx, input.code)
  if (existing) throw conflict(`Mã sản phẩm "${input.code}" đã tồn tại trong tổ chức`)

  return repo.create(ctx, input)
}
