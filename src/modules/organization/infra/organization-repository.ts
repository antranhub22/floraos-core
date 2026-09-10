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
   * Trừ credit có điều kiện — dùng trong giao dịch `enqueue-job` (đặc tả 05
   * mục 6, `YC-U3`). `updateMany` với `credit_balance: { gte: cost }` ngay
   * trong `where` là chốt chặn đua: hai job cùng lúc chỉ một cái trừ được
   * nếu số dư không đủ cho cả hai — không cần `SELECT … FOR UPDATE` riêng.
   * Trả `false` nghĩa là không đủ credit; use-case dịch thành
   * `QUOTA_EXCEEDED` (422) và toàn bộ giao dịch cha rollback, nên job không
   * bao giờ được tạo khi hạn mức chặn (`YC-U3`).
   */
  async tryDeductCredit(ctx: TenantContext, cost: number): Promise<boolean> {
    if (cost <= 0) return true
    const result = await this.db.organizations.updateMany({
      where: { id: ctx.organizationId, credit_balance: { gte: cost } },
      data: { credit_balance: { decrement: cost } },
    })
    return result.count > 0
  }

  /**
   * Nạp credit cho một tổ chức — thao tác của NGƯỜI VẬN HÀNH NỀN TẢNG, không
   * của người dùng trong tổ chức. Vì thế nhận thẳng `organizationId` chứ
   * không nhận `TenantContext`: người chạy nó đứng ngoài mọi tổ chức, giống
   * `create()` ngay trên.
   *
   * Không có endpoint HTTP nào gọi hàm này (chốt với anh Tony 09/10): đường
   * duy nhất là `scripts/nap-credit.ts`, chạy tay trên máy có quyền truy cập
   * cơ sở dữ liệu. Mở nó thành endpoint đòi một khái niệm "quản trị nền
   * tảng" mà bộ 114 mã năng lực chưa có.
   *
   * Trả số dư mới, hoặc `null` nếu không có tổ chức nào mang `id` đó.
   */
  async topUpCredit(organizationId: string, amount: number): Promise<number | null> {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new RangeError("Số credit nạp phải là số nguyên dương")
    }
    const result = await this.db.organizations.updateMany({
      where: { id: organizationId },
      data: { credit_balance: { increment: amount } },
    })
    if (result.count === 0) return null
    const organization = await this.db.organizations.findUnique({ where: { id: organizationId } })
    return organization?.credit_balance ?? null
  }

  /** Hoàn credit — job bị Identity Guard từ chối, quyết định D3. */
  async refundCredit(ctx: TenantContext, amount: number): Promise<void> {
    if (amount <= 0) return
    await this.db.organizations.updateMany({
      where: { id: ctx.organizationId },
      data: { credit_balance: { increment: amount } },
    })
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
