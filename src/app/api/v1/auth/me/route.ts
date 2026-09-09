import { handle, jsonResponse } from "@/core/http/response"
import { describeSession } from "@/modules/organization/use-cases/describe-session"
import { resolveSession } from "@/modules/organization/use-cases/resolve-session"

export const GET = handle(async (request) => {
  const resolved = await resolveSession(request)
  return jsonResponse(await describeSession(resolved))
})
