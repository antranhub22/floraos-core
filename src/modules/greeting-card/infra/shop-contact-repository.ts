import { prisma } from "@/core/tenancy/infra/prisma"
import { zaloQrUrlFromBrandAssets } from "../domain/shop-contact"
import { GreetingCatalogRepository } from "./greeting-catalog-repository"

/** Đọc thông tin công khai của tiệm (tên, SĐT, địa chỉ, email, website, logo, chính sách) cho trang khách. */
export class ShopContactRepository {
  constructor(
    private readonly db = prisma,
    private readonly assets = new GreetingCatalogRepository(),
  ) {}

  async findByOrganizationId(organizationId: string) {
    const org = await this.db.organizations.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        settings: true,
        business_profile: { select: { display_name: true, phone: true, address: true, email: true, website: true, social_links: true } },
        brand_profile: { select: { logo_asset_id: true, brand_assets: true } },
      },
    })
    if (!org) return null
    const logoId = org.brand_profile?.logo_asset_id ?? null
    const logoUrl = logoId ? await this.assets.getAssetStorageUrl(organizationId, logoId) : null
    const zaloQrUrl = zaloQrUrlFromBrandAssets(org.brand_profile?.brand_assets)
    return {
      name: org.business_profile?.display_name || org.name || "Tiệm hoa",
      phone: org.business_profile?.phone ?? null,
      address: org.business_profile?.address ?? null,
      email: org.business_profile?.email ?? null,
      website: org.business_profile?.website ?? null,
      socialLinks: org.business_profile?.social_links ?? null,
      settings: org.settings,
      logoUrl,
      zaloQrUrl,
    }
  }

  async findOrganizationIdBySlug(slug: string): Promise<string | null> {
    const org = await this.db.organizations.findFirst({
      where: { slug: slug.toLowerCase().trim() },
      select: { id: true },
    })
    return org?.id ?? null
  }
}

