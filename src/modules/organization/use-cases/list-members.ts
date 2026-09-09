import type { TenantContext } from "@/core/tenancy"
import { MembershipRepository } from "@/modules/organization/infra/membership-repository"
import { RoleRepository } from "@/modules/organization/infra/role-repository"
import { UserRepository } from "@/modules/organization/infra/user-repository"

export type MemberSummary = {
  id: string
  user: { id: string; name: string | null; email: string }
  role: { id: string; key: string; name: string } | null
  branch_id: string | null
  status: string
  invited_at: string
  joined_at: string | null
}

/** `GET /members` (`F1`, đặc tả 06 mục 4). */
export async function listMembers(ctx: TenantContext): Promise<MemberSummary[]> {
  const memberships = await new MembershipRepository().list(ctx)
  const users = new UserRepository()
  const roles = new RoleRepository()

  return Promise.all(
    memberships.map(async (membership) => {
      const [user, role] = await Promise.all([
        users.findById(membership.user_id),
        roles.findAssignableById(ctx, membership.role_id),
      ])
      return {
        id: membership.id,
        user: user ? { id: user.id, name: user.name, email: user.email } : { id: membership.user_id, name: null, email: "" },
        role: role ? { id: role.id, key: role.key, name: role.name } : null,
        branch_id: membership.branch_id,
        status: membership.status,
        invited_at: membership.invited_at.toISOString(),
        joined_at: membership.joined_at ? membership.joined_at.toISOString() : null,
      }
    })
  )
}
