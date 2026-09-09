import type { workspace_kind, workspaces } from "./entities"

import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"

import type { DbClient } from "./db-client"

export class WorkspaceRepository {
  constructor(private readonly db: DbClient = prisma) {}

  list(ctx: TenantContext): Promise<workspaces[]> {
    return this.db.workspaces.findMany({
      where: scopedWhere(ctx),
      orderBy: { created_at: "asc" },
    })
  }

  findById(ctx: TenantContext, id: string): Promise<workspaces | null> {
    return this.db.workspaces.findFirst({ where: scopedWhere(ctx, { id }) })
  }

  create(
    ctx: TenantContext,
    input: {
      name: string
      kind: workspace_kind
      trial_limit?: number | null
      trial_status?: "ACTIVE" | "EXHAUSTED" | "EXPIRED" | null
    }
  ): Promise<workspaces> {
    return this.db.workspaces.create({
      data: {
        organization_id: ctx.organizationId,
        name: input.name,
        kind: input.kind,
        trial_limit: input.trial_limit ?? null,
        trial_status: input.trial_status ?? null,
      },
    })
  }

  /**
   * Dùng lúc đăng ký, khi tổ chức vừa ra đời và chưa có `TenantContext` nào để
   * gác. `organizationId` ở đây đến từ bản ghi vừa tạo phía máy chủ, không từ
   * client.
   */
  createForNewOrganization(input: {
    organizationId: string
    name: string
    kind: workspace_kind
    trial_limit: number | null
    trial_status: "ACTIVE" | "EXHAUSTED" | "EXPIRED" | null
  }): Promise<workspaces> {
    return this.db.workspaces.create({
      data: {
        organization_id: input.organizationId,
        name: input.name,
        kind: input.kind,
        trial_limit: input.trial_limit,
        trial_status: input.trial_status,
      },
    })
  }

  /**
   * Workspace mặc định của tổ chức đang hoạt động của phiên, dùng để dựng
   * `TenantContext`. Tham số `organizationId` chỉ được phép đến từ
   * `sessions.organization_id`, tức là từ phía máy chủ — đây là bước *sinh ra*
   * ngữ cảnh nên chưa có ngữ cảnh nào để gác.
   */
  findDefaultForSessionOrganization(organizationId: string): Promise<workspaces | null> {
    return this.db.workspaces.findFirst({
      where: { organization_id: organizationId },
      orderBy: { created_at: "asc" },
    })
  }
}
