import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import {
  getCampaignPackage,
  updateCampaignPackage,
} from "@/modules/creative-production/use-cases/manage-campaign-package"
import { packagePostsSchema } from "../schemas"

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  posts: packagePostsSchema.optional(),
  variant_asset_ids: z.array(z.string().min(1)).max(40).optional(),
  video_job_id: z.string().min(1).nullable().optional(),
  audio_job_id: z.string().min(1).nullable().optional(),
})

/** `GET /api/v1/creative-production/packages/:id` (`G1`). */
export const GET = handle(async (request, context: Ctx) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "G1")
  const { id } = await context.params
  return jsonResponse(await getCampaignPackage(ctx, id))
})

/**
 * `PATCH /api/v1/creative-production/packages/:id` (`I1`) — sửa gói chưa duyệt.
 * Sửa bất kỳ trường nào đưa gói về DRAFT: kết quả QA cũ không còn giá trị.
 */
export const PATCH = handle(async (request, context: Ctx) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const { id } = await context.params
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const d = parsed.data
  return jsonResponse(
    await updateCampaignPackage(ctx, id, {
      name: d.name,
      posts: d.posts,
      variantAssetIds: d.variant_asset_ids,
      videoJobId: d.video_job_id,
      audioJobId: d.audio_job_id,
    })
  )
})
