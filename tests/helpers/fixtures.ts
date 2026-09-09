import type { TenantContext } from "@/core/tenancy"
import { WorkspaceRepository } from "@/modules/organization/infra/workspace-repository"
import { signUp } from "@/modules/organization/use-cases/sign-up"

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

export async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>
}
