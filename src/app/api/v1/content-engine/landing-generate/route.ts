import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getBusinessProfile } from "@/modules/profiles/use-cases/get-business-profile"
import { getBrandProfile } from "@/modules/profiles/use-cases/get-brand-profile"
import { executeGenerateLandingContent } from "@/modules/content-engine/use-cases/generate-landing-page-content.use-case"

const requestSchema = z.object({
  occasionId: z.string().min(1),
  occasionLabel: z.string().min(1),
  archetypeId: z.string().optional(),
  selectedProducts: z.array(
    z.object({
      name: z.string().min(1),
      code: z.string().optional(),
      price: z.number().nullable().optional(),
      category: z.string().nullable().optional(),
    })
  ).default([]),
  userDirectives: z.string().optional(),
  discountPercent: z.number().int().min(1).max(99).optional(),
  usps: z.array(z.string()).optional(),
  guarantees: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  designDirection: z.string().optional(),
})

export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)

  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues })
  }

  // Lấy Nguồn 1: Cốt lõi Business Profile & Brand Profile của tiệm
  const [bizProfile, brandProfile] = await Promise.all([
    getBusinessProfile(ctx).catch(() => null),
    getBrandProfile(ctx).catch(() => null),
  ])

  const shopName = bizProfile?.display_name || "Tiệm Hoa Tươi"
  const shopTone = brandProfile?.tone_of_voice || undefined

  const result = await executeGenerateLandingContent(
    {
      shopName,
      shopTone,
      occasionId: parsed.data.occasionId,
      occasionLabel: parsed.data.occasionLabel,
      archetypeId: parsed.data.archetypeId,
      selectedProducts: parsed.data.selectedProducts,
      userDirectives: parsed.data.userDirectives,
      discountPercent: parsed.data.discountPercent,
      usps: parsed.data.usps,
      guarantees: parsed.data.guarantees,
      targetAudience: parsed.data.targetAudience,
      designDirection: parsed.data.designDirection,
    },
    ctx
  )

  return jsonResponse({
    data: result,
  })
})
