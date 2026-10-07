import type { TenantContext } from "@/core/tenancy"
import { notFound, AppError } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { AuditLogRepository } from "@/modules/audit/infra/audit-log-repository"

/**
 * Kiểm tra xem người dùng có quyền quản trị/điều hành toàn bộ catalog không.
 * Các năng lực điều hành: F2 (quản trị tổ chức), R6 (huỷ đơn), R10 (hoàn tiền), hoặc vai trò điều hành.
 */
export function isCatalogAdmin(ctx: TenantContext): boolean {
  return ctx.capabilities.has("F2") || ctx.capabilities.has("R6") || ctx.capabilities.has("R10")
}

/**
 * Xóa bộ sưu tập Thẻ chào:
 * - Nguyên tắc: ai tạo catalog thì có quyền xóa catalog đó (`created_by === ctx.userId`).
 * - Điều hành (`isCatalogAdmin`) có toàn quyền xóa bất kỳ catalog nào.
 * - Khi xóa: soft-delete (đặt `is_active: false`), lưu vết đầy đủ vào `audit_logs`.
 */
export async function deleteGreetingCatalog(
  ctx: TenantContext,
  catalogId: string,
  repo = new GreetingCardRepository(),
  auditRepo = new AuditLogRepository()
) {
  const catalog = await repo.getCatalogById(ctx, catalogId)
  if (!catalog) throw notFound()

  const canDelete = isCatalogAdmin(ctx) || catalog.created_by === ctx.userId
  if (!canDelete) {
    throw new AppError(
      "CAPABILITY_DENIED",
      "Bạn chỉ có quyền xóa bộ sưu tập do chính mình tạo ra"
    )
  }

  await repo.deleteCatalog(ctx, catalogId)

  // Ghi nhận nhật ký kiểm toán cho Điều hành lưu giữ
  await auditRepo.record(ctx, {
    action: "greeting_catalog.delete",
    entityType: "greeting_catalog",
    entityId: catalog.id,
    before: {
      id: catalog.id,
      code: catalog.code,
      name: catalog.name,
      type: catalog.type,
      created_by: catalog.created_by,
      is_active: catalog.is_active,
    },
    after: {
      is_active: false,
      deleted_by: ctx.userId,
    },
  })

  return { success: true }
}

/**
 * Khôi phục bộ sưu tập Thẻ chào đã ẩn (trong vòng 3 ngày hoặc khi cần):
 * - Dành cho Điều hành hoặc người tạo.
 */
export async function restoreGreetingCatalog(
  ctx: TenantContext,
  catalogId: string,
  repo = new GreetingCardRepository(),
  auditRepo = new AuditLogRepository()
) {
  const catalog = await repo.getCatalogById(ctx, catalogId)
  if (!catalog) throw notFound()

  const canRestore = isCatalogAdmin(ctx) || catalog.created_by === ctx.userId
  if (!canRestore) {
    throw new AppError(
      "CAPABILITY_DENIED",
      "Bạn không có quyền khôi phục bộ sưu tập này"
    )
  }

  await repo.updateCatalog(ctx, catalogId, { isActive: true })

  await auditRepo.record(ctx, {
    action: "greeting_catalog.restore",
    entityType: "greeting_catalog",
    entityId: catalog.id,
    before: { is_active: catalog.is_active },
    after: { is_active: true, restored_by: ctx.userId },
  })

  return { success: true }
}
