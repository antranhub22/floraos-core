import { serializeClearedSessionCookie } from "@/core/http/cookies"
import { handle, jsonResponse } from "@/core/http/response"
import { logOut } from "@/modules/organization/use-cases/log-out"
import { sessionTokenFrom } from "@/modules/organization/use-cases/resolve-session"

export const POST = handle(async (request) => {
  await logOut(sessionTokenFrom(request))
  return jsonResponse(
    { ok: true },
    { headers: { "set-cookie": serializeClearedSessionCookie() } }
  )
})
