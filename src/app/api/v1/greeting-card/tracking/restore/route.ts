import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { DISMISSAL_DECIDE_CAPABILITY } from "@/modules/greeting-card/domain/dismissal-policy"
import { restoreDismissal } from "@/modules/greeting-card/use-cases/restore-dismissal"

const restoreSchema = z.object({
  id: z.string().min(1, "Thiếu định danh đơn/link"),
  type: z.enum(["ORDER", "SESSION"]),
  reason: z.string().max(500).optional(),
})

/**
 * POST /api/v1/greeting-card/tracking/restore
 * Điều hành/Điều phối (R4) khôi phục đơn/link đã BỎ HIỂN THỊ (không phải đơn huỷ theo quy trình huỷ/hoàn).
 */
export const POST = handle(async (req: Request) => {
  const { ctx } = await requireTenantContext(req)
  requireCapability(ctx, DISMISSAL_DECIDE_CAPABILITY)

  const body = await req.json().catch(() => null)
  const parsed = restoreSchema.safeParse(body)
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  await restoreDismissal(ctx, {
    id: parsed.data.id,
    type: parsed.data.type,
    ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
  })
  return jsonResponse({ data: { restored: true } }, { status: 200 })
})
