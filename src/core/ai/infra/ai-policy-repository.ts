import { prisma } from "@/core/tenancy/infra/prisma"
import type { TenantContext } from "@/core/tenancy"

import type { ai_policies, InputJsonValue } from "./entities"
import type { DbClient } from "./db-client"

export type UpsertAiPolicyInput = {
  capability_code: string
  allowed_models: string[]
  quality_target?: string | null | undefined
  cost_ceiling?: number | null | undefined
  privacy_floor: "PUBLIC" | "SHOP" | "SENSITIVE"
}

/** `ai_policies` — thuộc tenant, nên bộ gác tổ chức áp ở đây như mọi bảng khác. */
export class AiPolicyRepository {
  constructor(private readonly db: DbClient = prisma) {}

  list(ctx: TenantContext): Promise<ai_policies[]> {
    return this.db.ai_policies.findMany({
      where: { organization_id: ctx.organizationId },
      orderBy: { capability_code: "asc" },
    })
  }

  find(ctx: TenantContext, capabilityCode: string): Promise<ai_policies | null> {
    return this.db.ai_policies.findFirst({
      where: { organization_id: ctx.organizationId, capability_code: capabilityCode },
    })
  }

  upsert(ctx: TenantContext, input: UpsertAiPolicyInput): Promise<ai_policies> {
    const fields = {
      allowed_models: input.allowed_models as InputJsonValue,
      quality_target: input.quality_target ?? null,
      cost_ceiling: input.cost_ceiling ?? null,
      privacy_floor: input.privacy_floor,
      updated_by: ctx.userId,
    }

    return this.db.ai_policies.upsert({
      where: {
        organization_id_capability_code: {
          organization_id: ctx.organizationId,
          capability_code: input.capability_code,
        },
      },
      create: {
        organization_id: ctx.organizationId,
        capability_code: input.capability_code,
        ...fields,
      },
      update: fields,
    })
  }
}
