import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getBusinessProfile } from "@/modules/profiles/use-cases/get-business-profile"
import { executeGenerateCatalogContent } from "@/modules/content-engine/use-cases/generate-catalog-content.use-case"

const requestSchema = z.object({
  collectionName: z.string().min(1),
  occasion: z.string().optional(),
  productCount: z.number().int().nonnegative().default(0),
  styleVariant: z.enum(["EDITORIAL_LOOKBOOK", "MODERN_SHOWROOM", "COMPACT_LIST"]).default("MODERN_SHOWROOM"),
  userDirectives: z.string().optional(),
})

export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)

  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues })
  }

  const bizProfile = await getBusinessProfile(ctx).catch(() => null)
  const shopName = bizProfile?.display_name || "Tiệm Hoa Tươi"

  const result = await executeGenerateCatalogContent(
    {
      shopName,
      collectionName: parsed.data.collectionName,
      occasion: parsed.data.occasion,
      productCount: parsed.data.productCount,
      styleVariant: parsed.data.styleVariant,
      userDirectives: parsed.data.userDirectives,
    },
    ctx
  )

  return jsonResponse({
    data: result,
  })
})
