import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getTrackingPipeline } from "@/modules/greeting-card/use-cases/get-tracking-pipeline"
import { createInternalNote } from "@/modules/greeting-card/use-cases/create-internal-note"
import { PIPELINE_STEPS, type TrackingPipelineStepId } from "@/modules/greeting-card/domain/tracking-pipeline-types"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

const STEP_KEYS = new Set<string>(["GENERAL", ...PIPELINE_STEPS.map((s) => s.id)])

// Tên người gửi lấy từ phiên đăng nhập; `senderName` client gửi (bản cũ) bị bỏ qua.
const createNoteSchema = z.object({
  orderId: z.string().max(64).nullable().optional(),
  sessionId: z.string().max(64).nullable().optional(),
  stepKey: z.string().default("GENERAL").refine((v) => STEP_KEYS.has(v), "Bước không hợp lệ"),
  role: z.enum(["ADMIN", "SALE", "COORDINATOR", "FLORIST"]).default("SALE"),
  content: z.string().trim().min(1, "Nội dung tin nhắn không được để trống").max(2000),
})

export const GET = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const pipeline = await getTrackingPipeline(ctx)
  return jsonResponse({ data: pipeline })
})

export const POST = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const body = await request.json().catch(() => ({}))
  const parsed = createNoteSchema.safeParse(body)
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues })
  }

  const result = await createInternalNote(ctx, {
    orderId: parsed.data.orderId ?? null,
    sessionId: parsed.data.sessionId ?? null,
    stepKey: parsed.data.stepKey as TrackingPipelineStepId | "GENERAL",
    role: parsed.data.role,
    content: parsed.data.content,
  })

  return jsonResponse({ data: result }, { status: 201 })
})
