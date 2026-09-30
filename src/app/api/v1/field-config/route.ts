/**
 * GET /api/v1/field-config?entity=… (`R1`, tenant, CHỈ ĐỌC — ĐP-3 3.14).
 */
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getEffectiveFieldConfig } from "@/modules/field-platform/use-cases/get-effective-field-config"
import type { FieldEntity } from "@/modules/field-platform/domain/core-field-registry"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  const url = new URL(request.url)
  const entity = (url.searchParams.get("entity") ?? undefined) as FieldEntity | undefined
  return jsonResponse({ data: await getEffectiveFieldConfig(ctx, entity) })
})

export const dynamic = "force-dynamic" as const
export const revalidate = 0 as const
