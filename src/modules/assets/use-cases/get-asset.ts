import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"

/** `GET /assets/:id` (`G1`). */
export async function getAsset(ctx: TenantContext, id: string) {
  const asset = await new AssetRepository().findById(ctx, id)
  if (!asset) throw notFound()
  return asset
}
