import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { resetMemberPassword } from "@/modules/organization/use-cases/staff-accounts"

/**
 * `POST /members/:id/reset-password` (`A7`, trần cứng Điều hành): cấp mật khẩu tạm mới, đăng xuất nhân
 * viên ở mọi máy. Thành viên tiệm khác → 404.
 */
export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "A7")
  const { id } = await context.params
  return jsonResponse({ data: await resetMemberPassword(ctx, id) }, { headers: { "cache-control": "no-store" } })
})
