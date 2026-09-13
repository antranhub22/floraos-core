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

vi.mock("@/modules/product-copies/infra/product-copy-repository", () => ({
  ProductCopyRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn(),
    listByProduct: vi.fn(),
    listPendingApproval: vi.fn(),
  })),
}))

import { getProductCopy, listProductCopies } from "@/modules/product-copies/use-cases/get-product-copy"
import { ProductCopyRepository } from "@/modules/product-copies/infra/product-copy-repository"

describe("getProductCopy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns copy when found", async () => {
    const mockCopy = { id: "copy-1", analysis_id: "analysis-1", raw: {} }

    vi.mocked(ProductCopyRepository).mockImplementation(() => ({
      findById: vi.fn().mockResolvedValue(mockCopy),
    }))

    const result = await getProductCopy(mockTenantContext, "copy-1")

    expect(result).toEqual(mockCopy)
  })

  it("throws NOT_FOUND when copy not found", async () => {
    vi.mocked(ProductCopyRepository).mockImplementation(() => ({
      findById: vi.fn().mockResolvedValue(null),
    }))

    await expect(getProductCopy(mockTenantContext, "non-existent")).rejects.toThrow(AppError)
  })
})

describe("listProductCopies", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists by productId when provided", async () => {
    const mockCopies = [{ id: "copy-1" }, { id: "copy-2" }]

    vi.mocked(ProductCopyRepository).mockImplementation(() => ({
      listByProduct: vi.fn().mockResolvedValue(mockCopies),
    }))

    const result = await listProductCopies(mockTenantContext, "product-1")

    expect(result).toEqual(mockCopies)
  })

  it("lists pending approval when no productId", async () => {
    const mockCopies = [{ id: "copy-1" }]

    vi.mocked(ProductCopyRepository).mockImplementation(() => ({
      listPendingApproval: vi.fn().mockResolvedValue(mockCopies),
    }))

    const result = await listProductCopies(mockTenantContext)

    expect(result).toEqual(mockCopies)
  })
})