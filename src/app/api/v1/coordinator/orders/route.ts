import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { createOrderSchema, listQuerySchema, parseBody } from "@/modules/coordinator/adapters/http-schemas"
import type { CoordinatorStage } from "@/modules/coordinator/domain/coordinator-types"
import { createCoordinatorOrder } from "@/modules/coordinator/use-cases/create-coordinator-order"
import { listCoordinatorOrders } from "@/modules/coordinator/use-cases/list-coordinator-orders"

/** `GET /api/v1/coordinator/orders` (R1) — danh sách Control Tower, rủi ro tính lại lúc đọc (F03/F12). */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R1")

  const url = new URL(request.url)
  const query = listQuerySchema.safeParse({
    stage: url.searchParams.get("stage") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  })
  if (!query.success) throw validationFailed({ issues: query.error.issues })

  const orders = await listCoordinatorOrders(ctx, {
    stage: query.data.stage as CoordinatorStage | undefined,
    limit: query.data.limit,
  })
  return jsonResponse({ orders })
})

/** `POST /api/v1/coordinator/orders` (R2) — tiếp nhận đơn (F01). Mã đơn do máy chủ cấp. */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R2")

  const body = await parseBody(request, createOrderSchema)
  const order = await createCoordinatorOrder(ctx, body)
  return jsonResponse({ order }, { status: 201 })
})
