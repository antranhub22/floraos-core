import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { MembershipRepository } from "@/modules/organization/infra/membership-repository"

/** `DELETE /members/:id` (`F4`, đặc tả 06 mục 4). */
export async function removeMember(ctx: TenantContext, membershipId: string): Promise<void> {
  const removed = await new MembershipRepository().remove(ctx, membershipId)
  if (!removed) throw notFound()
}
