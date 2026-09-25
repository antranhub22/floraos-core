import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { createPartnerSchema, parseBody } from "@/modules/coordinator/adapters/http-schemas"
import { createPartner, listPartners } from "@/modules/coordinator/use-cases/manage-partners"

/** `GET /api/v1/coordinator/partners` (R1) — mạng lưới đối tác xưởng. `?active=1` chỉ lấy đang nhận đơn. */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R1")
  const activeOnly = new URL(request.url).searchParams.get("active") === "1"
  return jsonResponse({ partners: await listPartners(ctx, { activeOnly }) })
})

/** `POST /api/v1/coordinator/partners` (R4) — thêm đối tác. Trùng mã trong tổ chức → 409. */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R4")
  const body = await parseBody(request, createPartnerSchema)
  return jsonResponse({ partner: await createPartner(ctx, body) }, { status: 201 })
})
