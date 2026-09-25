import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

import { approveGenerationBodySchema } from "@/modules/content-engine/contracts/generation"
import { approveContentGeneration } from "@/modules/content-engine/use-cases/approve-content-generation"

/**
 * `POST /api/v1/content-engine/generations/:id/approve` (`J5`) — chốt bài AI
 * viết thành bài đã duyệt (`approved_posts`). Endpoint duyệt tách khỏi
 * endpoint sinh (`I1`); ghi `audit_logs` cùng giao dịch.
 */
export const POST = handle(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "J5")
  const { id } = await params
  const parsed = approveGenerationBodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const g = await approveContentGeneration(ctx, id, { posts: parsed.data.posts })
  return jsonResponse({
    id: g.id,
    status: g.status,
    approved_by: g.approved_by,
    approved_posts: g.approved_posts,
    updated_at: g.updated_at,
  })
})
