import { validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { AuditLogRepository } from "@/modules/audit/infra/audit-log-repository"

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

/** `GET /audit-logs` (`G9`, đặc tả 06 mục 10). */
export async function listAuditLogs(
  ctx: TenantContext,
  options: { limit?: number | undefined; cursor?: string | null | undefined }
) {
  const limit = options.limit ?? DEFAULT_LIMIT
  if (limit < 1 || limit > MAX_LIMIT) {
    throw validationFailed({ limit: `Phải trong khoảng 1..${MAX_LIMIT}` })
  }

  const rows = await new AuditLogRepository().list(ctx, {
    limit: limit + 1,
    cursor: options.cursor ?? null,
  })
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null

  return { data: page, next_cursor: nextCursor }
}
