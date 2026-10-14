import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { proposeDismissal } from "@/modules/greeting-card/use-cases/propose-dismissal"

const dismissSchema = z.object({
  id: z.string().min(1, "Thiếu định danh đơn/link"),
  type: z.enum(["ORDER", "SESSION"]),
  reasonId: z.string().min(1, "Vui lòng chọn lý do"),
  reasonText: z.string().trim().min(2, "Lý do phải có tối thiểu 2 ký tự"),
  note: z.string().max(500).optional(),
})

/**
 * POST /api/v1/greeting-card/tracking/dismiss
 * Sale (R1) đề xuất; người có R4 (Điều hành/Điều phối) bỏ hiển thị trực tiếp đơn/link chưa thanh toán.
 */
export const POST = handle(async (req: Request) => {
  const { ctx } = await requireTenantContext(req)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)

  const body = await req.json().catch(() => null)
  const parsed = dismissSchema.safeParse(body)
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const result = await proposeDismissal(ctx, parsed.data)
  return jsonResponse({ data: result }, { status: 200 })
})
