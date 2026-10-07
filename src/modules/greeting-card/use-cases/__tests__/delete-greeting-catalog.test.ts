import { describe, it, expect, vi } from "vitest"
import type { TenantContext } from "@/core/tenancy"
import { deleteGreetingCatalog, restoreGreetingCatalog } from "../../use-cases/delete-greeting-catalog"
import { AppError } from "@/core/http/errors"
import type { GreetingCardRepository } from "../../infra/greeting-card-repository"
import type { AuditLogRepository } from "@/modules/audit/infra/audit-log-repository"

const asRepo = (m: object) => m as unknown as GreetingCardRepository
const asAudit = (m: object) => m as unknown as AuditLogRepository

function makeCtx(userId: string, capabilities: string[] = ["L1", "R2"]): TenantContext {
  return {
    organizationId: "org-1",
    workspaceId: "ws-1",
    userId,
    branchId: null,
    capabilities: new Set(capabilities),
  }
}

describe("deleteGreetingCatalog & restoreGreetingCatalog", () => {
  it("cho phép người tạo xóa catalog của chính mình và ghi audit_logs", async () => {
    const ctx = makeCtx("user-sale-1")
    const mockCatalog = {
      id: "cat-1",
      code: "bst-tet",
      name: "BST Tết",
      type: "STANDARD",
      created_by: "user-sale-1",
      is_active: true,
    }

    const mockRepo = {
      getCatalogById: vi.fn().mockResolvedValue(mockCatalog),
      deleteCatalog: vi.fn().mockResolvedValue(undefined),
      updateCatalog: vi.fn().mockResolvedValue(undefined),
    }

    const mockAuditRepo = {
      record: vi.fn().mockResolvedValue({ id: "audit-1" }),
    }

    const result = await deleteGreetingCatalog(
      ctx,
      "cat-1",
      asRepo(mockRepo),
      asAudit(mockAuditRepo)
    )

    expect(result).toEqual({ success: true })
    expect(mockRepo.deleteCatalog).toHaveBeenCalledWith(ctx, "cat-1")
    expect(mockAuditRepo.record).toHaveBeenCalledWith(ctx, expect.objectContaining({
      action: "greeting_catalog.delete",
      entityType: "greeting_catalog",
      entityId: "cat-1",
    }))
  })

  it("chặn nhân viên khác xóa catalog không phải do mình tạo", async () => {
    const ctx = makeCtx("user-sale-2") // người khác
    const mockCatalog = {
      id: "cat-1",
      code: "bst-tet",
      name: "BST Tết",
      type: "STANDARD",
      created_by: "user-sale-1", // tạo bởi user 1
      is_active: true,
    }

    const mockRepo = {
      getCatalogById: vi.fn().mockResolvedValue(mockCatalog),
      deleteCatalog: vi.fn(),
    }
    const mockAuditRepo = { record: vi.fn() }

    await expect(
      deleteGreetingCatalog(ctx, "cat-1", asRepo(mockRepo), asAudit(mockAuditRepo))
    ).rejects.toThrow(AppError)

    expect(mockRepo.deleteCatalog).not.toHaveBeenCalled()
    expect(mockAuditRepo.record).not.toHaveBeenCalled()
  })

  it("Điều hành có quyền xóa bất kỳ catalog nào kể cả không do mình tạo", async () => {
    const ctx = makeCtx("user-dieu-hanh", ["L1", "R2", "F2"]) // Năng lực Điều hành F2
    const mockCatalog = {
      id: "cat-1",
      code: "bst-tet",
      name: "BST Tết",
      type: "STANDARD",
      created_by: "user-sale-1",
      is_active: true,
    }

    const mockRepo = {
      getCatalogById: vi.fn().mockResolvedValue(mockCatalog),
      deleteCatalog: vi.fn().mockResolvedValue(undefined),
    }
    const mockAuditRepo = { record: vi.fn().mockResolvedValue({ id: "audit-1" }) }

    const result = await deleteGreetingCatalog(
      ctx,
      "cat-1",
      asRepo(mockRepo),
      asAudit(mockAuditRepo)
    )

    expect(result).toEqual({ success: true })
    expect(mockRepo.deleteCatalog).toHaveBeenCalledWith(ctx, "cat-1")
    expect(mockAuditRepo.record).toHaveBeenCalledWith(ctx, expect.objectContaining({
      action: "greeting_catalog.delete",
    }))
  })

  it("cho phép khôi phục catalog đã xóa và ghi audit log", async () => {
    const ctx = makeCtx("user-sale-1")
    const mockCatalog = {
      id: "cat-1",
      code: "bst-tet",
      name: "BST Tết",
      type: "STANDARD",
      created_by: "user-sale-1",
      is_active: false,
    }

    const mockRepo = {
      getCatalogById: vi.fn().mockResolvedValue(mockCatalog),
      updateCatalog: vi.fn().mockResolvedValue(undefined),
    }
    const mockAuditRepo = { record: vi.fn().mockResolvedValue({ id: "audit-1" }) }

    const result = await restoreGreetingCatalog(
      ctx,
      "cat-1",
      asRepo(mockRepo),
      asAudit(mockAuditRepo)
    )

    expect(result).toEqual({ success: true })
    expect(mockRepo.updateCatalog).toHaveBeenCalledWith(ctx, "cat-1", { isActive: true })
    expect(mockAuditRepo.record).toHaveBeenCalledWith(ctx, expect.objectContaining({
      action: "greeting_catalog.restore",
    }))
  })
})
