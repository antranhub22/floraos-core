import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { getCoordinatorBoard } from "@/modules/greeting-card/use-cases/coordinator-board"

/**
 * GET /api/v1/greeting-card/coordinator-board?date=YYYY-MM-DD — bảng việc Điều phối: mọi đơn còn việc
 * (cộng đơn giao xong trong 24 giờ), xếp theo ngày + giờ giao. Có trần an toàn thay cho phân trang.
 */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const date = new URL(request.url).searchParams.get("date") || undefined
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw validationFailed({ date: "Ngày dạng YYYY-MM-DD" })
  return jsonResponse(await getCoordinatorBoard(ctx, { date }))
})

export const dynamic = "force-dynamic"
