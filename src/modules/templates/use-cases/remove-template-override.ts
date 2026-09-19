import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { TemplateOverrideRepository } from "@/modules/templates/infra/template-override-repository"

/** `DELETE /template-overrides/:templateKey/:fieldKey` (nợ #99 — trở về mặc định hệ thống). */
export async function removeTemplateOverride(ctx: TenantContext, templateKey: string, fieldKey: string) {
  const removed = await new TemplateOverrideRepository().remove(ctx, templateKey, fieldKey)
  if (!removed) throw notFound()
}
