import { z } from "zod"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { createOrder } from "@/modules/orders/use-cases/create-order"
import { listOrders } from "@/modules/orders/use-cases/list-orders"
import type { OrderStatus, ProductionStatus, DeliveryStatus } from "@/modules/orders/domain/order-types"

const createOrderSchema = z.object({
  branchId: z.string().optional(),
  customerId: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().optional(),
      variantId: z.string().optional(),
      description: z.string().optional(),
      quantity: z.number().int().positive().default(1),
      unitPriceVnd: z.number().nonnegative(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
  ).min(1, "Đơn hàng phải có ít nhất 1 sản phẩm"),
  pricingRuleRef: z.record(z.string(), z.unknown()).optional(),
  voucherId: z.string().optional(),
  cardMessage: z.string().optional(),
  internalNote: z.string().optional(),
  deliveryWindow: z
    .object({
      date: z.string(),
      timeSlot: z.string().optional(),
    })
    .optional(),
  deliveryAddress: z
    .object({
      recipientName: z.string(),
      phone: z.string(),
      street: z.string(),
      ward: z.string().optional(),
      district: z.string().optional(),
      province: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
})

/** `GET /api/v1/orders` (R1) — Danh sách đơn hàng */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R1")

  const url = new URL(request.url)
  const status = url.searchParams.get("status") as OrderStatus | null
  const productionStatus = url.searchParams.get("production_status") as ProductionStatus | null
  const deliveryStatus = url.searchParams.get("delivery_status") as DeliveryStatus | null
  const branchId = url.searchParams.get("branch_id") ?? undefined
  const customerId = url.searchParams.get("customer_id") ?? undefined
  const search = url.searchParams.get("search") ?? undefined
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam ? parseInt(limitParam, 10) : 50

  const result = await listOrders(ctx, {
    status: status || undefined,
    productionStatus: productionStatus || undefined,
    deliveryStatus: deliveryStatus || undefined,
    branchId,
    customerId,
    search,
    limit,
  })

  return jsonResponse(result)
})

/** `POST /api/v1/orders` (R2) — Tạo đơn hàng mới */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R2")

  const body = await request.json()
  const parsed = createOrderSchema.parse(body)

  const order = await createOrder(ctx, parsed)
  return jsonResponse({ order }, { status: 201 })
})
