import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { PIPELINE_STEPS } from "@/modules/greeting-card/domain/tracking-pipeline-types"
import { MAX_MESSAGE_LENGTH } from "@/modules/greeting-card/domain/internal-message"
import { getThread, sendMessage } from "@/modules/greeting-card/use-cases/internal-messages"

const STEP_KEYS = ["GENERAL", ...PIPELINE_STEPS.map((s) => s.id)] as [string, ...string[]]
const ref = { orderId: z.string().min(1).max(64).optional(), sessionId: z.string().min(1).max(64).optional() }
const role = z.enum(["ADMIN", "SALE", "COORDINATOR"])

const sendSchema = z.object({
  ...ref,
  stepKey: z.enum(STEP_KEYS).default("GENERAL"),
  // Vai người gửi KHÔNG nhận từ client — suy từ năng lực ở máy chủ
  to: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("ROLE"), role }),
    z.object({ kind: z.literal("OWNER_SALE") }),
    z.object({ kind: z.literal("USER"), userId: z.string().min(1).max(64) }),
  ]),
  body: z.string().trim().min(1, "Nhập nội dung tin nhắn").max(MAX_MESSAGE_LENGTH),
  replyToId: z.string().min(1).max(64).optional(),
}).refine((v) => !!v.orderId !== !!v.sessionId, { message: "Chọn đúng một đơn hoặc một link" })

/** GET /api/v1/greeting-card/messages?orderId=|sessionId= — toàn bộ trao đổi nội bộ của một đơn. */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const url = new URL(request.url)
  const parsed = z.object(ref).safeParse({
    orderId: url.searchParams.get("orderId") ?? undefined,
    sessionId: url.searchParams.get("sessionId") ?? undefined,
  })
  if (!parsed.success || !!parsed.data.orderId === !!parsed.data.sessionId) throw validationFailed({ ref: "Cần orderId hoặc sessionId" })
  return jsonResponse({ data: await getThread(ctx, parsed.data) })
})

/** POST — gửi tin cho một vai / sale phụ trách / một người; `replyToId` trả lời đúng người đã nhắn. */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.manage)
  const parsed = sendSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  return jsonResponse({ data: await sendMessage(ctx, parsed.data) }, { status: 201 })
})

export const dynamic = "force-dynamic"
