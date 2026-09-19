import type { TenantContext } from "@/core/tenancy"
import { TemplateOverrideRepository } from "@/modules/templates/infra/template-override-repository"

/** `GET /template-overrides?templateKey=...` (nợ #99). */
export function getTemplateOverrides(ctx: TenantContext, templateKey: string) {
  return new TemplateOverrideRepository().listForTemplate(ctx, templateKey)
}
