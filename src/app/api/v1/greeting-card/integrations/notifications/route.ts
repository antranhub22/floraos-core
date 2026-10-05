import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { updateNotifySettings } from "@/modules/greeting-card/use-cases/notify-settings"
import { NOTIFY_EVENTS } from "@/modules/greeting-card/domain/customer-notifications"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

const secret = z.string().trim().min(4).max(2000)
const schema = z.object({
  enabled: z.boolean(),
  channel: z.enum(["ZNS", "ESMS"]),
  credentials: z
    .union([
      z.object({ appId: z.string().trim().min(3).max(64), secretKey: secret, accessToken: secret, refreshToken: secret }),
      z.object({ apiKey: secret, secretKey: secret, brandname: z.string().trim().min(2).max(20) }),
    ])
    .optional(),
  templates: z.partialRecord(z.enum(NOTIFY_EVENTS), z.string().trim().max(32)).optional(),
})

/** PUT /api/v1/greeting-card/integrations/notifications — bật/tắt, kênh, thông tin kết nối (chỉ ghi), mẫu tin. */
export const PUT = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.integrationManage)
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  return jsonResponse({ data: await updateNotifySettings(ctx, parsed.data) })
})
