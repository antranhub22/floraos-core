import { z } from "zod"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { CancellationRepository } from "@/modules/greeting-card/infra/cancellation-repository"
import { roleOf } from "@/modules/greeting-card/domain/internal-message"

const createSchema = z.object({
  orderId: z.string().min(1, "Mã đơn hàng không được để trống"),
  type: z.enum(["CANCEL_ONLY", "FULL_REFUND", "PARTIAL_REFUND"]),
  reason: z.string().min(3, "Lý do hủy/hoàn phải có ít nhất 3 ký tự"),
  refundAmountVnd: z.number().nonnegative().optional().default(0),
  note: z.string().optional(),
})

/**
 * `POST /api/v1/greeting-card/cancellation-requests`
 * Sale / Điều phối đề xuất Hủy đơn hoặc Hoàn tiền (Task #1).
 */
export const POST = handle(async (req: Request) => {
  const { ctx } = await requireTenantContext(req)
  const body = await req.json()
  const parsed = createSchema.parse(body)

  const senderRole = roleOf(ctx.capabilities) ?? "SALE"
  const repo = new CancellationRepository()

  const result = await repo.createProposal(ctx, {
    orderId: parsed.orderId,
    senderRole,
    proposal: {
      type: parsed.type,
      reason: parsed.reason,
      refundAmountVnd: parsed.refundAmountVnd,
      note: parsed.note,
    },
  })

  return jsonResponse({ data: result }, { status: 201 })
})

/**
 * `GET /api/v1/greeting-card/cancellation-requests`
 * Lấy danh sách đề xuất hủy/hoàn tiền đang chờ duyệt cho Điều hành.
 */
export const GET = handle(async (req: Request) => {
  const { ctx } = await requireTenantContext(req)
  const repo = new CancellationRepository()
  const pending = await repo.listPending(ctx)
  return jsonResponse({ data: pending })
})
