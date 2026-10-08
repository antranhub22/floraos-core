import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import {
  assignBrochureFlorist,
  uploadBrochureProductPhoto,
  dispatchBrochureShipping,
  uploadBrochureRecipientPhoto,
  markBrochureDeliveryFailed,
} from "@/modules/greeting-card/use-cases/update-brochure-order-status"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { DELIVERY_FAILURE_REASONS, FAILURE_NOTE_MAX } from "@/modules/greeting-card/domain/delivery-failure"

const floristSchema = z.object({ floristNote: z.string().trim().min(1, "Nhập ghi chú phân công florist").max(500) })
const photoSchema = z
  .object({
    assetId: z.string().min(1).max(64).optional(),
    assetIds: z.array(z.string().min(1).max(64)).min(1).max(7).optional(),
    skipPhoto: z.boolean().optional(),
    skipReason: z.string().trim().max(300).optional(),
  })
  .refine((v) => v.skipPhoto || v.assetId || v.assetIds, { message: "Thiếu ảnh hoặc chưa chọn bỏ qua" })
const shipSchema = z.object({ trackingNote: z.string().trim().min(1, "Nhập thông tin vận chuyển").max(500) })
const failedSchema = z.object({
  reason: z.enum(DELIVERY_FAILURE_REASONS),
  note: z.string().trim().max(FAILURE_NOTE_MAX).optional(),
  chargeFee: z.boolean().optional(),
})

type RouteCtx = { params: Promise<{ id: string }> }

/**
 * Dựng một handler tác vụ xưởng: phiên → năng lực → schema → use-case.
 * Bốn route con chỉ khác nhau ở bốn tham số này.
 */
function coordinatorHandler<T>(
  capability: string,
  schema: z.ZodType<T>,
  run: (ctx: Awaited<ReturnType<typeof requireTenantContext>>["ctx"], id: string, input: T) => Promise<unknown>
) {
  return handle<[RouteCtx]>(async (request, context) => {
    const { ctx } = await requireTenantContext(request)
    requireCapability(ctx, capability)
    const { id } = await context.params
    const parsed = schema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
    return jsonResponse({ data: await run(ctx, id, parsed.data) })
  })
}

/** POST /api/v1/greeting-card/orders/[id]/assign-florist */
export const assignFloristPOST = coordinatorHandler(GREETING_CARD_CAPABILITY.assignFlorist, floristSchema, assignBrochureFlorist)

/** POST /api/v1/greeting-card/orders/[id]/product-photo */
export const productPhotoPOST = coordinatorHandler(GREETING_CARD_CAPABILITY.productionUpdate, photoSchema, uploadBrochureProductPhoto)

/** POST /api/v1/greeting-card/orders/[id]/dispatch-shipping */
export const dispatchShippingPOST = coordinatorHandler(GREETING_CARD_CAPABILITY.deliveryManage, shipSchema, dispatchBrochureShipping)

/** POST /api/v1/greeting-card/orders/[id]/recipient-photo */
export const recipientPhotoPOST = coordinatorHandler(GREETING_CARD_CAPABILITY.deliveryManage, photoSchema, uploadBrochureRecipientPhoto)

/** POST /api/v1/greeting-card/orders/[id]/delivery-failed — shipper không giao được, hẹn giao lại */
export const deliveryFailedPOST = coordinatorHandler(GREETING_CARD_CAPABILITY.deliveryManage, failedSchema, markBrochureDeliveryFailed)
