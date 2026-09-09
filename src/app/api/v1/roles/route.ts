import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { createRole } from "@/modules/organization/use-cases/create-role"
import { listRoles } from "@/modules/organization/use-cases/list-roles"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F1")
  return jsonResponse({ data: await listRoles(ctx), next_cursor: null })
})

const schema = z.object({ name: z.string().min(1) })

export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F5")

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const role = await createRole(ctx, { name: parsed.data.name })
  return jsonResponse({ role }, { status: 201 })
})
