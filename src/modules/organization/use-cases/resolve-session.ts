import { AppError, unauthenticated } from "@/core/http/errors"
import { readCookie, SESSION_COOKIE } from "@/core/http/cookies"
import type { TenantContext } from "@/core/tenancy"
import { isUsable } from "@/modules/organization/domain/session-policy"
import type { memberships, sessions, users } from "@/modules/organization/infra/entities"
import { MembershipRepository } from "@/modules/organization/infra/membership-repository"
import { SessionRepository } from "@/modules/organization/infra/session-repository"
import { hashSessionToken } from "@/modules/organization/infra/session-token"
import { UserRepository } from "@/modules/organization/infra/user-repository"
import { WorkspaceRepository } from "@/modules/organization/infra/workspace-repository"

/** Năng lực rỗng cho tới khi bảng 76 mã có mặt — xem `src/core/rbac/`. P2. */
const NO_CAPABILITIES: ReadonlySet<string> = Object.freeze(new Set<string>())

export type ResolvedSession = {
  readonly user: users
  readonly session: sessions
  readonly membership: memberships | null
  /** null khi phiên chưa gắn với tổ chức nào — người dùng phải chọn trước. */
  readonly ctx: TenantContext | null
}

export function sessionTokenFrom(request: Request): string | null {
  return readCookie(request, SESSION_COOKIE)
}

/**
 * Giải ngữ cảnh một lần ở biên, từ `sessions.organization_id` phía máy chủ
 * (`YC-T2`). Không lớp nào bên dưới đi tìm lại `organization_id`, và không
 * đường nào nhận nó từ body, query hay header của client.
 */
export async function resolveSession(request: Request): Promise<ResolvedSession> {
  const token = sessionTokenFrom(request)
  if (!token) throw unauthenticated()

  const sessions = new SessionRepository()
  const session = await sessions.findByTokenHash(hashSessionToken(token))
  if (!session) throw unauthenticated()
  if (!isUsable(session, new Date())) throw unauthenticated()

  const user = await new UserRepository().findById(session.user_id)
  if (!user) throw unauthenticated()

  if (!session.organization_id) {
    return { user, session, membership: null, ctx: null }
  }

  // Tư cách thành viên kiểm lại ở mỗi lần giải ngữ cảnh: người bị gỡ khỏi tổ
  // chức mất quyền đọc ngay, không phải chờ phiên hết hạn.
  const membership = await new MembershipRepository().findForUserInOrganization(
    user.id,
    session.organization_id
  )
  if (!membership || membership.status !== "ACTIVE") {
    return { user, session, membership: null, ctx: null }
  }

  const workspace = await new WorkspaceRepository().findDefaultForSessionOrganization(
    session.organization_id
  )
  if (!workspace) {
    throw new AppError("INTERNAL", "Tổ chức không có workspace nào")
  }

  return {
    user,
    session,
    membership,
    ctx: {
      organizationId: session.organization_id,
      workspaceId: workspace.id,
      userId: user.id,
      branchId: membership.branch_id,
      capabilities: NO_CAPABILITIES,
    },
  }
}

/** Dùng cho endpoint bắt buộc phải có tổ chức đang hoạt động. */
export async function requireTenantContext(
  request: Request
): Promise<{ resolved: ResolvedSession; ctx: TenantContext }> {
  const resolved = await resolveSession(request)
  if (!resolved.ctx) {
    throw new AppError("CONFLICT", "Phiên chưa chọn tổ chức đang hoạt động")
  }
  return { resolved, ctx: resolved.ctx }
}
