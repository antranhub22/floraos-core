import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { createWorkspace } from "@/modules/organization/use-cases/create-workspace"
import { listWorkspaces } from "@/modules/organization/use-cases/list-workspaces"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F1")
  return jsonResponse({ data: await listWorkspaces(ctx), next_cursor: null })
})

const schema = z.object({
  name: z.string().min(1),
  kind: z.enum(["EXPERIENCE", "PRODUCTION"]),
})

export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F8")

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const workspace = await createWorkspace(ctx, parsed.data)
  return jsonResponse({ workspace }, { status: 201 })
})
