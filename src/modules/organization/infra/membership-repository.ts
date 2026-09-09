import type { membership_status, memberships } from "./entities"

import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"

import type { DbClient } from "./db-client"

export class MembershipRepository {
  constructor(private readonly db: DbClient = prisma) {}

  list(ctx: TenantContext): Promise<memberships[]> {
    return this.db.memberships.findMany({
      where: scopedWhere(ctx),
      orderBy: { invited_at: "asc" },
    })
  }

  findById(ctx: TenantContext, id: string): Promise<memberships | null> {
    return this.db.memberships.findFirst({ where: scopedWhere(ctx, { id }) })
  }

  /** Tư cách thành viên của chính người đang đăng nhập, trong tổ chức hiện tại. */
  findForCurrentUser(ctx: TenantContext): Promise<memberships | null> {
    return this.db.memberships.findFirst({ where: scopedWhere(ctx, { user_id: ctx.userId }) })
  }

  /**
   * Tư cách thành viên của một người trong một tổ chức cụ thể.
   *
   * Đây là phép kiểm đứng sau `POST /session/organization` — chỗ duy nhất
   * client được nêu tên một tổ chức. Không tìm thấy thì tầng trên trả 404, vì
   * trả 403 là xác nhận tổ chức đó có thật (`YC-T4`).
   */
  findForUserInOrganization(
    userId: string,
    organizationId: string
  ): Promise<memberships | null> {
    return this.db.memberships.findFirst({
      where: { user_id: userId, organization_id: organizationId },
    })
  }

  /** Tổ chức đầu tiên người dùng còn hoạt động, dùng để chọn tổ chức lúc đăng nhập. */
  findFirstActiveForUser(userId: string): Promise<memberships | null> {
    return this.db.memberships.findFirst({
      where: { user_id: userId, status: "ACTIVE" },
      orderBy: { invited_at: "asc" },
    })
  }

  /** Chỉ dùng lúc đăng ký, khi tổ chức vừa ra đời và chưa có ngữ cảnh để gác. */
  createForNewOrganization(input: {
    organizationId: string
    userId: string
    roleId: string
    status: membership_status
    joinedAt: Date | null
  }): Promise<memberships> {
    return this.db.memberships.create({
      data: {
        organization_id: input.organizationId,
        user_id: input.userId,
        role_id: input.roleId,
        status: input.status,
        joined_at: input.joinedAt,
      },
    })
  }
}
