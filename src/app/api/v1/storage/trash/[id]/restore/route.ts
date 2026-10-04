import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { restoreFromTrash } from "@/modules/storage/use-cases/manage-trash"

const restoreSchema = z.object({
  type: z.enum(["RAW_ASSET", "APPROVED_ANALYSIS", "PRODUCT"]),
})

type Context = { params: Promise<{ id: string }> }

export const POST = handle(async (request: Request, context: Context) => {
  const { id } = await context.params
  const { ctx } = await requireTenantContext(request)
  const body = await request.json().catch(() => ({}))
  const parsed = restoreSchema.safeParse(body)
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues })
  }

  await restoreFromTrash(ctx, { id, type: parsed.data.type })
  return jsonResponse({ success: true })
})
