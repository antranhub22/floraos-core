import { validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { ProductAnalysisRepository } from "@/modules/products/infra/product-analysis-repository"

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

/**
 * `GET /vision/analyses` (`H3`, nợ #48 — TECHNICAL_DEBT.md). Chỉ liệt kê
 * `approval_state = PENDING` — đây là hàng chờ duyệt cho màn "Duyệt", không
 * phải toàn bộ lịch sử phân tích (chưa có route liệt kê toàn bộ, ngoài
 * phạm vi nợ #48). Gác bằng `H3` (không phải `H1`) vì đây là màn của người
 * duyệt, không phải người vừa gửi phân tích.
 */
export async function listPendingAnalyses(
  ctx: TenantContext,
  options: { limit?: number | undefined; cursor?: string | null | undefined }
) {
  const limit = options.limit ?? DEFAULT_LIMIT
  if (limit < 1 || limit > MAX_LIMIT) {
    throw validationFailed({ limit: `Phải trong khoảng 1..${MAX_LIMIT}` })
  }

  const rows = await new ProductAnalysisRepository().listPending(ctx, {
    limit: limit + 1,
    cursor: options.cursor ?? null,
  })
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null

  return { data: page, next_cursor: nextCursor }
}
