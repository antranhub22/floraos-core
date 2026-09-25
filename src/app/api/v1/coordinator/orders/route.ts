import { z } from "zod"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { createCoordinatorOrder } from "@/modules/coordinator/use-cases/create-coordinator-order"
import { listCoordinatorOrders } from "@/modules/coordinator/use-cases/list-coordinator-orders"
import type { CoordinatorStage, CoordinationRiskLevel } from "@/modules/coordinator/domain/coordinator-types"

const createCoordinatorOrderSchema = z.object({
  orderCode: z.string().optional(),
  stage: z.string().default("PLANNING"),
  stageLabel: z.string().optional(),
  riskLevel: z.enum(["NORMAL", "ATTENTION", "AT_RISK", "CRITICAL"]).default("NORMAL"),
  riskReason: z.string().nullable().optional(),
  customerName: z.string().min(1, "Thiếu tên khách hàng"),
  customerTier: z.string().default("BRONZE"),
  recipientName: z.string().min(1, "Thiếu tên người nhận"),
  recipientPhone: z.string().default(""),
  deliveryAddress: z.union([
    z.string(),
    z.object({
      street: z.string(),
      ward: z.string(),
      district: z.string(),
      city: z.string(),
      country: z.string().optional(),
      formattedAddress: z.string(),
    }),
  ]),
  deliveryTargetTime: z.string().default("Trong ngày"),
  nextAction: z.string().default("Phân công đối tác xưởng ngoài hoặc thợ cắm hoa"),
  partnerName: z.string().optional(),
  productTitle: z.string().min(1, "Thiếu tên sản phẩm hoa"),
  sampleImageUrl: z.string().optional(),
  unitPriceVnd: z.number().optional(),
  flowers: z
    .array(
      z.object({
        flowerName: z.string(),
        quantity: z.number(),
        unit: z.string(),
        color: z.string(),
        role: z.string(),
      })
    )
    .optional(),
  cardMessage: z.string().optional(),
  internalNote: z.string().optional(),
})

/**
 * `GET /api/v1/coordinator/orders` (R1) — Lấy danh sách đơn điều phối Control Tower.
 */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R1")

  const url = new URL(request.url)
  const stage = url.searchParams.get("stage") ?? undefined
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam ? parseInt(limitParam, 10) : 50

  const orders = await listCoordinatorOrders(ctx, { stage, limit })
  return jsonResponse({ orders })
})

/**
 * `POST /api/v1/coordinator/orders` (R2) — Tạo đơn điều phối mới từ Sales T01 / AI Chat.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R2")

  const body = await request.json()
  const parsed = createCoordinatorOrderSchema.parse(body)

  const result = await createCoordinatorOrder(ctx, {
    ...parsed,
    stage: parsed.stage as CoordinatorStage,
    riskLevel: parsed.riskLevel as CoordinationRiskLevel,
  })

  return jsonResponse({ success: true, order: result }, { status: 201 })
})
