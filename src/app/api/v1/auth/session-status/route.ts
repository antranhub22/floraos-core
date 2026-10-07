import { handle, jsonResponse } from "@/core/http/response"
import { checkSession } from "@/modules/organization/use-cases/check-session"

export const GET = handle(async (request) => {
  await checkSession(request)
  return jsonResponse({ active: true })
})
