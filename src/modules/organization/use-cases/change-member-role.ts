import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import type { memberships } from "@/modules/organization/infra/entities"
import { MembershipRepository } from "@/modules/organization/infra/membership-repository"
import { RoleRepository } from "@/modules/organization/infra/role-repository"

/** `PATCH /members/:id/role` (`F5`, đặc tả 06 mục 4). */
export async function changeMemberRole(
  ctx: TenantContext,
  membershipId: string,
  roleId: string
): Promise<memberships> {
  const role = await new RoleRepository().findAssignableById(ctx, roleId)
  if (!role) throw notFound()

  const updated = await new MembershipRepository().updateRole(ctx, membershipId, role.id)
  if (!updated) throw notFound()
  return updated
}
