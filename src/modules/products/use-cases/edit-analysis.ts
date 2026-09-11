import { conflict, notFound, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import { runInTransaction } from "@/modules/jobs/infra/transaction"
import {
  canEditAnalysis,
  missingKeysInEdit,
} from "@/modules/products/domain/product-analysis-rules"
import { ProductAnalysisRepository } from "@/modules/products/infra/product-analysis-repository"

import { getAnalysis, type AnalysisDetail } from "./get-analysis"

/**
 * `PATCH /vision/analyses/:id` (`H2`, đặc tả 06 mục 8). Ghi vào
 * `product_analyses.edited` — `raw` không bao giờ bị đụng tới (`YC-R3`).
 *
 * Không sửa được bản đã `APPROVED` — một giả định của repo này (chưa có căn
 * cứ tường minh trong đặc tả 06/07), ghi ở `TECHNICAL_DEBT.md` để chủ sản
 * phẩm xác nhận: Product Master đã đọc `edited` tại thời điểm duyệt, sửa
 * tiếp sau đó sẽ làm `products` và `product_analyses.edited` lệch nhau mà
 * không ai biết.
 */
export async function editAnalysis(
  ctx: TenantContext,
  id: string,
  edited: Record<string, unknown>
): Promise<AnalysisDetail> {
  const repo = new ProductAnalysisRepository()
  const current = await repo.findById(ctx, id)
  if (!current) throw notFound()
  if (!canEditAnalysis(current.approval_state)) {
    throw conflict(`Đã ở trạng thái ${current.approval_state}, không sửa được nữa`)
  }

  const thieu = missingKeysInEdit(current.raw as Record<string, unknown>, edited)
  if (thieu.length > 0) {
    throw validationFailed({
      edited: `Bản sửa thay nguyên bản gốc nên phải giữ đủ các khoá máy đã trả — còn thiếu: ${thieu.join(", ")}`,
    })
  }

  await runInTransaction(async (tx) => {
    const repoTx = new ProductAnalysisRepository(tx)
    const updated = await repoTx.updateEdited(ctx, id, edited)
    if (!updated) throw conflict("Bản ghi vừa đổi trạng thái, thử lại")

    // Sửa kết quả AI là một tác nghiệp có trách nhiệm ngang duyệt: nó đổi
    // thứ sẽ vào Product Master. `product_analyses.edited` chỉ giữ bản mới
    // nhất, nên không có dòng audit thì lịch sử ai sửa gì lúc nào biến mất
    // sau lần sửa thứ hai.
    await recordAuditLog(
      ctx,
      {
        action: "product.analysis_edit",
        entityType: "product_analyses",
        entityId: id,
        before: { edited: current.edited },
        after: { edited },
      },
      tx
    )
  })

  return getAnalysis(ctx, id)
}
