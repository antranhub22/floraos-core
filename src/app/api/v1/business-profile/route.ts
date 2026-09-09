import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getBusinessProfile } from "@/modules/profiles/use-cases/get-business-profile"
import { putBusinessProfile } from "@/modules/profiles/use-cases/put-business-profile"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F1")
  return jsonResponse(await getBusinessProfile(ctx))
})

const jsonObject = z.record(z.string(), z.unknown()).nullable().optional()

const putSchema = z.object({
  legal_name: z.string().nullable().optional(),
  display_name: z.string().min(1),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  social_links: jsonObject,
  tax_code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  operating_hours: jsonObject,
})

export const PUT = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F2")

  const parsed = putSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  return jsonResponse(await putBusinessProfile(ctx, parsed.data))
})
