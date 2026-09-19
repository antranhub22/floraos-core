import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { TEMPLATE_FAMILIES } from "@/modules/templates/domain/template-override-rules"
import { getTemplateOverrides } from "@/modules/templates/use-cases/get-template-overrides"
import { setTemplateOverride } from "@/modules/templates/use-cases/set-template-override"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

// nợ #99: ghi đè template là một phần hồ sơ tổ chức, giống danh mục dịp (nợ
// #104) — dùng chung F1 (org.read)/F2 (org.update), không xin mã năng lực
// F-mới riêng, cùng lý do đã áp dụng cho `/occasions`.
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F1")

  const templateKey = new URL(request.url).searchParams.get("templateKey")
  if (!templateKey) throw validationFailed({ templateKey: "Thiếu templateKey" })

  return jsonResponse({ data: await getTemplateOverrides(ctx, templateKey), next_cursor: null })
})

const schema = z.object({
  templateFamily: z.enum(TEMPLATE_FAMILIES),
  templateKey: z.string().min(1),
  fieldKey: z.string().min(1),
  value: z.string().min(1),
})

export const PUT = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "F2")

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const override = await setTemplateOverride(ctx, parsed.data)
  return jsonResponse({ override })
})
