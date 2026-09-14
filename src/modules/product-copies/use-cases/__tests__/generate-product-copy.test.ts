import { describe, expect, it, vi, beforeEach } from "vitest"
import { AppError } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"

const mockTenantContext: TenantContext = {
  organizationId: "org-1",
  workspaceId: "ws-1",
  userId: "user-1",
  branchId: null,
  capabilities: new Set(["H5"]),
}

vi.mock("@/modules/products/infra/product-analysis-repository", () => ({
  ProductAnalysisRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn(),
    listPending: vi.fn(),
    create: vi.fn(),
    createApprovedHistorical: vi.fn(),
    updateEdited: vi.fn(),
    approve: vi.fn(),
  })),
}))

vi.mock("@/modules/profiles/infra/brand-profile-repository", () => ({
  BrandProfileRepository: vi.fn().mockImplementation(() => ({
    current: vi.fn(),
    upsert: vi.fn(),
  })),
}))

vi.mock("@/modules/organization/infra/occasion-repository", () => ({
  OccasionRepository: vi.fn().mockImplementation(() => ({
    list: vi.fn(),
    seedDefault: vi.fn(),
    findByCode: vi.fn(),
  })),
}))

vi.mock("@/modules/product-copies/infra/product-copy-repository", () => ({
  ProductCopyRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn(),
    findByAnalysisId: vi.fn(),
    listByProduct: vi.fn(),
    listPendingApproval: vi.fn(),
    listByApprovalState: vi.fn(),
    updateEdited: vi.fn(),
    createFromAnalysis: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  })),
}))

vi.mock("@/core/ai/gateway", () => ({
  callCapability: vi.fn(),
}))

vi.mock("@/core/ai/wiring", () => ({
  aiGatewayDeps: vi.fn(),
}))

vi.mock("@/modules/product-copies/adapters/product-copy-adapter", () => ({
  createProductCopyAdapter: vi.fn(),
}))

vi.mock("@/core/ai/adapters/openai-llm-provider", () => ({
  OpenAILLMProvider: vi.fn(),
}))

import { generateProductCopy } from "@/modules/product-copies/use-cases/generate-product-copy"
import { ProductAnalysisRepository } from "@/modules/products/infra/product-analysis-repository"
import { BrandProfileRepository } from "@/modules/profiles/infra/brand-profile-repository"
import { OccasionRepository } from "@/modules/organization/infra/occasion-repository"
import { ProductCopyRepository } from "@/modules/product-copies/infra/product-copy-repository"
import { callCapability } from "@/core/ai/gateway"
import { createProductCopyAdapter } from "@/modules/product-copies/adapters/product-copy-adapter"

describe("generateProductCopy", () => {
  let mockAnalysisRepo: any
  let mockBrandRepo: any
  let mockOccasionRepo: any
  let mockCopyRepo: any
  let mockCallCapability: ReturnType<typeof vi.fn>
  let mockCreateAdapter: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockAnalysisRepo = { findById: vi.fn() }
    mockBrandRepo = { current: vi.fn() }
    mockOccasionRepo = { list: vi.fn() }
    mockCopyRepo = { findByAnalysisId: vi.fn(), createFromAnalysis: vi.fn() }
    mockCallCapability = vi.fn()
    mockCreateAdapter = vi.fn()

    vi.mocked(ProductAnalysisRepository).mockImplementation(() => mockAnalysisRepo as any)
    vi.mocked(BrandProfileRepository).mockImplementation(() => mockBrandRepo as any)
    vi.mocked(OccasionRepository).mockImplementation(() => mockOccasionRepo as any)
    vi.mocked(ProductCopyRepository).mockImplementation(() => mockCopyRepo as any)
    vi.mocked(callCapability).mockImplementation(mockCallCapability)
    vi.mocked(createProductCopyAdapter).mockImplementation(mockCreateAdapter)
  })

  it("throws NOT_FOUND when analysis does not exist", async () => {
    mockAnalysisRepo.findById.mockResolvedValue(null)
    mockBrandRepo.current.mockResolvedValue(null)
    mockOccasionRepo.list.mockResolvedValue([])

    await expect(
      generateProductCopy(mockTenantContext, { analysisId: "non-existent" })
    ).rejects.toThrow(AppError)

    expect(mockAnalysisRepo.findById).toHaveBeenCalledWith(mockTenantContext, "non-existent")
  })

  it("returns existing copy when already generated", async () => {
    const existingCopy = {
      id: "copy-1",
      analysis_id: "analysis-1",
      raw: { suggested_name: "Test" },
    }

    mockCopyRepo.findByAnalysisId.mockResolvedValue(existingCopy)
    mockAnalysisRepo.findById.mockResolvedValue({
      id: "analysis-1",
      approval_state: "APPROVED",
      raw: { identity: { category: "Bó hoa" }, bom: {}, flower_count: 10, bud_count: 2, damaged_count: 0, confidence: 90 },
      edited: null,
      product_id: null,
    })
    mockBrandRepo.current.mockResolvedValue(null)
    mockOccasionRepo.list.mockResolvedValue([])

    const result = await generateProductCopy(mockTenantContext, { analysisId: "analysis-1" })

    expect(result.copyId).toBe("copy-1")
    expect(result.raw).toEqual({ suggested_name: "Test" })
  })

  it("throws CONFLICT when product_id mismatches", async () => {
    mockCopyRepo.findByAnalysisId.mockResolvedValue(null)
    mockAnalysisRepo.findById.mockResolvedValue({
      id: "analysis-1",
      approval_state: "APPROVED",
      product_id: "product-different",
      raw: { identity: { category: "Bó hoa" }, bom: {}, flower_count: 10, bud_count: 2, damaged_count: 0, confidence: 90 },
      edited: null,
    })
    mockBrandRepo.current.mockResolvedValue(null)
    mockOccasionRepo.list.mockResolvedValue([])

    await expect(
      generateProductCopy(mockTenantContext, { analysisId: "analysis-1", productId: "product-1" })
    ).rejects.toThrow(AppError)
  })

  it("throws VALIDATION_FAILED when analysis missing identity or bom", async () => {
    mockCopyRepo.findByAnalysisId.mockResolvedValue(null)
    mockAnalysisRepo.findById.mockResolvedValue({
      id: "analysis-1",
      approval_state: "APPROVED",
      raw: { confidence: 90 },
      edited: null,
    })
    mockBrandRepo.current.mockResolvedValue(null)
    mockOccasionRepo.list.mockResolvedValue([])

    await expect(
      generateProductCopy(mockTenantContext, { analysisId: "analysis-1" })
    ).rejects.toThrow(AppError)
  })

  it("generates new copy and saves it", async () => {
    mockCopyRepo.findByAnalysisId.mockResolvedValue(null)
    mockAnalysisRepo.findById.mockResolvedValue({
      id: "analysis-1",
      approval_state: "APPROVED",
      raw: { identity: { category: "Bó hoa", style: "Cổ điển", color_tone: "Warm" }, bom: { flowers: [], foliage: [], accessories: [], wrapping: [] }, flower_count: 10, bud_count: 2, damaged_count: 0, confidence: 90 },
      edited: null,
      product_id: null,
    })
    mockBrandRepo.current.mockResolvedValue({ tone_of_voice: "Thân thiện", hashtags: ["hoa"], cta_templates: [] })
    mockOccasionRepo.list.mockResolvedValue([{ code: "valentine", name: "Valentine" }])
    mockCopyRepo.createFromAnalysis.mockResolvedValue({
      id: "new-copy-1",
      analysis_id: "analysis-1",
      raw: { suggested_name: "Test Product", suggested_description: "Desc", suggested_tags: [], suggested_occasions: [], suggested_price_segment: "standard", suggested_style: "Cổ điển" },
    })
    mockCallCapability.mockResolvedValue({ kind: "xong", output: { suggested_name: "Test Product", suggested_description: "Desc", suggested_tags: [], suggested_occasions: [], suggested_price_segment: "standard" } })
    mockCreateAdapter.mockReturnValue({})

    const result = await generateProductCopy(mockTenantContext, { analysisId: "analysis-1" })

    expect(result.copyId).toBe("new-copy-1")
    expect(mockCallCapability).toHaveBeenCalled()
  })

  it("throws UNPROCESSABLE_ENTITY when analysis is PENDING", async () => {
    mockCopyRepo.findByAnalysisId.mockResolvedValue(null)
    mockAnalysisRepo.findById.mockResolvedValue({
      id: "analysis-1",
      approval_state: "PENDING",
      raw: { identity: { category: "Bó hoa", style: "Cổ điển", color_tone: "Warm" }, bom: { flowers: [], foliage: [], accessories: [], wrapping: [] }, flower_count: 10, bud_count: 2, damaged_count: 0, confidence: 90 },
      edited: null,
      product_id: null,
    })
    mockBrandRepo.current.mockResolvedValue(null)
    mockOccasionRepo.list.mockResolvedValue([])

    const err = await generateProductCopy(mockTenantContext, { analysisId: "analysis-1" }).catch((e: Error) => e)
    expect(err).toBeInstanceOf(AppError)
    expect((err as AppError).code).toBe("UNPROCESSABLE_ENTITY")
    expect((err as AppError).status).toBe(422)
  })
})