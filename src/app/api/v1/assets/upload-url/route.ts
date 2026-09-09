import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { createUploadUrl } from "@/modules/assets/use-cases/create-upload-url"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

const schema = z.object({
  product_id: z.string().nullish(),
  mime_type: z.string().min(1),
})

export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "G2")

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const result = await createUploadUrl(ctx, {
    productId: parsed.data.product_id ?? null,
    mimeType: parsed.data.mime_type,
  })
  return jsonResponse(result, { status: 201 })
})
