import { validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

/** `GET /assets` — không có ở đặc tả 06 dạng danh sách rời, nhưng `GET
 * /products/:id/images` (`G1`) đọc qua asset; hàm này phục vụ chung, lọc
 * theo `product_id` khi có. */
export async function listAssets(
  ctx: TenantContext,
  options: { productId?: string | undefined; limit?: number | undefined; cursor?: string | null | undefined }
) {
  const limit = options.limit ?? DEFAULT_LIMIT
  if (limit < 1 || limit > MAX_LIMIT) {
    throw validationFailed({ limit: `Phải trong khoảng 1..${MAX_LIMIT}` })
  }

  const rows = await new AssetRepository().list(ctx, {
    productId: options.productId,
    limit: limit + 1,
    cursor: options.cursor ?? null,
  })
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null

  return { data: page, next_cursor: nextCursor }
}
