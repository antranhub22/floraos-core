import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { editAnalysis } from "@/modules/products/use-cases/edit-analysis"
import { getAnalysis } from "@/modules/products/use-cases/get-analysis"

export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "H1")

  const { id } = await context.params
  return jsonResponse(await getAnalysis(ctx, id))
})

const patchSchema = z.object({
  edited: z.record(z.string(), z.unknown()),
})

/** `PATCH /vision/analyses/:id` (`H2`, đặc tả 06 mục 8) — ghi vào `edited`. */
export const PATCH = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "H2")

  const { id } = await context.params
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  return jsonResponse(await editAnalysis(ctx, id, parsed.data.edited))
})
