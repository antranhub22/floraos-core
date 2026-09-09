import { handle, jsonResponse } from "@/core/http/response"
import { listOrganizations } from "@/modules/organization/use-cases/list-organizations"
import { resolveSession } from "@/modules/organization/use-cases/resolve-session"

export const GET = handle(async (request) => {
  const resolved = await resolveSession(request)
  return jsonResponse({ data: await listOrganizations(resolved.user.id), next_cursor: null })
})
