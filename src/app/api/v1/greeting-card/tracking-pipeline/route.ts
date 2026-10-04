import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getTrackingPipeline } from "@/modules/greeting-card/use-cases/get-tracking-pipeline"
import { createInternalNote } from "@/modules/greeting-card/use-cases/create-internal-note"

const createNoteSchema = z.object({
  orderId: z.string().nullable().optional(),
  sessionId: z.string().nullable().optional(),
  stepKey: z.string().default("GENERAL"),
  role: z.enum(["ADMIN", "SALE", "COORDINATOR", "FLORIST"]).default("SALE"),
  senderName: z.string().default("Nhân viên"),
  content: z.string().min(1, "Nội dung tin nhắn không được để trống"),
})

export const GET = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  const pipeline = await getTrackingPipeline(ctx)
  return jsonResponse({ data: pipeline })
})

export const POST = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  const body = await request.json().catch(() => ({}))
  const parsed = createNoteSchema.safeParse(body)
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues })
  }

  const result = await createInternalNote(ctx, {
    orderId: parsed.data.orderId ?? null,
    sessionId: parsed.data.sessionId ?? null,
    stepKey: parsed.data.stepKey as any,
    role: parsed.data.role,
    senderName: parsed.data.senderName,
    content: parsed.data.content,
  })

  return jsonResponse({ data: result }, { status: 201 })
})
