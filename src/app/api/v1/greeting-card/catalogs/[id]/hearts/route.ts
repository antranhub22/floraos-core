import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { getCatalogHearts } from "@/modules/greeting-card/use-cases/get-catalog-hearts"

/** GET /api/v1/greeting-card/catalogs/[id]/hearts — xếp hạng mẫu theo tổng tim (link riêng + công khai). */
export const GET = handle(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.read)
  return jsonResponse({ data: await getCatalogHearts(ctx, id) })
})

export const dynamic = "force-dynamic"
