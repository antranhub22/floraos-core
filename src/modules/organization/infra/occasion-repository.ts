import type { DbClient } from "@/modules/organization/infra/db-client"
import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy"

const DEFAULT_OCCASIONS = [
  { code: "valentine", name: "Valentine", sortOrder: 1 },
  { code: "women_day", name: "8/3", sortOrder: 2 },
  { code: "mothers_day", name: "Ngày mẹ", sortOrder: 3 },
  { code: "wedding", name: "Cưới", sortOrder: 4 },
  { code: "opening", name: "Khai trương", sortOrder: 5 },
  { code: "anniversary", name: "Kỷ niệm", sortOrder: 6 },
] as const

export class OccasionRepository {
  constructor(private readonly db: DbClient) {}

  async seedDefault(ctx: TenantContext): Promise<void> {
    const existing = await this.db.occasions.findMany({
      where: scopedWhere(ctx, {}),
      select: { code: true },
    })
    const existingCodes = new Set(existing.map((o: { code: string }) => o.code))

    const toCreate = DEFAULT_OCCASIONS.filter((o) => !existingCodes.has(o.code))
    if (toCreate.length === 0) return

    await this.db.occasions.createMany({
      data: toCreate.map((o) =>
        scopedData(ctx, {
          code: o.code,
          name: o.name,
          sort_order: o.sortOrder,
          is_active: true,
        })
      ),
    })
  }

  async list(ctx: TenantContext) {
    return this.db.occasions.findMany({
      where: scopedWhere(ctx, { is_active: true }),
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    })
  }

  async findByCode(ctx: TenantContext, code: string) {
    return this.db.occasions.findFirst({
      where: scopedWhere(ctx, { code }),
    })
  }
}