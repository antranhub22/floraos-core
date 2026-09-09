import { conflict, notFound, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { isValidEmail, normalizeEmail } from "@/modules/organization/domain/credentials"
import { BranchRepository } from "@/modules/organization/infra/branch-repository"
import { MembershipRepository } from "@/modules/organization/infra/membership-repository"
import { RoleRepository } from "@/modules/organization/infra/role-repository"
import { UserRepository } from "@/modules/organization/infra/user-repository"

export type InviteMemberInput = {
  email: string
  roleId: string
  branchId?: string | null
}

/**
 * `POST /members/invite` (`F3`, đặc tả 06 mục 4).
 *
 * Người được mời có thể chưa từng có tài khoản — `users.password_hash` là
 * nullable đúng vì lý do này (đặc tả 07 mục 3). Họ đặt mật khẩu ở bước nhận
 * lời mời, ngoài phạm vi P2 (chưa có luồng email).
 */
export async function inviteMember(ctx: TenantContext, input: InviteMemberInput) {
  const email = normalizeEmail(input.email)
  if (!isValidEmail(email)) throw validationFailed({ email: "Địa chỉ thư không hợp lệ" })

  const roles = new RoleRepository()
  const role = await roles.findAssignableById(ctx, input.roleId)
  if (!role) throw notFound()

  if (input.branchId) {
    const branch = await new BranchRepository().findById(ctx, input.branchId)
    if (!branch) throw notFound()
  }

  const users = new UserRepository()
  const memberships = new MembershipRepository()

  const existingForOrg = await memberships.list(ctx)
  const existingUser = await users.findByEmail(email)
  if (existingUser && existingForOrg.some((m) => m.user_id === existingUser.id)) {
    throw conflict("Người này đã là thành viên của tổ chức")
  }

  const user =
    existingUser ??
    (await users.create({ email, password_hash: "", name: null }))

  return memberships.invite(ctx, {
    userId: user.id,
    roleId: role.id,
    branchId: input.branchId ?? null,
  })
}
