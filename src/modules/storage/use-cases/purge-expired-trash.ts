import type { TenantContext } from "@/core/tenancy"
import { log } from "@/core/observability/log"
import { AuditLogRepository } from "@/modules/audit/infra/audit-log-repository"
import { trashPurgeCutoff } from "../domain/trash-types"
import { TrashRepository } from "../infra/trash-repository"

/** Mỗi loại dữ liệu tối đa chừng này mục một vòng — vòng sau dọn tiếp, không có vòng lặp vô hạn. */
export const PURGE_BATCH_PER_TYPE = 200

export interface PurgeResult {
  purged: number
  retained: number
  failed: number
}

/** Ngữ cảnh "hệ thống" — audit ghi rõ nguồn, không mang năng lực của ai. */
function systemContext(organizationId: string): TenantContext {
  return { organizationId, workspaceId: "", userId: "system:trash-purge", branchId: null, capabilities: new Set() }
}

/**
 * Xoá hẳn mọi mục đã nằm trong thùng rác quá 30 ngày (kể cả tệp ảnh trong kho).
 * Mục đã có giao dịch được giữ lại (`retained`). Lỗi từng mục chỉ ghi log — vòng sau làm tiếp.
 */
export async function purgeExpiredTrash(
  now = new Date(),
  repo = new TrashRepository(),
  audit: Pick<AuditLogRepository, "record"> = new AuditLogRepository()
): Promise<PurgeResult> {
  const result: PurgeResult = { purged: 0, retained: 0, failed: 0 }
  const expired = await repo.findExpired(trashPurgeCutoff(now), PURGE_BATCH_PER_TYPE)
  for (const ref of expired) {
    const ctx = systemContext(ref.organizationId)
    try {
      const outcome = await repo.permanentDelete(ctx, { id: ref.id, type: ref.type })
      if (outcome === "retained") result.retained += 1
      if (outcome !== "purged") continue
      result.purged += 1
      await audit.record(ctx, {
        action: "trash.auto_purge",
        entityType: ref.type.toLowerCase(),
        entityId: ref.id,
        after: { type: ref.type, reason: "expired" },
      })
    } catch (error) {
      result.failed += 1
      log.error("storage.trash.purge_failed", {
        feature: "storage",
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return result
}
