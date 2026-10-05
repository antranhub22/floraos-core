import type { TenantContext } from "@/core/tenancy"
import { getCurrentOrganization } from "@/modules/organization/use-cases/get-current-organization"
import { ownSaleScope, parseVisibilityMode } from "../domain/order-visibility"

/** Sale phụ trách cần lọc cho người đang xem (theo cài đặt của Điều hành), hoặc `null` = tất cả. */
export async function resolveSaleScope(ctx: TenantContext): Promise<string | null> {
  const org = await getCurrentOrganization(ctx)
  return ownSaleScope(parseVisibilityMode(org?.settings), { userId: ctx.userId, capabilities: ctx.capabilities })
}
