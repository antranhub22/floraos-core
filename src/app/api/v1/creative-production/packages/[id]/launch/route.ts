import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { saveLaunchPlan } from "@/modules/creative-production/use-cases/manage-campaign-package"
import { launchPlanSchema } from "../../schemas"

/**
 * `PUT /api/v1/creative-production/packages/:id/launch` (`J5`) — Chặng 10: lưu
 * kế hoạch đăng (kênh, giờ) và mã bài đã đăng bên Lịch đăng (SocialFlow M07)
 * để Chặng 12 đọc `content_metrics` thật. Việc đăng bài thực hiện ở Lịch đăng.
 */
export const PUT = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "J5")
  const { id } = await context.params
  const parsed = launchPlanSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  return jsonResponse(
    await saveLaunchPlan(ctx, id, {
      channels: parsed.data.channels,
      scheduledAt: parsed.data.scheduled_at ?? null,
      postRefs: parsed.data.post_refs.map((r) => ({ platform: r.platform, contentId: r.content_id })),
    })
  )
})
