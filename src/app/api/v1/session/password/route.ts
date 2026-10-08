import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { changeOwnPassword } from "@/modules/organization/use-cases/staff-accounts"

const schema = z.object({ current_password: z.string().max(200), new_password: z.string().max(200) })

/**
 * `POST /session/password` (`A2`): người đang đăng nhập tự đổi mật khẩu (vd. sau khi nhận mật khẩu tạm).
 * Phiên đang dùng giữ nguyên, các máy khác bị đăng xuất.
 */
export const POST = handle(async (request) => {
  await enforceRateLimit(request, { scope: "password-change", limit: 10, windowMs: 15 * 60_000 })
  const { ctx, resolved } = await requireTenantContext(request)
  requireCapability(ctx, "A2")
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  await changeOwnPassword(ctx, {
    currentPassword: parsed.data.current_password,
    newPassword: parsed.data.new_password,
    keepSessionId: resolved.session.id,
  })
  return jsonResponse({ data: { changed: true } })
})
