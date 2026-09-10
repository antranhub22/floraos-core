import { AppError, unauthenticated } from "@/core/http/errors"
import { readCookie, SESSION_COOKIE } from "@/core/http/cookies"
import type { TenantContext } from "@/core/tenancy"
import { isUsable } from "@/modules/organization/domain/session-policy"
import type { memberships, sessions, users } from "@/modules/organization/infra/entities"
import { CapabilityRepository } from "@/modules/organization/infra/capability-repository"
import { MembershipRepository } from "@/modules/organization/infra/membership-repository"
import { RoleRepository } from "@/modules/organization/infra/role-repository"
import { SessionRepository } from "@/modules/organization/infra/session-repository"
import { hashSessionToken } from "@/modules/organization/infra/session-token"
import { UserRepository } from "@/modules/organization/infra/user-repository"
import { WorkspaceRepository } from "@/modules/organization/infra/workspace-repository"

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

  const resolved = await tenantContextFor(user.id, session.organization_id)
  if (!resolved) {
    return { user, session, membership: null, ctx: null }
  }

  return { user, session, membership: resolved.membership, ctx: resolved.ctx }
}

/**
 * Dựng `TenantContext` đầy đủ cho một cặp (người dùng, tổ chức) — tách khỏi
 * `resolveSession` để dùng lại cho đường danh tính KHÁC cookie phiên: JWT
 * `floraos_sso` mà `LocalBudd`/`SocialFlow` chuyển tiếp vào
 * `/api/v1/integration/*` (xem `modules/integration/use-cases/
 * resolve-integration-context.ts`).
 *
 * `null` = người này không còn là thành viên `ACTIVE` của tổ chức đó. Bên gọi
 * quyết định điều đó nghĩa là gì: `resolveSession` trả phiên chưa gắn tổ chức,
 * còn đường tích hợp trả `UNAUTHENTICATED`.
 *
 * `organizationId` LUÔN đến từ nguồn phía máy chủ đã xác minh (bản ghi
 * `sessions`, hoặc chữ ký JWT do chính core ký) — không bao giờ từ body/query.
 */
export async function tenantContextFor(
  userId: string,
  organizationId: string
): Promise<{ ctx: TenantContext; membership: memberships } | null> {
  // Tư cách thành viên kiểm lại ở mỗi lần giải ngữ cảnh: người bị gỡ khỏi tổ
  // chức mất quyền đọc ngay, không phải chờ phiên hết hạn.
  const membership = await new MembershipRepository().findForUserInOrganization(
    userId,
    organizationId
  )
  if (!membership || membership.status !== "ACTIVE") return null

  const workspace = await new WorkspaceRepository().findDefaultForSessionOrganization(
    organizationId
  )
  if (!workspace) {
    throw new AppError("INTERNAL", "Tổ chức không có workspace nào")
  }

  const role = await new RoleRepository().findAssignableByIdForOrganization(
    organizationId,
    membership.role_id
  )
  if (!role) {
    throw new AppError("INTERNAL", "Tư cách thành viên trỏ tới một vai không còn tồn tại")
  }

  // Ba lớp quyền tính một lần ở biên (đặc tả 02 mục 1): switchboard của vai,
  // đè bằng ngoại lệ của tổ chức, rồi trần cứng cắt sau cùng. `ctx.capabilities`
  // là kết quả cuối, chỉ còn việc `hasCapability`/`requireCapability` tra cứu.
  const grants = await new CapabilityRepository().resolveGrants(organizationId, role.id, role.key)

  return {
    ctx: {
      organizationId,
      workspaceId: workspace.id,
      userId,
      branchId: membership.branch_id,
      capabilities: new Set(grants.map((grant) => grant.code)),
    },
    membership,
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
