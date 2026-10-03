import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import {
  assignBrochureFlorist,
  uploadBrochureProductPhoto,
  dispatchBrochureShipping,
  uploadBrochureRecipientPhoto,
} from "@/modules/greeting-card/use-cases/update-brochure-order-status"

const floristSchema = z.object({ floristNote: z.string().min(1, "Nhập ghi chú phân công florist") })
const photoSchema = z.object({ assetId: z.string().min(1, "Thiếu asset ID ảnh") })
const shipSchema = z.object({ trackingNote: z.string().min(1, "Nhập thông tin vận chuyển") })

type RouteCtx = { params: Promise<{ id: string }> }

/** POST /api/v1/greeting-card/orders/[id]/assign-florist */
export const assignFloristPOST = handle(async (request: Request, context: unknown) => {
  const { ctx } = await requireTenantContext(request)
  const { id } = await (context as RouteCtx).params
  const body = await request.json().catch(() => ({}))
  const parsed = floristSchema.safeParse(body)
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const result = await assignBrochureFlorist(ctx, id, parsed.data)
  return jsonResponse({ data: result })
})

/** POST /api/v1/greeting-card/orders/[id]/product-photo */
export const productPhotoPOST = handle(async (request: Request, context: unknown) => {
  const { ctx } = await requireTenantContext(request)
  const { id } = await (context as RouteCtx).params
  const body = await request.json().catch(() => ({}))
  const parsed = photoSchema.safeParse(body)
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const result = await uploadBrochureProductPhoto(ctx, id, parsed.data)
  return jsonResponse({ data: result })
})

/** POST /api/v1/greeting-card/orders/[id]/dispatch-shipping */
export const dispatchShippingPOST = handle(async (request: Request, context: unknown) => {
  const { ctx } = await requireTenantContext(request)
  const { id } = await (context as RouteCtx).params
  const body = await request.json().catch(() => ({}))
  const parsed = shipSchema.safeParse(body)
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const result = await dispatchBrochureShipping(ctx, id, parsed.data)
  return jsonResponse({ data: result })
})

/** POST /api/v1/greeting-card/orders/[id]/recipient-photo */
export const recipientPhotoPOST = handle(async (request: Request, context: unknown) => {
  const { ctx } = await requireTenantContext(request)
  const { id } = await (context as RouteCtx).params
  const body = await request.json().catch(() => ({}))
  const parsed = photoSchema.safeParse(body)
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const result = await uploadBrochureRecipientPhoto(ctx, id, parsed.data)
  return jsonResponse({ data: result })
})
