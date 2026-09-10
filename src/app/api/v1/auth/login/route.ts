import { z } from "zod"

import { serializeSessionCookie, serializeSsoCookie } from "@/core/http/cookies"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { SESSION_TTL_SECONDS } from "@/modules/organization/domain/session-policy"
import { logIn } from "@/modules/organization/use-cases/log-in"
import { ssoClaimsFor, SSO_TOKEN_TTL_SECONDS } from "@/modules/sso/domain/sso-claims"
import { signSsoToken } from "@/modules/sso/infra/sso-jwt"

const schema = z.object({
  email: z.string(),
  password: z.string(),
})

export const POST = handle(async (request) => {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const result = await logIn(parsed.data)

  // B1 (Unified Shell) — phát hành thêm JWT liên-app bên cạnh cookie phiên
  // hiện có. Hai cookie khác vai trò: `floraos_session` chỉ floraos-core tự
  // đọc (tra CSDL, thu hồi được); `floraos_sso` là thứ LocalBudd/SocialFlow
  // xác minh tại chỗ, sống ngắn (xem `modules/sso/domain/sso-claims.ts`).
  const ssoToken = signSsoToken(
    ssoClaimsFor({
      userId: result.userId,
      organizationId: result.organizationId,
      email: result.email,
      now: new Date(),
    })
  )

  return jsonResponse(
    { user_id: result.userId, organization_id: result.organizationId },
    {
      headers: {
        "set-cookie": [
          serializeSessionCookie(result.token, SESSION_TTL_SECONDS),
          serializeSsoCookie(ssoToken, SSO_TOKEN_TTL_SECONDS),
        ],
      },
    }
  )
})
