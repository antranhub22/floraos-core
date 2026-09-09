import { z } from "zod"

import { serializeSessionCookie } from "@/core/http/cookies"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { SESSION_TTL_SECONDS } from "@/modules/organization/domain/session-policy"
import { logIn } from "@/modules/organization/use-cases/log-in"

const schema = z.object({
  email: z.string(),
  password: z.string(),
})

export const POST = handle(async (request) => {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const result = await logIn(parsed.data)

  return jsonResponse(
    { user_id: result.userId, organization_id: result.organizationId },
    {
      headers: { "set-cookie": serializeSessionCookie(result.token, SESSION_TTL_SECONDS) },
    }
  )
})
