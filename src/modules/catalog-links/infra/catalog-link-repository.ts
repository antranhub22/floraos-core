import type { DbClient } from "./db-client"
import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import type { InputJsonValue } from "./entities"

export class CatalogLinkRepository {
  constructor(private readonly db: DbClient = prisma) {}

  async findBySlug(slug: string) {
    return this.db.catalog_links.findUnique({ where: { slug } })
  }

  async findBySlugInOrg(ctx: TenantContext, slug: string) {
    return this.db.catalog_links.findFirst({ where: scopedWhere(ctx, { slug }) })
  }

  async create(ctx: TenantContext, input: {
    slug: string
    name: string
    description?: string | null
    filters?: Record<string, unknown> | null
    createdBy: string
  }) {
    return this.db.catalog_links.create({
      data: {
        organization_id: ctx.organizationId,
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        filters: (input.filters ?? null) as InputJsonValue,
        created_by: input.createdBy,
      },
    })
  }

  async list(ctx: TenantContext, options: { includeRevoked?: boolean } = {}) {
    return this.db.catalog_links.findMany({
      where: scopedWhere(ctx, {
        ...(options.includeRevoked ? {} : { is_revoked: false }),
      }),
      orderBy: { created_at: "desc" },
    })
  }

  async update(ctx: TenantContext, slug: string, input: {
    name?: string
    description?: string | null
    filters?: Record<string, unknown> | null
  }) {
    const result = await this.db.catalog_links.updateMany({
      where: scopedWhere(ctx, { slug }),
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.filters !== undefined ? { filters: input.filters as InputJsonValue } : {}),
      },
    })
    if (result.count === 0) return null
    return this.findBySlugInOrg(ctx, slug)
  }

  async revoke(ctx: TenantContext, slug: string, revokedBy: string) {
    const result = await this.db.catalog_links.updateMany({
      where: scopedWhere(ctx, { slug, is_revoked: false }),
      data: {
        is_revoked: true,
        revoked_at: new Date(),
        revoked_by: revokedBy,
      },
    })
    return result.count > 0
  }
}