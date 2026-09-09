import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { createBranch } from "@/modules/organization/use-cases/create-branch"
import { listBranches } from "@/modules/organization/use-cases/list-branches"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F6")
  return jsonResponse({ data: await listBranches(ctx), next_cursor: null })
})

const schema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().min(1).nullish(),
})

export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F7")

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const branch = await createBranch(ctx, {
    name: parsed.data.name,
    code: parsed.data.code,
    address: parsed.data.address ?? null,
  })
  return jsonResponse({ branch }, { status: 201 })
})
