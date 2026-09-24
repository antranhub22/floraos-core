import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { readIdempotencyKey } from "@/modules/jobs/domain/idempotency"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { MAX_INSTRUCTION_LENGTH } from "@/modules/creative-production/domain/revision-rules"
import { reviseScene } from "@/modules/creative-production/use-cases/revise-assets"
import type { ScenePlanScene } from "@/modules/creative-production/domain/scene-plan-rules"

const sceneSchema = z.object({
  sceneIndex: z.number().int().min(1).max(5),
  beat: z.enum(["SETUP", "RISING", "CLIMAX", "RESOLUTION", "CTA"]),
  title: z.string().max(80),
  setting: z.string().max(300),
  lighting: z.string().max(120),
  palette: z.array(z.string().max(30)).max(5),
  purpose: z.string().max(120),
  backgroundPrompt: z.string().max(600),
  localBackdrop: z.enum(["studio_white", "wedding", "living_room", "wood_minimal", "luxury_hotel"]),
  voiceScript: z.string().max(300),
  textOverlay: z.string().max(60),
  motionEffect: z.enum(["zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "static"]),
})

const postSchema = z.object({
  instruction: z.string().trim().min(3).max(MAX_INSTRUCTION_LENGTH),
  scene_plan_id: z.string().uuid().nullish(),
  scene_index: z.number().int().min(1).max(5),
  scene: sceneSchema.nullish(),
  mode: z.enum(["CREATIVE", "AUTHENTIC"]),
  topic_title: z.string().max(500).default(""),
  product_name: z.string().max(200).default(""),
  colors: z.array(z.string().max(60)).max(12).default([]),
})

/**
 * `POST /api/v1/creative-production/scene-revisions` (`I1`, 24/09/2026) — AI sửa
 * MỘT cảnh của kịch bản bối cảnh theo yêu cầu của chủ tiệm ở Chặng 07 (feature
 * `creative.scene_revise`, 1 credit, `Idempotency-Key` bắt buộc). Có
 * `scene_plan_id` thì đọc cảnh từ kho và ghi kịch bản đã sửa. Sinh lại ảnh là
 * một job biến thể riêng (`POST /media/variants`) — chạy qua cổng integrity.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const idempotencyKey = readIdempotencyKey(request)
  if (!idempotencyKey) throw validationFailed({ "Idempotency-Key": "Bắt buộc (YC-U7)" })
  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const d = parsed.data
  const r = await reviseScene(ctx, {
    idempotencyKey,
    instruction: d.instruction,
    scenePlanId: d.scene_plan_id ?? null,
    sceneIndex: d.scene_index,
    scene: (d.scene as ScenePlanScene | null | undefined) ?? null,
    mode: d.mode,
    topicTitle: d.topic_title,
    productName: d.product_name,
    colors: d.colors,
  })
  return jsonResponse({
    job_id: r.jobId,
    scene: r.scene,
    usage: { cost_credit: r.usage.costCredit, balance_after: r.usage.balanceAfter },
  })
})
