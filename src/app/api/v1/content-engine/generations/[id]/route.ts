import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

import { getContentGenerationById } from "@/modules/content-engine/use-cases/get-content-generation"

/** `GET /api/v1/content-engine/generations/:id` (`I1`). */
export const GET = handle(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const { id } = await params
  const g = await getContentGenerationById(ctx, id)
  return jsonResponse({
    id: g.id,
    job_id: g.job_id,
    origin: g.origin,
    status: g.status,
    asset_id: g.asset_id,
    product_id: g.product_id,
    topic_id: g.topic_id,
    scene_plan_id: g.scene_plan_id,
    mode: g.mode,
    channels: g.channels,
    brief: g.brief,
    strategy: g.strategy,
    posts: g.posts,
    approved_posts: g.approved_posts,
    overall_score: g.overall_score,
    rubric_version: g.rubric_version,
    prompt_versions: g.prompt_versions,
    brief_version: g.brief_version,
    created_at: g.created_at,
  })
})
