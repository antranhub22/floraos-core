import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import {
  createCampaignPackage,
  listCampaignPackages,
} from "@/modules/creative-production/use-cases/manage-campaign-package"
import { packagePostsSchema, topicSnapshotSchema } from "./schemas"

const postSchema = z.object({
  name: z.string().trim().min(1).max(200),
  mode: z.enum(["CREATIVE", "AUTHENTIC"]),
  master_asset_id: z.string().min(1),
  topic: topicSnapshotSchema.optional(),
  posts: packagePostsSchema.optional(),
  variant_asset_ids: z.array(z.string().min(1)).max(40).optional(),
  video_job_id: z.string().min(1).nullish(),
  audio_job_id: z.string().min(1).nullish(),
})

/**
 * `POST /api/v1/creative-production/packages` (`I1`) — Chặng 07: tạo gói chiến
 * dịch (DRAFT) neo vào Master Image đã duyệt. `organization_id` chỉ từ phiên.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const d = parsed.data
  const result = await createCampaignPackage(ctx, {
    name: d.name,
    mode: d.mode,
    masterAssetId: d.master_asset_id,
    topic: d.topic,
    posts: d.posts,
    variantAssetIds: d.variant_asset_ids,
    videoJobId: d.video_job_id ?? null,
    audioJobId: d.audio_job_id ?? null,
  })
  return jsonResponse(result, { status: 201 })
})

/** `GET /api/v1/creative-production/packages?master_asset_id=` (`G1`). */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "G1")
  const url = new URL(request.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam === null ? undefined : Number(limitParam)
  if (limit !== undefined && !Number.isInteger(limit)) throw validationFailed({ limit: "Phải là số nguyên" })
  return jsonResponse(
    await listCampaignPackages(ctx, {
      masterAssetId: url.searchParams.get("master_asset_id") ?? undefined,
      limit,
    })
  )
})
