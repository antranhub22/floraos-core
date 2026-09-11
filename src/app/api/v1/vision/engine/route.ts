import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { VISION_ENGINES } from "@/modules/products/domain/vision-engine"
import { getVisionEngine, setVisionEngine } from "@/modules/products/use-cases/manage-vision-engine"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "H1")
  return jsonResponse(await getVisionEngine(ctx))
})

const schema = z.object({ bo_may: z.enum(VISION_ENGINES) })

/** `PUT /vision/engine` (`H4`) — chỉ Điều hành, trần cứng ở danh mục năng lực. */
export const PUT = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "H4")

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  return jsonResponse(await setVisionEngine(ctx, parsed.data.bo_may))
})
