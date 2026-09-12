import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { getAiPolicy } from "@/modules/ai-governance/use-cases/get-ai-policy"
import { putAiPolicy } from "@/modules/ai-governance/use-cases/put-ai-policy"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "U1")
  return jsonResponse(await getAiPolicy(ctx))
})

const putSchema = z.object({
  capability_code: z.string().min(1),
  allowed_models: z.array(z.string().min(1)).max(20),
  quality_target: z.enum(["thap", "trung_binh", "cao"]).nullable().optional(),
  cost_ceiling: z.number().int().nonnegative().nullable().optional(),
  privacy_floor: z.enum(["PUBLIC", "SHOP", "SENSITIVE"]),
})

/**
 * Ghi TRẦN của một năng lực. Đổi `AIC-01` đòi thêm `H4` — kiểm trong use-case,
 * không kiểm ở đây, để đường ghi của engine ngoài về sau không đi vòng qua nó.
 */
export const PUT = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "U2")

  const parsed = putSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  return jsonResponse(await putAiPolicy(ctx, parsed.data))
})
