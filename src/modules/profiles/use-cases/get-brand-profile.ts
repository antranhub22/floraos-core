import type { TenantContext } from "@/core/tenancy"
import { BrandProfileRepository } from "@/modules/profiles/infra/brand-profile-repository"

export type BrandProfileDetail = {
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  background_color: string | null
  text_color: string | null
  font_heading: string | null
  font_body: string | null
  logo_asset_id: string | null
  tone_of_voice: string | null
  hashtags: Record<string, unknown> | null
  cta_templates: Record<string, unknown> | null
  default_offers: Record<string, unknown> | null
  forbidden_styles: Record<string, unknown> | null
}

/**
 * `GET /brand-profile` (`F1`, đặc tả 06 mục 5). `null` khi tổ chức chưa nhập
 * hồ sơ thương hiệu — xem chú thích ở `getBusinessProfile`.
 */
export async function getBrandProfile(ctx: TenantContext): Promise<BrandProfileDetail | null> {
  const profile = await new BrandProfileRepository().current(ctx)
  if (!profile) return null
  return {
    primary_color: profile.primary_color,
    secondary_color: profile.secondary_color,
    accent_color: profile.accent_color,
    background_color: profile.background_color,
    text_color: profile.text_color,
    font_heading: profile.font_heading,
    font_body: profile.font_body,
    logo_asset_id: profile.logo_asset_id,
    tone_of_voice: profile.tone_of_voice,
    hashtags: (profile.hashtags as Record<string, unknown> | null) ?? null,
    cta_templates: (profile.cta_templates as Record<string, unknown> | null) ?? null,
    default_offers: (profile.default_offers as Record<string, unknown> | null) ?? null,
    forbidden_styles: (profile.forbidden_styles as Record<string, unknown> | null) ?? null,
  }
}
