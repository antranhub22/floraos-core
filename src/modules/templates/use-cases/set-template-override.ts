import { validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { TemplateOverrideRepository } from "@/modules/templates/infra/template-override-repository"
import {
  validateSetTemplateOverrideInput,
  type SetTemplateOverrideInput,
} from "@/modules/templates/domain/template-override-rules"

/** `PUT /template-overrides` (nợ #99 — tạo mới hoặc cập nhật một field ghi đè). */
export async function setTemplateOverride(ctx: TenantContext, input: SetTemplateOverrideInput) {
  const validated = validateSetTemplateOverrideInput(input)
  if ("field" in validated) {
    throw validationFailed({ [validated.field]: validated.message })
  }
  return new TemplateOverrideRepository().upsert(ctx, validated)
}
