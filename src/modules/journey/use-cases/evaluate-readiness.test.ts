import { describe, expect, it } from 'vitest'
import { Fact, IFactReader } from '@/modules/profiles/domain/fact-reader'
import { LANDING_PAGE_MANIFEST } from '../domain/manifests/landing-page-manifest'
import { EvaluateReadinessUseCase } from './evaluate-readiness'

class MockFactReader implements IFactReader {
  private facts: Map<string, Fact> = new Map()

  setFact(fact: Fact) {
    const key = `${fact.organizationId}:${fact.subject}:${fact.predicate}`
    this.facts.set(key, fact)
  }

  async readFacts(
    organizationId: string,
    query?: { subject?: string; predicate?: string }
  ): Promise<Fact[]> {
    return Array.from(this.facts.values()).filter((f) => {
      if (f.organizationId !== organizationId) return false
      if (query?.subject && f.subject !== query.subject) return false
      if (query?.predicate && f.predicate !== query.predicate) return false
      return true
    })
  }

  async getFact(
    organizationId: string,
    subject: string,
    predicate: string
  ): Promise<Fact | null> {
    const key = `${organizationId}:${subject}:${predicate}`
    return this.facts.get(key) ?? null
  }
}

describe('EvaluateReadinessUseCase (Readiness Gate)', () => {
  const orgId = 'org-123'

  it('trả về READY và nextScreen = run_panel khi đáp ứng đủ cả hard và soft requirements', async () => {
    const reader = new MockFactReader()
    reader.setFact({
      factId: 'f1',
      organizationId: orgId,
      kind: 'PROJECTED',
      subject: 'shop',
      predicate: 'name',
      object: 'Tiệm Hoa Hồng Xanh',
      origin: 'DECLARED',
      verification: 'VERIFIED',
      publication: 'APPROVED',
      effectiveFrom: new Date(),
      version: 1,
    })
    reader.setFact({
      factId: 'f2',
      organizationId: orgId,
      kind: 'PROJECTED',
      subject: 'shop',
      predicate: 'phone',
      object: '0901234567',
      origin: 'DECLARED',
      verification: 'VERIFIED',
      publication: 'APPROVED',
      effectiveFrom: new Date(),
      version: 1,
    })
    reader.setFact({
      factId: 'f3',
      organizationId: orgId,
      kind: 'PROJECTED',
      subject: 'brand',
      predicate: 'primary_color',
      object: '#e11d48',
      origin: 'DECLARED',
      verification: 'VERIFIED',
      publication: 'APPROVED',
      effectiveFrom: new Date(),
      version: 1,
    })

    const useCase = new EvaluateReadinessUseCase(reader)
    const result = await useCase.execute(orgId, LANDING_PAGE_MANIFEST)

    expect(result.status).toBe('READY')
    expect(result.canProceed).toBe(true)
    expect(result.nextScreen).toBe('run_panel')
  })

  it('trả về BLOCKED và nextScreen = gap_resolver khi thiếu hard requirement', async () => {
    const reader = new MockFactReader()
    // Chỉ có tên, thiếu phone (hard requirement)
    reader.setFact({
      factId: 'f1',
      organizationId: orgId,
      kind: 'PROJECTED',
      subject: 'shop',
      predicate: 'name',
      object: 'Tiệm Hoa Hồng Xanh',
      origin: 'DECLARED',
      verification: 'VERIFIED',
      publication: 'APPROVED',
      effectiveFrom: new Date(),
      version: 1,
    })

    const useCase = new EvaluateReadinessUseCase(reader)
    const result = await useCase.execute(orgId, LANDING_PAGE_MANIFEST)

    expect(result.status).toBe('BLOCKED')
    expect(result.canProceed).toBe(false)
    expect(result.nextScreen).toBe('gap_resolver')
    const phoneRes = result.results.find((r) => r.requirement.predicate === 'phone')
    expect(phoneRes?.passed).toBe(false)
  })

  it('trả về READY_WITH_RECOMMENDATIONS và nextScreen = inline_confirm_chip khi chỉ thiếu soft requirement', async () => {
    const reader = new MockFactReader()
    // Đủ hard (name, phone), nhưng thiếu soft (primary_color)
    reader.setFact({
      factId: 'f1',
      organizationId: orgId,
      kind: 'PROJECTED',
      subject: 'shop',
      predicate: 'name',
      object: 'Tiệm Hoa Hồng Xanh',
      origin: 'DECLARED',
      verification: 'VERIFIED',
      publication: 'APPROVED',
      effectiveFrom: new Date(),
      version: 1,
    })
    reader.setFact({
      factId: 'f2',
      organizationId: orgId,
      kind: 'PROJECTED',
      subject: 'shop',
      predicate: 'phone',
      object: '0901234567',
      origin: 'DECLARED',
      verification: 'VERIFIED',
      publication: 'APPROVED',
      effectiveFrom: new Date(),
      version: 1,
    })

    const useCase = new EvaluateReadinessUseCase(reader)
    const result = await useCase.execute(orgId, LANDING_PAGE_MANIFEST)

    expect(result.status).toBe('READY_WITH_RECOMMENDATIONS')
    expect(result.canProceed).toBe(true)
    expect(result.nextScreen).toBe('inline_confirm_chip')
  })
})
