import { prisma } from '@/core/tenancy/infra/prisma'
import {
  Fact,
  IFactReader,
} from '../domain/fact-reader'

/**
 * Adapter chiếu (Project) dữ liệu phẳng từ business_profiles và brand_profiles
 * thành các Facts có cấu trúc theo chuẩn Fact: PROJECTED (PATCH P3 mục 5.6).
 */
export class BusinessProfileFactReader implements IFactReader {
  async readFacts(
    organizationId: string,
    query?: { subject?: string; predicate?: string }
  ): Promise<Fact[]> {
    const facts: Fact[] = []

    // 1. Chiếu các trường từ business_profiles (subject = 'shop')
    if (!query?.subject || query.subject === 'shop') {
      const biz = await prisma.business_profiles.findUnique({
        where: { organization_id: organizationId },
      })

      if (biz) {
        const addShopFact = (
          predicate: string,
          val: unknown,
          isDeclared = true
        ) => {
          if (val === null || val === undefined || val === '') return
          if (query?.predicate && query.predicate !== predicate) return

          facts.push({
            factId: `fact:shop:${biz.id}:${predicate}`,
            organizationId,
            kind: 'PROJECTED',
            subject: 'shop',
            predicate,
            object: val,
            origin: isDeclared ? 'DECLARED' : 'OBSERVED',
            verification: 'VERIFIED',
            publication: 'APPROVED',
            effectiveFrom: biz.updated_at,
            version: 1,
            projectionOf: {
              sourceKind: 'business_profile',
              sourceId: biz.id,
            },
          })
        }

        addShopFact('name', biz.display_name)
        addShopFact('legal_name', biz.legal_name)
        addShopFact('phone', biz.phone)
        addShopFact('email', biz.email)
        addShopFact('address', biz.address)
        addShopFact('website', biz.website)
        addShopFact('social_links', biz.social_links)
        addShopFact('tax_code', biz.tax_code)
        addShopFact('description', biz.description)
        addShopFact('operating_hours', biz.operating_hours)
      }
    }

    // 2. Chiếu các trường từ brand_profiles (subject = 'brand')
    if (!query?.subject || query.subject === 'brand') {
      const brand = await prisma.brand_profiles.findUnique({
        where: { organization_id: organizationId },
      })

      if (brand) {
        const addBrandFact = (predicate: string, val: unknown) => {
          if (val === null || val === undefined || val === '') return
          if (query?.predicate && query.predicate !== predicate) return

          facts.push({
            factId: `fact:brand:${brand.id}:${predicate}`,
            organizationId,
            kind: 'PROJECTED',
            subject: 'brand',
            predicate,
            object: val,
            origin: 'DECLARED',
            verification: 'VERIFIED',
            publication: 'APPROVED',
            effectiveFrom: brand.updated_at,
            version: 1,
            projectionOf: {
              sourceKind: 'brand_profile',
              sourceId: brand.id,
            },
          })
        }

        addBrandFact('primary_color', brand.primary_color)
        addBrandFact('secondary_color', brand.secondary_color)
        addBrandFact('accent_color', brand.accent_color)
        addBrandFact('background_color', brand.background_color)
        addBrandFact('text_color', brand.text_color)
        addBrandFact('font_heading', brand.font_heading)
        addBrandFact('font_body', brand.font_body)
        addBrandFact('logo_asset_id', brand.logo_asset_id)
        addBrandFact('tone_of_voice', brand.tone_of_voice)
        addBrandFact('hashtags', brand.hashtags)
        addBrandFact('cta_templates', brand.cta_templates)
        addBrandFact('default_offers', brand.default_offers)

        if (brand.brand_assets && typeof brand.brand_assets === 'object') {
          const ba = brand.brand_assets as Record<string, unknown>
          if (ba.storefront_photos) addBrandFact('storefront_photos', ba.storefront_photos)
          if (ba.intro_video) addBrandFact('intro_video', ba.intro_video)
          if (ba.qr_code) addBrandFact('qr_code', ba.qr_code)
        }
      }
    }

    return facts
  }

  async getFact(
    organizationId: string,
    subject: string,
    predicate: string
  ): Promise<Fact | null> {
    const list = await this.readFacts(organizationId, { subject, predicate })
    return list[0] ?? null
  }
}
