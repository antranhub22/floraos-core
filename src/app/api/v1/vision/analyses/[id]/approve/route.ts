import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { approveAnalysis } from "@/modules/products/use-cases/approve-analysis"

/**
 * `POST /vision/analyses/:id/approve` (`H3`, đặc tả 06 mục 8). Duyệt một
 * bản ghi đã `APPROVED` trả 409 — `approveAnalysis` tự ném `conflict()`,
 * `handle()` dịch thành đáp ứng đúng hình dạng.
 */
export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "H3")

  const { id } = await context.params
  let createProduct = true
  try {
    const body = (await request.json().catch(() => null)) as { create_product?: boolean } | null
    if (typeof body?.create_product === "boolean") {
      createProduct = body.create_product
    }
  } catch {
    // ignore
  }

  return jsonResponse(await approveAnalysis(ctx, id, { createProduct }))
})
