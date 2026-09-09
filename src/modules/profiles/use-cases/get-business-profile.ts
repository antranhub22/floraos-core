import type { TenantContext } from "@/core/tenancy"
import { BusinessProfileRepository } from "@/modules/profiles/infra/business-profile-repository"

export type BusinessProfileDetail = {
  legal_name: string | null
  display_name: string
  phone: string | null
  email: string | null
  address: string | null
  website: string | null
  social_links: Record<string, unknown> | null
  tax_code: string | null
  description: string | null
  operating_hours: Record<string, unknown> | null
}

/**
 * `GET /business-profile` (`F1`, đặc tả 06 mục 5). Trả `null` khi tổ chức
 * chưa nhập hồ sơ lần nào — chưa có bản ghi là trạng thái bình thường, không
 * phải lỗi (khác hành vi 404 của một tài nguyên có id không tồn tại).
 */
export async function getBusinessProfile(ctx: TenantContext): Promise<BusinessProfileDetail | null> {
  const profile = await new BusinessProfileRepository().current(ctx)
  if (!profile) return null
  return {
    legal_name: profile.legal_name,
    display_name: profile.display_name,
    phone: profile.phone,
    email: profile.email,
    address: profile.address,
    website: profile.website,
    social_links: (profile.social_links as Record<string, unknown> | null) ?? null,
    tax_code: profile.tax_code,
    description: profile.description,
    operating_hours: (profile.operating_hours as Record<string, unknown> | null) ?? null,
  }
}
