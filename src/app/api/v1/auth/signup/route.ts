import { z } from "zod"

import { serializeSessionCookie } from "@/core/http/cookies"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { SESSION_TTL_SECONDS } from "@/modules/organization/domain/session-policy"
import { signUp } from "@/modules/organization/use-cases/sign-up"

const schema = z.object({
  email: z.string(),
  password: z.string(),
  name: z.string().nullish(),
  organization_name: z.string(),
})

export const POST = handle(async (request) => {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const result = await signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    name: parsed.data.name ?? null,
    organizationName: parsed.data.organization_name,
  })

  return jsonResponse(
    { user_id: result.userId, organization_id: result.organizationId },
    {
      status: 201,
      headers: { "set-cookie": serializeSessionCookie(result.token, SESSION_TTL_SECONDS) },
    }
  )
})
