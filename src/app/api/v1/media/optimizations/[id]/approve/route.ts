import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { approveOptimization } from "@/modules/media/use-cases/approve-optimization"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

/**
 * `POST /media/optimizations/:id/approve` (`I2`, đặc tả 06 mục 8) — cổng 2.
 *
 * `I2` có trần cứng `dieu_hanh` (`capability-catalog.ts`): dù bảng công tắc
 * của tổ chức mở cho vai khác, quyền cũng không vượt ra ngoài. Trong mô hình
 * Chuỗi, Sale chạy tối ưu ảnh (`I1`) nhưng Điều hành mới duyệt ảnh chính
 * thức của sản phẩm (M04 mục 5.1).
 */
export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I2")

  const { id } = await context.params
  return jsonResponse(await approveOptimization(ctx, id))
})
