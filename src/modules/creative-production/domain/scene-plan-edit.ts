/**
 * Sửa kịch bản sản xuất tổng (v2, 24/09/2026) — thuần, không gọi mạng.
 *
 * Dùng cho `PATCH /creative-production/scene-plans/:id` (người dùng sửa ở
 * Chặng 05/07) và khi "Sửa cảnh" bằng AI ghi đè một cảnh. Mọi lần sửa tăng
 * `revision` — tài sản (ảnh D, âm thanh C, video E) mang số này để biết mình
 * còn khớp kịch bản hay đã lỗi thời.
 */

import { resolvePublishing, type PublishPostChannel } from "./publishing-rules"
import {
  MAX_SCENE_SECONDS,
  MIN_SCENE_SECONDS,
  TRANSITIONS,
  balanceSceneDurations,
  normalizeScenePlanPost,
  type ScenePlan,
  type ScenePlanAudio,
  type ScenePlanMotion,
  type ScenePlanPost,
  type ScenePlanScene,
  type ScenePlanTransition,
  type ScenePlanVideo,
} from "./scene-plan-rules"

const MOTIONS: readonly ScenePlanMotion[] = ["zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "static"]

export interface ScenePlanSceneEdit {
  readonly sceneIndex: number
  readonly durationSeconds?: number | undefined
  readonly voiceScript?: string | undefined
  readonly textOverlay?: string | undefined
  readonly transition?: string | undefined
  readonly motionEffect?: string | undefined
}

export interface ScenePlanEdit {
  readonly platforms?: readonly unknown[] | undefined
  readonly scenes?: readonly ScenePlanSceneEdit[] | undefined
  /** Thay nguyên MỘT cảnh (kết quả "Sửa cảnh" bằng AI). */
  readonly replaceScene?: ScenePlanScene | undefined
  readonly audio?: Partial<ScenePlanAudio> | undefined
  readonly video?: Partial<Pick<ScenePlanVideo, "captionStyle" | "hasSubtitle" | "hasWatermark" | "endCardText" | "coverSceneIndex">> | undefined
  readonly posts?: readonly { channel: string; text: string; hashtags?: readonly string[] | undefined }[] | undefined
}

export type ScenePlanEditResult = { ok: true; plan: ScenePlan } | { ok: false; reason: string }

const clean = (v: string, max: number) => v.replace(/\s+/g, " ").trim().slice(0, max)
const round1 = (n: number) => Math.round(n * 10) / 10

export function applyScenePlanEdit(plan: ScenePlan, edit: ScenePlanEdit): ScenePlanEditResult {
  const byIndex = new Map(plan.scenes.map((s) => [s.sceneIndex, s]))
  for (const e of edit.scenes ?? []) {
    if (!byIndex.has(e.sceneIndex)) return { ok: false, reason: `Kịch bản không có cảnh ${e.sceneIndex}` }
  }
  if (edit.replaceScene && !byIndex.has(edit.replaceScene.sceneIndex)) {
    return { ok: false, reason: `Kịch bản không có cảnh ${edit.replaceScene.sceneIndex}` }
  }

  // Nền tảng → tỉ lệ + khuôn + thời lượng mục tiêu.
  const platformsChanged = edit.platforms !== undefined
  const pub = resolvePublishing(platformsChanged ? edit.platforms : plan.publishing.platforms)

  let voiceChanged = false
  const userDuration = new Map<number, number>()
  let scenes: ScenePlanScene[] = plan.scenes.map((s) => {
    let next: ScenePlanScene = s
    if (edit.replaceScene && edit.replaceScene.sceneIndex === s.sceneIndex) {
      next = { ...edit.replaceScene, sceneIndex: s.sceneIndex, beat: s.beat }
      if (next.voiceScript !== s.voiceScript) voiceChanged = true
    }
    const e = edit.scenes?.find((x) => x.sceneIndex === s.sceneIndex)
    if (e) {
      if (e.voiceScript !== undefined) {
        const v = clean(e.voiceScript, 300)
        if (v !== next.voiceScript) voiceChanged = true
        next = { ...next, voiceScript: v }
      }
      if (e.textOverlay !== undefined) next = { ...next, textOverlay: clean(e.textOverlay, 60) }
      if (e.transition !== undefined && TRANSITIONS.includes(e.transition as ScenePlanTransition)) {
        next = { ...next, transition: e.transition as ScenePlanTransition }
      }
      if (e.motionEffect !== undefined && MOTIONS.includes(e.motionEffect as ScenePlanMotion)) {
        next = { ...next, motionEffect: e.motionEffect as ScenePlanMotion }
      }
      if (typeof e.durationSeconds === "number" && Number.isFinite(e.durationSeconds)) {
        userDuration.set(s.sceneIndex, round1(Math.min(MAX_SCENE_SECONDS, Math.max(MIN_SCENE_SECONDS, e.durationSeconds))))
      }
    }
    return next
  })

  // Thời lượng: người dùng nhập thì giữ đúng số đó; đổi lời thoại / nền tảng
  // thì cân lại các cảnh còn lại theo mục tiêu mới.
  if (userDuration.size > 0 || voiceChanged || platformsChanged) {
    const balanced = balanceSceneDurations(
      scenes.map((s) => ({ beat: s.beat, voiceScript: s.voiceScript, durationSeconds: s.durationSeconds })),
      pub.targetSeconds
    )
    scenes = scenes.map((s, i) => ({ ...s, durationSeconds: userDuration.get(s.sceneIndex) ?? balanced[i]! }))
  }

  // Bài đăng: sửa tay phải sạch (từ cấm cứng → từ chối cả lượt sửa).
  let posts: readonly ScenePlanPost[] = plan.content.posts
  if (edit.posts) {
    const next: ScenePlanPost[] = [...plan.content.posts]
    for (const p of edit.posts) {
      if (!pub.postChannels.includes(p.channel as PublishPostChannel)) continue
      const n = normalizeScenePlanPost(p, p.channel as PublishPostChannel)
      if (!n) return { ok: false, reason: `Bài ${p.channel} quá ngắn hoặc dùng cụm từ bị cấm` }
      const i = next.findIndex((x) => x.channel === n.channel)
      if (i >= 0) next[i] = n
      else next.push(n)
    }
    posts = next
  }
  if (platformsChanged) posts = posts.filter((p) => pub.postChannels.includes(p.channel))

  const total = round1(scenes.reduce((a, s) => a + s.durationSeconds, 0))
  return {
    ok: true,
    plan: {
      ...plan,
      scenes,
      revision: plan.revision + 1,
      publishing: platformsChanged
        ? { platforms: pub.platforms, aspectRatio: pub.aspectRatio, otherRatios: pub.otherRatios }
        : plan.publishing,
      video: {
        ...plan.video,
        ...(edit.video ?? {}),
        format: platformsChanged ? pub.videoFormat : plan.video.format,
        totalDurationSeconds: total,
        coverSceneIndex: Math.min(scenes.length, Math.max(1, edit.video?.coverSceneIndex ?? plan.video.coverSceneIndex)),
        endCardText: clean(edit.video?.endCardText ?? plan.video.endCardText, 60),
      },
      audio: { ...plan.audio, ...(edit.audio ?? {}) },
      content: { ...plan.content, posts },
    },
  }
}
