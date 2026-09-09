import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { updateBranch } from "@/modules/organization/use-cases/update-branch"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

const schema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).nullish(),
  is_active: z.boolean().optional(),
})

export const PATCH = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F7")

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  if (Object.keys(parsed.data).length === 0) {
    throw validationFailed({ body: "Không có trường nào để sửa" })
  }

  const { id } = await context.params
  const branch = await updateBranch(ctx, id, parsed.data)
  return jsonResponse({ branch })
})
