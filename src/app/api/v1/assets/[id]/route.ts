import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { deleteAsset } from "@/modules/assets/use-cases/delete-asset"
import { getAsset } from "@/modules/assets/use-cases/get-asset"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "G1")

  const { id } = await context.params
  return jsonResponse({ asset: await getAsset(ctx, id) })
})

export const DELETE = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "G3")

  const { id } = await context.params
  await deleteAsset(ctx, id)
  return new Response(null, { status: 204 })
})
