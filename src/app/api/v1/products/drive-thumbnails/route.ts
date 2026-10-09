import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import {
  isValidDriveId,
  resolveFirstFileIds,
  thumbnailUrl,
} from "@/modules/greeting-card/adapters/google-drive-thumbnail"

const MAX_FOLDERS_PER_REQUEST = 50

const bodySchema = z.object({
  folder_ids: z.array(z.string().refine(isValidDriveId, "folder_id không hợp lệ")).min(1).max(MAX_FOLDERS_PER_REQUEST),
})

/**
 * POST /api/v1/products/drive-thumbnails (Quyền: L2)
 * Màn nhập hàng loạt: phân giải tối đa 50 folder Drive/lần thành URL thumbnail.
 * Thay cho việc gọi route public từng folder một (trần 120 lượt/phút/IP → file >120 dòng mất ảnh).
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "L2")
  await enforceRateLimit(request, { scope: "products-drive-thumbnails", limit: 60, windowMs: 60_000, subject: ctx.userId })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const resolved = await resolveFirstFileIds([...new Set(parsed.data.folder_ids)])
  const thumbnails: Record<string, string | null> = {}
  for (const [folderId, fileId] of resolved) thumbnails[folderId] = fileId ? thumbnailUrl(fileId) : null
  return jsonResponse({ thumbnails })
})

export const dynamic = "force-dynamic"
