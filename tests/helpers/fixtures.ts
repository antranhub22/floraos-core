import type { TenantContext } from "@/core/tenancy"
import { WorkspaceRepository } from "@/modules/organization/infra/workspace-repository"
import { signUp } from "@/modules/organization/use-cases/sign-up"
import { SSO_HEADER } from "@/modules/integration/domain/integration-credential"
import { ssoClaimsFor } from "@/modules/sso/domain/sso-claims"
import { signSsoToken } from "@/modules/sso/infra/sso-jwt"

export type Tenant = {
  readonly organizationId: string
  readonly userId: string
  readonly token: string
  readonly ctx: TenantContext
}

/**
 * Dựng một tổ chức hoàn chỉnh qua đúng luồng đăng ký thật, để bộ test cách ly
 * chạy trên dữ liệu do chính hệ thống sinh ra chứ không do test cấy vào.
 */
export async function createTenant(label: string): Promise<Tenant> {
  const result = await signUp({
    email: `${label}@vi-du.test`,
    password: "mat-khau-du-dai",
    name: `Người dùng ${label}`,
    organizationName: `Tiệm hoa ${label}`,
  })

  const workspace = await new WorkspaceRepository().findDefaultForSessionOrganization(
    result.organizationId
  )
  if (!workspace) throw new Error("Đăng ký không tạo workspace")

  return {
    organizationId: result.organizationId,
    userId: result.userId,
    token: result.token,
    ctx: {
      organizationId: result.organizationId,
      workspaceId: workspace.id,
      userId: result.userId,
      branchId: null,
      capabilities: new Set<string>(),
    },
  }
}

export function withSession(url: string, token: string, init?: RequestInit): Request {
  const headers = new Headers(init?.headers)
  headers.set("cookie", `floraos_session=${encodeURIComponent(token)}`)
  if (init?.body) headers.set("content-type", "application/json")
  return new Request(url, { ...init, headers })
}

/**
 * Cùng vai trò với `withSession` nhưng cho token máy gọi máy (P7, `YC-T8`) —
 * `Authorization: Bearer`, không phải cookie phiên. Dùng để gọi thẳng
 * `/api/v1/integration/*` trong test cách ly tenant.
 */
export function withBearer(url: string, token: string, init?: RequestInit): Request {
  const headers = new Headers(init?.headers)
  headers.set("authorization", `Bearer ${token}`)
  if (init?.body) headers.set("content-type", "application/json")
  return new Request(url, { ...init, headers })
}

/**
 * Lời gọi `/api/v1/integration/*` THAY MẶT một người dùng — JWT `floraos_sso`
 * chuyển tiếp trong header `X-FloraOS-SSO`, đúng cách `LocalBudd`/`SocialFlow`
 * gọi từ backend của chúng. Ký bằng chính `signSsoToken` của core để test
 * khoá luôn cả khuôn JWT, không tự chế một chuỗi giả.
 */
export function withSso(
  url: string,
  input: { userId: string; organizationId: string | null; email?: string | null },
  init?: RequestInit
): Request {
  const token = signSsoToken(
    ssoClaimsFor({
      userId: input.userId,
      organizationId: input.organizationId,
      email: input.email ?? null,
      now: new Date(),
    })
  )
  const headers = new Headers(init?.headers)
  headers.set(SSO_HEADER, token)
  if (init?.body) headers.set("content-type", "application/json")
  return new Request(url, { ...init, headers })
}

export async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>
}

/**
 * Thêm một nhân viên ĐANG HOẠT ĐỘNG vào tổ chức với vai hệ thống `roleKey`, kèm phiên đăng nhập
 * thật (cookie) — để gọi thẳng route và để máy chủ tự suy năng lực từ vai, không cấy năng lực tay.
 */
export async function addStaffWithSession(
  tenant: Tenant,
  roleKey: "dieu_hanh" | "dieu_phoi" | "sale",
  label: string
): Promise<{ userId: string; token: string; email: string }> {
  const { randomUUID } = await import("node:crypto")
  const { prisma } = await import("@/core/tenancy/infra/prisma")
  const { RoleRepository } = await import("@/modules/organization/infra/role-repository")
  const { newSessionToken, hashSessionToken } = await import("@/modules/organization/infra/session-token")
  const { expiresAt } = await import("@/modules/organization/domain/session-policy")
  const role = await new RoleRepository().findSystemRoleByKey(roleKey)
  if (!role) throw new Error(`Thiếu vai hệ thống ${roleKey}`)
  const email = `${label}-${randomUUID().slice(0, 8)}@vi-du.test`
  const user = await prisma.users.create({ data: { id: randomUUID(), email, name: label } })
  await prisma.memberships.create({
    data: { id: randomUUID(), organization_id: tenant.organizationId, user_id: user.id, role_id: role.id, status: "ACTIVE", joined_at: new Date() },
  })
  const token = newSessionToken()
  await prisma.sessions.create({
    data: { user_id: user.id, token_hash: hashSessionToken(token), organization_id: tenant.organizationId, expires_at: expiresAt(new Date()) },
  })
  return { userId: user.id, token, email }
}
