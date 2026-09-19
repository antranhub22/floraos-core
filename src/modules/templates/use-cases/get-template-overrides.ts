import type { TenantContext } from "@/core/tenancy"
import { prisma } from "@/core/tenancy/infra/prisma"
import { TemplateOverrideRepository } from "@/modules/templates/infra/template-override-repository"

/** `GET /template-overrides?templateKey=...` (nợ #99). */
export function getTemplateOverrides(ctx: TenantContext, templateKey: string) {
  return new TemplateOverrideRepository(prisma).listForTemplate(ctx, templateKey)
}
