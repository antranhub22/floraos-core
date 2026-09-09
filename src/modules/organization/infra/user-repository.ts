import type { users } from "./entities"

import { prisma } from "@/core/tenancy/infra/prisma"

import type { DbClient } from "./db-client"

/**
 * `users` là bảng duy nhất không mang `organization_id` (đặc tả 07 mục 1):
 * một người thuộc nhiều tổ chức qua `memberships`. Nên repository này không
 * nhận `TenantContext` — nó chạy trước khi có ngữ cảnh, lúc đăng nhập.
 *
 * Không phương thức nào ở đây trả dữ liệu thuộc tenant.
 */
export class UserRepository {
  constructor(private readonly db: DbClient = prisma) {}

  findByEmail(email: string): Promise<users | null> {
    return this.db.users.findUnique({ where: { email } })
  }

  findById(id: string): Promise<users | null> {
    return this.db.users.findUnique({ where: { id } })
  }

  create(input: {
    email: string
    password_hash: string
    name: string | null
  }): Promise<users> {
    return this.db.users.create({ data: input })
  }
}
