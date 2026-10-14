import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { DISMISSAL_DECIDE_CAPABILITY } from "@/modules/greeting-card/domain/dismissal-policy"
import { decideDismissal } from "@/modules/greeting-card/use-cases/decide-dismissal"

const decideSchema = z.object({
  id: z.string().min(1, "Thiếu định danh đơn/link"),
  type: z.enum(["ORDER", "SESSION"]),
  approve: z.boolean(),
  note: z.string().max(500).optional(),
})

/**
 * POST /api/v1/greeting-card/tracking/decide-dismiss
 * Điều hành/Điều phối (R4) phê duyệt hoặc từ chối đề xuất bỏ hiển thị.
 */
export const POST = handle(async (req: Request) => {
  const { ctx } = await requireTenantContext(req)
  requireCapability(ctx, DISMISSAL_DECIDE_CAPABILITY)

  const body = await req.json().catch(() => null)
  const parsed = decideSchema.safeParse(body)
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const result = await decideDismissal(ctx, {
    id: parsed.data.id,
    type: parsed.data.type,
    approve: parsed.data.approve,
    ...(parsed.data.note ? { note: parsed.data.note } : {}),
  })
  return jsonResponse({ data: result }, { status: 200 })
})
