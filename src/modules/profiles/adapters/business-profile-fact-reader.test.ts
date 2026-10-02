import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BusinessProfileFactReader } from './business-profile-fact-reader'
import { prisma } from '@/core/tenancy/infra/prisma'

vi.mock('@/core/tenancy/infra/prisma', () => ({
  prisma: {
    business_profiles: {
      findUnique: vi.fn(),
    },
    brand_profiles: {
      findUnique: vi.fn(),
    },
  },
}))

describe('BusinessProfileFactReader (Fact: PROJECTED)', () => {
  const orgId = 'org-test-456'
  const reader = new BusinessProfileFactReader()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chiếu đúng các trường của business_profiles thành Fact: PROJECTED với subject = shop', async () => {
    vi.mocked(prisma.business_profiles.findUnique).mockResolvedValueOnce({
      id: 'biz-1',
      organization_id: orgId,
      display_name: 'Tiệm Hoa Flora',
      legal_name: 'Công ty TNHH Flora',
      phone: '0988888888',
      email: 'contact@flora.vn',
      address: '123 Hoa Hồng, Q1, HCM',
      website: 'https://flora.vn',
      social_links: { facebook: 'https://fb.com/flora' },
      tax_code: '0123456789',
      description: 'Chuyên hoa tươi phong cách hiện đại',
      operating_hours: { mon_fri: '8:00 - 21:00' },
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-02-01'),
    } as any)

    const facts = await reader.readFacts(orgId, { subject: 'shop' })

    expect(facts.length).toBe(10)
    const nameFact = facts.find((f) => f.predicate === 'name')
    expect(nameFact).toBeDefined()
    expect(nameFact?.object).toBe('Tiệm Hoa Flora')
    expect(nameFact?.kind).toBe('PROJECTED')
    expect(nameFact?.origin).toBe('DECLARED')
    expect(nameFact?.verification).toBe('VERIFIED')
    expect(nameFact?.publication).toBe('APPROVED')
    expect(nameFact?.projectionOf?.sourceKind).toBe('business_profile')
  })

  it('chiếu đúng các trường của brand_profiles thành Fact: PROJECTED với subject = brand', async () => {
    vi.mocked(prisma.brand_profiles.findUnique).mockResolvedValueOnce({
      id: 'brand-1',
      organization_id: orgId,
      primary_color: '#be123c',
      secondary_color: '#fda4af',
      accent_color: '#f43f5e',
      background_color: '#fff1f2',
      text_color: '#881337',
      font_heading: 'Playfair Display',
      font_body: 'Inter',
      logo_asset_id: 'asset-logo-1',
      tone_of_voice: 'Sang trọng, ấm áp',
      hashtags: { default: ['#hoatuoi', '#flora'] },
      cta_templates: { default: 'Đặt hoa ngay hôm nay' },
      default_offers: { guarantees: ['Giao trong 2h'] },
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-02-01'),
    } as any)

    const facts = await reader.readFacts(orgId, { subject: 'brand' })

    expect(facts.length).toBe(12)
    const toneFact = facts.find((f) => f.predicate === 'tone_of_voice')
    expect(toneFact?.object).toBe('Sang trọng, ấm áp')
    expect(toneFact?.kind).toBe('PROJECTED')
    expect(toneFact?.subject).toBe('brand')
    expect(toneFact?.projectionOf?.sourceKind).toBe('brand_profile')
  })

  it('lấy 1 fact cụ thể qua getFact', async () => {
    vi.mocked(prisma.business_profiles.findUnique).mockResolvedValueOnce({
      id: 'biz-1',
      organization_id: orgId,
      display_name: 'Tiệm Hoa Flora',
      phone: '0988888888',
      created_at: new Date(),
      updated_at: new Date(),
    } as any)

    const fact = await reader.getFact(orgId, 'shop', 'phone')

    expect(fact).not.toBeNull()
    expect(fact?.predicate).toBe('phone')
    expect(fact?.object).toBe('0988888888')
  })
})
