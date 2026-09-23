import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { approveCampaignPackage } from "@/modules/creative-production/use-cases/manage-campaign-package"

const schema = z.object({ acknowledge_warnings: z.boolean().default(false) })

/**
 * `POST /api/v1/creative-production/packages/:id/approve` (`J5` social.publish) —
 * Chặng 09. Endpoint duyệt tách khỏi endpoint sinh kết quả; ghi `audit_logs`
 * trong CÙNG giao dịch với việc chuyển trạng thái.
 */
export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "J5")
  const { id } = await context.params
  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  return jsonResponse(
    await approveCampaignPackage(ctx, id, { acknowledgeWarnings: parsed.data.acknowledge_warnings })
  )
})
