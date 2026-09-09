import type { sessions } from "./entities"

import { prisma } from "@/core/tenancy/infra/prisma"

import type { DbClient } from "./db-client"

/**
 * `sessions` không phải bảng thuộc tenant: nó là con trỏ *tới* một tổ chức,
 * không phải dữ liệu *của* một tổ chức. Cột `organization_id` ở đây là tổ chức
 * đang hoạt động của phiên, và nó là **nguồn duy nhất** của
 * `TenantContext.organizationId` (`YC-T2`).
 *
 * Ghi vào cột đó chỉ xảy ra ở use-case `switch-organization`, sau khi đã đối
 * chiếu `memberships`.
 */
export class SessionRepository {
  constructor(private readonly db: DbClient = prisma) {}

  create(input: {
    user_id: string
    token_hash: string
    organization_id: string | null
    expires_at: Date
  }): Promise<sessions> {
    return this.db.sessions.create({ data: input })
  }

  findByTokenHash(tokenHash: string): Promise<sessions | null> {
    return this.db.sessions.findUnique({ where: { token_hash: tokenHash } })
  }

  async setActiveOrganization(sessionId: string, organizationId: string): Promise<void> {
    await this.db.sessions.update({
      where: { id: sessionId },
      data: { organization_id: organizationId },
    })
  }

  async revoke(sessionId: string, now: Date): Promise<void> {
    await this.db.sessions.update({
      where: { id: sessionId },
      data: { revoked_at: now },
    })
  }
}
