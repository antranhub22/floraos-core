import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { resolveSession } from "@/modules/organization/use-cases/resolve-session"
import { switchOrganization } from "@/modules/organization/use-cases/switch-organization"

const schema = z.object({ organization_id: z.string() })

/**
 * Chỗ duy nhất trong toàn bộ API mà client được nêu tên một tổ chức. Mọi
 * endpoint khác lấy tổ chức từ `sessions.organization_id` phía máy chủ.
 */
export const POST = handle(async (request) => {
  const resolved = await resolveSession(request)
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const organization = await switchOrganization({
    userId: resolved.user.id,
    sessionId: resolved.session.id,
    organizationId: parsed.data.organization_id,
  })

  return jsonResponse({ organization })
})
