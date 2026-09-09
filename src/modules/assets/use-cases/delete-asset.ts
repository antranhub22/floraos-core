import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"

/** `DELETE /assets/:id` (`G3`, trần cứng Điều hành). */
export async function deleteAsset(ctx: TenantContext, id: string): Promise<void> {
  const deleted = await new AssetRepository().delete(ctx, id)
  if (!deleted) throw notFound()
}
