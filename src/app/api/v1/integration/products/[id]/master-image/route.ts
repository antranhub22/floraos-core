import { handle, jsonResponse } from "@/core/http/response"
import {
  requireIntegrationContext,
  toTenantContext,
} from "@/modules/integration/use-cases/resolve-integration-context"
import { getMasterImage } from "@/modules/integration/use-cases/get-master-image"

/**
 * `GET /integration/products/:id/master-image` (đặc tả 06 mục 11, đặc tả 08
 * mục 4) — chỉ trả Master Image có `approval_state = APPROVED`. Trước khi P9
 * (Identity Guard) xây xong, luôn 404 (nợ #30, `TECHNICAL_DEBT.md`) — đúng
 * luật "ảnh chờ duyệt không rò ra ngoài core", không phải lỗi.
 */
export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const ic = await requireIntegrationContext(request)
  const ctx = await toTenantContext(ic)

  const { id } = await context.params
  // `origin` lấy từ chính lời gọi, không từ biến môi trường: URL ký sẵn phải
  // trỏ về đúng máy chủ core mà engine ngoài vừa gọi tới, kể cả sau khi Nhóm C
  // dựng proxy và ba app về chung một origin.
  const origin = new URL(request.url).origin
  return jsonResponse(await getMasterImage(ctx, id, { origin }))
})
