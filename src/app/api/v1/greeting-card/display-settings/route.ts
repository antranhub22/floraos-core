import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getDisplaySettings, updateDisplaySettings } from "@/modules/greeting-card/use-cases/display-settings"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

/** GET — trường thông tin hiển thị theo từng mẫu Thẻ chào (L1, như xem bộ sưu tập). */
export const GET = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.read)
  return jsonResponse({ data: await getDisplaySettings(ctx) })
})

const putSchema = z.object({
  templateId: z.string().min(1).max(64),
  fields: z.array(z.string().max(40)).max(20),
})

/** PUT — đổi trường hiển thị (R2, cùng quyền với sửa bộ sưu tập / chọn mẫu giao diện). Trả nợ #170. */
export const PUT = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.manage)
  const parsed = putSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  return jsonResponse({ data: await updateDisplaySettings(ctx, parsed.data) })
})
