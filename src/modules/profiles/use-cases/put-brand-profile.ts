import { validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { validateBrandProfileInput } from "@/modules/profiles/domain/profile-rules"
import { BrandProfileRepository } from "@/modules/profiles/infra/brand-profile-repository"

import { getBrandProfile, type BrandProfileDetail } from "./get-brand-profile"

export type PutBrandProfileInput = {
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
 * `PUT /brand-profile` (`F2`, đặc tả 06 mục 5). Cùng ngữ nghĩa thay-toàn-bộ
 * với `putBusinessProfile`.
 */
export async function putBrandProfile(
  ctx: TenantContext,
  input: PutBrandProfileInput
): Promise<BrandProfileDetail> {
  const errors = validateBrandProfileInput(input)
  if (Object.keys(errors).length > 0) throw validationFailed(errors)

  await new BrandProfileRepository().upsert(ctx, input)

  const detail = await getBrandProfile(ctx)
  if (!detail) throw new Error("upsert brand_profiles không trả lại bản ghi vừa ghi")
  return detail
}
