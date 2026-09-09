import type { InputJsonValue, organization_type, organizations } from "./entities"

import { prisma } from "@/core/tenancy/infra/prisma"
import type { TenantContext } from "@/core/tenancy"

import type { DbClient } from "./db-client"

/**
 * `organizations` là chính tenant, nên khoá lọc của nó là cột `id` chứ không
 * phải `organization_id`. Bộ gác vẫn ở đây, không ở route: phương thức đọc
 * nhận `TenantContext` bắt buộc và không nhận id từ đâu khác.
 */
export class OrganizationRepository {
  constructor(private readonly db: DbClient = prisma) {}

  /** Tổ chức đang hoạt động của phiên. Không có đường nào đọc tổ chức khác. */
  current(ctx: TenantContext): Promise<organizations | null> {
    return this.db.organizations.findUnique({ where: { id: ctx.organizationId } })
  }

  findBySlug(slug: string): Promise<organizations | null> {
    return this.db.organizations.findUnique({ where: { slug } })
  }

  /**
   * Sửa hồ sơ tổ chức hiện tại — nguồn của `PATCH /organizations/current`
   * (`F2`). Lọc theo `ctx.organizationId`, không theo id truyền vào — không
   * đường nào sửa được tổ chức khác dù có đoán đúng id.
   */
  async update(
    ctx: TenantContext,
    input: { name?: string; settings?: Record<string, unknown> }
  ): Promise<organizations | null> {
    const data: { name?: string; settings?: InputJsonValue } = {}
    if (input.name !== undefined) data.name = input.name
    if (input.settings !== undefined) data.settings = input.settings as InputJsonValue

    const result = await this.db.organizations.updateMany({
      where: { id: ctx.organizationId },
      data,
    })
    if (result.count === 0) return null
    return this.current(ctx)
  }

  /** Chỉ dùng lúc đăng ký, khi chưa có ngữ cảnh nào để gác. */
  create(input: {
    name: string
    slug: string
    type: organization_type
    credit_balance: number
  }): Promise<organizations> {
    return this.db.organizations.create({ data: input })
  }

  /**
   * Danh sách tổ chức người dùng là thành viên — nguồn của `GET /organizations`
   * và của bộ chọn tổ chức. Đây là truy vấn duy nhất trong core đi ngang qua
   * nhiều tổ chức, và nó lọc theo `user_id` chứ không theo tham số của client.
   */
  async listForUser(userId: string): Promise<organizations[]> {
    const memberships = await this.db.memberships.findMany({
      where: { user_id: userId, status: "ACTIVE" },
      select: { organization_id: true },
    })
    const ids = memberships.map((m) => m.organization_id)
    if (ids.length === 0) return []

    return this.db.organizations.findMany({
      where: { id: { in: ids } },
      orderBy: { created_at: "asc" },
    })
  }
}
