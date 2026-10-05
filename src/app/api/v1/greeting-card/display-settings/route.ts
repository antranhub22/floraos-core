import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getDisplaySettings, updateDisplaySettings } from "@/modules/greeting-card/use-cases/display-settings"

export const GET = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  return jsonResponse({ data: await getDisplaySettings(ctx) })
})

const putSchema = z.object({
  templateId: z.string().min(1),
  fields: z.array(z.string()),
})

export const PUT = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  const parsed = putSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  return jsonResponse({ data: await updateDisplaySettings(ctx, parsed.data) })
})
