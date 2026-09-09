import type { business_profiles, InputJsonValue } from "./entities"

import { prisma } from "@/core/tenancy/infra/prisma"
import type { TenantContext } from "@/core/tenancy"

import type { DbClient } from "./db-client"

export type UpsertBusinessProfileInput = {
  legal_name?: string | null | undefined
  display_name: string
  phone?: string | null | undefined
  email?: string | null | undefined
  address?: string | null | undefined
  website?: string | null | undefined
  social_links?: Record<string, unknown> | null | undefined
  tax_code?: string | null | undefined
  description?: string | null | undefined
  operating_hours?: Record<string, unknown> | null | undefined
}

/**
 * `business_profiles` có đúng một bản ghi mỗi tổ chức
 * (`@@unique([organization_id])`, đặc tả 07 mục 4) — cùng lý do
 * `OrganizationRepository` dùng khoá lọc trực tiếp thay vì `scopedWhere`:
 * `organization_id` vừa là khoá tổ chức vừa là khoá tra cứu duy nhất của
 * chính bảng này, nên không có mệnh đề nào khác để hợp nhất — `scopedWhere`
 * sẽ tự ném lỗi vì tưởng caller khai `organization_id` hai lần.
 *
 * `upsert` là nguồn của `PUT /business-profile` — PUT nghĩa là thay toàn bộ
 * bản ghi, nên mọi trường vắng mặt trong yêu cầu được ghi `null`, không giữ
 * nguyên giá trị cũ (khác `PATCH /organizations/current`, hợp nhất nông).
 */
export class BusinessProfileRepository {
  constructor(private readonly db: DbClient = prisma) {}

  current(ctx: TenantContext): Promise<business_profiles | null> {
    return this.db.business_profiles.findUnique({
      where: { organization_id: ctx.organizationId },
    })
  }

  upsert(ctx: TenantContext, input: UpsertBusinessProfileInput): Promise<business_profiles> {
    // `InputJsonValue` — client đã sinh (P4 xác minh xong trên Postgres thật),
    // đúng quy ước P2. `as never` chỉ còn là nợ của bốn tệp P3
    // (asset-repository.ts/usage-repository.ts/audit-log-repository.ts).
    const fields = {
      legal_name: input.legal_name ?? null,
      display_name: input.display_name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      website: input.website ?? null,
      social_links: (input.social_links ?? null) as InputJsonValue,
      tax_code: input.tax_code ?? null,
      description: input.description ?? null,
      operating_hours: (input.operating_hours ?? null) as InputJsonValue,
    }

    return this.db.business_profiles.upsert({
      where: { organization_id: ctx.organizationId },
      create: { organization_id: ctx.organizationId, ...fields },
      update: fields,
    })
  }
}
