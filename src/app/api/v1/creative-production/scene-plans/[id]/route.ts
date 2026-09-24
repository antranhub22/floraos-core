import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { getScenePlan, updateScenePlan } from "@/modules/creative-production/use-cases/generate-scene-plan"
import { PUBLISH_PLATFORMS } from "@/modules/creative-production/domain/publishing-rules"
import { VOICE_CATALOG } from "@/modules/audio-studio/domain/voice-catalog"

/** `GET /api/v1/creative-production/scene-plans/:id` (`I1`). */
export const GET = handle(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const { id } = await params
  const found = await getScenePlan(ctx, id)
  return jsonResponse({ job_id: found.jobId, status: found.status, error: found.error, plan: found.plan })
})

const sceneEdit = z.object({
  scene_index: z.number().int().min(1).max(5),
  duration_seconds: z.number().min(0.5).max(15).optional(),
  voice_script: z.string().max(300).optional(),
  text_overlay: z.string().max(60).optional(),
  transition: z.enum(["fade", "slide_left", "slide_right", "zoom_in", "zoom_out", "dissolve"]).optional(),
  motion_effect: z.enum(["zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "static"]).optional(),
})

const patchSchema = z.object({
  platforms: z.array(z.enum(PUBLISH_PLATFORMS)).min(1).max(8).optional(),
  scenes: z.array(sceneEdit).max(5).optional(),
  audio: z
    .object({
      voice_id: z.string().max(80).optional(),
      music_mood: z.enum(["romantic", "upbeat", "chill", "warm", "luxury", "none"]).optional(),
      pacing: z.enum(["slow", "medium", "fast"]).optional(),
      quality_tier: z.enum(["standard", "hd", "premium"]).optional(),
    })
    .optional(),
  video: z
    .object({
      caption_style: z.enum(["MODERN_BADGE", "MINIMAL_ELEGANT", "HIGHLIGHT_BOX", "BOTTOM_BANNER", "NONE"]).optional(),
      has_subtitle: z.boolean().optional(),
      has_watermark: z.boolean().optional(),
      end_card_text: z.string().max(60).optional(),
      cover_scene_index: z.number().int().min(1).max(5).optional(),
    })
    .optional(),
  posts: z
    .array(z.object({ channel: z.enum(["facebook", "instagram", "tiktok", "zalo"]), text: z.string().max(70000), hashtags: z.array(z.string().max(100)).max(60).optional() }))
    .max(4)
    .optional(),
})

/**
 * `PATCH /api/v1/creative-production/scene-plans/:id` (`I1`, v2 24/09/2026) —
 * sửa kịch bản sản xuất tổng tại chỗ, miễn phí, tăng `revision`.
 */
export const PATCH = handle(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const { id } = await params
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const d = parsed.data
  if (d.audio?.voice_id && !VOICE_CATALOG.some((v) => v.voiceId === d.audio?.voice_id)) {
    throw validationFailed({ voice_id: "Giọng không có trong danh mục" })
  }
  const found = await updateScenePlan(ctx, id, {
    platforms: d.platforms,
    scenes: d.scenes?.map((s) => ({
      sceneIndex: s.scene_index,
      durationSeconds: s.duration_seconds,
      voiceScript: s.voice_script,
      textOverlay: s.text_overlay,
      transition: s.transition,
      motionEffect: s.motion_effect,
    })),
    audio: d.audio
      ? {
          ...(d.audio.voice_id ? { voiceId: d.audio.voice_id } : {}),
          ...(d.audio.music_mood ? { musicMood: d.audio.music_mood } : {}),
          ...(d.audio.pacing ? { pacing: d.audio.pacing } : {}),
          ...(d.audio.quality_tier ? { qualityTier: d.audio.quality_tier } : {}),
        }
      : undefined,
    video: d.video
      ? {
          ...(d.video.caption_style ? { captionStyle: d.video.caption_style } : {}),
          ...(d.video.has_subtitle !== undefined ? { hasSubtitle: d.video.has_subtitle } : {}),
          ...(d.video.has_watermark !== undefined ? { hasWatermark: d.video.has_watermark } : {}),
          ...(d.video.end_card_text !== undefined ? { endCardText: d.video.end_card_text } : {}),
          ...(d.video.cover_scene_index ? { coverSceneIndex: d.video.cover_scene_index } : {}),
        }
      : undefined,
    posts: d.posts,
  })
  return jsonResponse({ job_id: found.jobId, status: found.status, error: found.error, plan: found.plan })
})
