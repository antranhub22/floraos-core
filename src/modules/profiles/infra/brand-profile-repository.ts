import type { brand_profiles, InputJsonValue } from "./entities"

import { prisma } from "@/core/tenancy/infra/prisma"
import type { TenantContext } from "@/core/tenancy"

import type { DbClient } from "./db-client"

export type UpsertBrandProfileInput = {
  primary_color?: string | null | undefined
  secondary_color?: string | null | undefined
  accent_color?: string | null | undefined
  background_color?: string | null | undefined
  text_color?: string | null | undefined
  font_heading?: string | null | undefined
  font_body?: string | null | undefined
  logo_asset_id?: string | null | undefined
  tone_of_voice?: string | null | undefined
  hashtags?: Record<string, unknown> | null | undefined
  cta_templates?: Record<string, unknown> | null | undefined
  forbidden_styles?: Record<string, unknown> | null | undefined
}

/**
 * `brand_profiles` — cùng hình dạng một-bản-ghi-mỗi-tổ-chức và cùng ngữ nghĩa
 * PUT-thay-toàn-bộ với `BusinessProfileRepository`; xem chú thích ở đó.
 */
export class BrandProfileRepository {
  constructor(private readonly db: DbClient = prisma) {}

  current(ctx: TenantContext): Promise<brand_profiles | null> {
    return this.db.brand_profiles.findUnique({
      where: { organization_id: ctx.organizationId },
    })
  }

  upsert(ctx: TenantContext, input: UpsertBrandProfileInput): Promise<brand_profiles> {
    // `InputJsonValue` — xem chú thích ở `BusinessProfileRepository.upsert`.
    const fields = {
      primary_color: input.primary_color ?? null,
      secondary_color: input.secondary_color ?? null,
      accent_color: input.accent_color ?? null,
      background_color: input.background_color ?? null,
      text_color: input.text_color ?? null,
      font_heading: input.font_heading ?? null,
      font_body: input.font_body ?? null,
      logo_asset_id: input.logo_asset_id ?? null,
      tone_of_voice: input.tone_of_voice ?? null,
      hashtags: (input.hashtags ?? null) as InputJsonValue,
      cta_templates: (input.cta_templates ?? null) as InputJsonValue,
      forbidden_styles: (input.forbidden_styles ?? null) as InputJsonValue,
    }

    return this.db.brand_profiles.upsert({
      where: { organization_id: ctx.organizationId },
      create: { organization_id: ctx.organizationId, ...fields },
      update: fields,
    })
  }
}
