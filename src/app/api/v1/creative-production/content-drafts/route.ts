import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getContentDraft, saveContentDraft } from "@/modules/creative-production/use-cases/content-draft"

import { packagePostsSchema } from "../packages/schemas"

const keySchema = z.object({
  asset_id: z.string().uuid(),
  topic_id: z.string().trim().min(1).max(200),
  mode: z.enum(["CREATIVE", "AUTHENTIC"]),
})

/**
 * `GET /api/v1/creative-production/content-drafts?asset_id&topic_id&mode` (`I1`)
 * — bài Khu vực B đã tự lưu cho đúng ảnh + chủ đề + mode; chưa có thì `{ draft: null }`.
 */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const url = new URL(request.url)
  const parsed = keySchema.safeParse({
    asset_id: url.searchParams.get("asset_id"),
    topic_id: url.searchParams.get("topic_id"),
    mode: url.searchParams.get("mode"),
  })
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const d = parsed.data
  return jsonResponse({ draft: await getContentDraft(ctx, { assetId: d.asset_id, topicId: d.topic_id, mode: d.mode }) })
})

const putSchema = keySchema.extend({
  topic_title: z.string().max(500).nullish(),
  posts: packagePostsSchema,
})

/** `PUT /api/v1/creative-production/content-drafts` (`I1`) — tự lưu bài Khu vực B (ghi đè bản cũ cùng khoá). */
export const PUT = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const parsed = putSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const d = parsed.data
  const draft = await saveContentDraft(
    ctx,
    { assetId: d.asset_id, topicId: d.topic_id, mode: d.mode },
    { posts: d.posts, topicTitle: d.topic_title ?? null }
  )
  return jsonResponse({ draft })
})
