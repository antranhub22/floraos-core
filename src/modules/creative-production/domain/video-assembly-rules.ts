/**
 * Lắp video từ bộ tài sản (Đợt 4, 24/09/2026) — thuần, không gọi mạng.
 *
 * Quyết định PO: video được dựng từ ĐÚNG các tài sản đã sinh theo kịch bản sản
 * xuất tổng của Chặng 05 — ảnh biến thể Khu vực D (đúng kịch bản, đúng cảnh),
 * nguyên bản phối Khu vực C (không đọc lại TTS), phụ đề/chuyển cảnh/chuyển
 * động/khuôn/khung của kịch bản. Thiếu ảnh hoặc âm thanh thì CHẶN và chỉ rõ
 * phải quay về khu vực nào — không tạm dùng ảnh Master hay ảnh kịch bản cũ.
 */

import type { ScenePlan, ScenePlanMotion, ScenePlanTransition } from "./scene-plan-rules"
import type { PublishVideoFormat } from "./publishing-rules"

/** Ảnh biến thể ứng viên (đã lọc đúng tổ chức + đúng Master ở use-case). */
export interface AssemblyVariant {
  readonly assetId: string
  readonly sceneIndex: number
  readonly scenePlanId: string | null
  readonly scenePlanRevision: number | null
  readonly ratio: string | null
  readonly variantKey: string | null
  readonly approvalState: string | null
  /** Mới nhất trước. */
  readonly createdAt: Date
}

export interface AssemblyAudio {
  readonly jobId: string
  readonly status: string
  readonly storageKey: string | null
  readonly hasVoice: boolean
  readonly scenePlanId: string | null
  readonly scenePlanRevision: number | null
  /** Thời lượng THẬT từng cảnh sau khi C khớp giọng (có thể dài hơn kịch bản). */
  readonly sceneDurations: ReadonlyMap<number, number>
}

export type AssemblyProblem =
  | { kind: "missing_image"; sceneIndex: number; message: string }
  | { kind: "missing_audio"; message: string }
  | { kind: "audio_not_ready"; message: string }
  | { kind: "audio_other_plan"; message: string }
  | { kind: "no_voice"; message: string }
  | { kind: "duration"; message: string }

export interface AssembledScene {
  readonly sceneIndex: number
  readonly durationSeconds: number
  readonly imageAssetId: string
  readonly textOverlay: string
  readonly voiceScript: string
  readonly transitionEffect: ScenePlanTransition
  readonly motionEffect: "ZOOM_IN" | "ZOOM_OUT" | "PAN_UP" | "PAN_RIGHT" | "STATIC"
}

export interface AssemblyResult {
  readonly ready: boolean
  readonly problems: readonly AssemblyProblem[]
  readonly warnings: readonly string[]
  readonly scenes: readonly AssembledScene[]
  readonly format: PublishVideoFormat
  readonly aspectRatio: string
  readonly totalDurationSeconds: number
  readonly audioStorageKey: string | null
}

/** Giới hạn thời lượng khuôn (khớp `VIDEO_FORMAT_SPECS`). */
export const FORMAT_DURATION_LIMITS: Readonly<Record<PublishVideoFormat, { min: number; max: number }>> = {
  REEL_15S: { min: 8, max: 20 },
  TIKTOK_30S: { min: 15, max: 40 },
  STORY_15S: { min: 8, max: 18 },
  SLIDESHOW: { min: 6, max: 60 },
  PRODUCT_PAGE: { min: 10, max: 35 },
  AD_MOTION: { min: 8, max: 25 },
}

const MOTION: Readonly<Record<ScenePlanMotion, AssembledScene["motionEffect"]>> = {
  zoom_in: "ZOOM_IN",
  zoom_out: "ZOOM_OUT",
  pan_left: "PAN_RIGHT",
  pan_right: "PAN_RIGHT",
  pan_up: "PAN_UP",
  static: "STATIC",
}

/**
 * Khuôn của kịch bản nếu vừa thời lượng thật; không vừa thì khuôn dài hơn
 * gần nhất (tỉ lệ khung vẫn theo kịch bản — khuôn chỉ quy định giới hạn).
 */
export function pickFormatForDuration(preferred: PublishVideoFormat, total: number): PublishVideoFormat | null {
  const fits = (f: PublishVideoFormat) => total >= FORMAT_DURATION_LIMITS[f].min && total <= FORMAT_DURATION_LIMITS[f].max
  if (fits(preferred)) return preferred
  for (const f of ["TIKTOK_30S", "SLIDESHOW"] as const) if (fits(f)) return f
  return null
}

export function assembleVideo(input: {
  plan: ScenePlan
  planRef: string
  variants: readonly AssemblyVariant[]
  audio: AssemblyAudio | null
}): AssemblyResult {
  const { plan, planRef } = input
  const problems: AssemblyProblem[] = []
  const warnings: string[] = []

  // 1. Âm thanh Khu vực C — bắt buộc (video dùng nguyên bản phối).
  const a = input.audio
  if (!a) {
    problems.push({ kind: "missing_audio", message: "Chưa có bản âm thanh Khu vực C cho kịch bản này — phối ở Khu vực C (Audio Mix)." })
  } else if (a.status !== "COMPLETED" || !a.storageKey) {
    problems.push({ kind: "audio_not_ready", message: "Bản âm thanh Khu vực C chưa phối xong hoặc bị lỗi — mở Khu vực C." })
  } else {
    if (a.scenePlanId && a.scenePlanId !== planRef) {
      problems.push({ kind: "audio_other_plan", message: "Bản âm thanh thuộc kịch bản khác — phối lại ở Khu vực C theo kịch bản đang dùng." })
    }
    if (!a.hasVoice) {
      problems.push({ kind: "no_voice", message: "Bản âm thanh chỉ có nhạc (Music Select) — video cần giọng đọc: dùng Audio Mix hoặc Voiceover ở Khu vực C." })
    }
    if (a.scenePlanRevision != null && a.scenePlanRevision < plan.revision) {
      warnings.push(`Âm thanh phối theo kịch bản phiên bản ${a.scenePlanRevision}, kịch bản hiện là ${plan.revision} — nếu đã sửa lời thoại, hãy phối lại ở Khu vực C.`)
    }
  }

  // 2. Ảnh Khu vực D — mỗi cảnh một ảnh của ĐÚNG kịch bản.
  const scenes: AssembledScene[] = []
  for (const sc of plan.scenes) {
    const candidates = input.variants
      .filter(
        (v) =>
          v.sceneIndex === sc.sceneIndex &&
          v.scenePlanId === planRef &&
          (v.variantKey === "styled" || v.variantKey === "branded") &&
          v.approvalState !== "REJECTED"
      )
      .sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime())
    // Ưu tiên ảnh đúng khung + phiên bản mới nhất.
    const best =
      candidates.find((v) => v.ratio === plan.publishing.aspectRatio && (v.scenePlanRevision ?? 1) >= plan.revision) ??
      candidates.find((v) => v.ratio === plan.publishing.aspectRatio) ??
      candidates[0]
    if (!best) {
      problems.push({ kind: "missing_image", sceneIndex: sc.sceneIndex, message: `Cảnh ${sc.sceneIndex} (${sc.title}) chưa có ảnh ở Khu vực D.` })
      continue
    }
    if (best.ratio && best.ratio !== plan.publishing.aspectRatio) {
      warnings.push(`Ảnh cảnh ${sc.sceneIndex} khung ${best.ratio}, kịch bản cần ${plan.publishing.aspectRatio} — video sẽ có viền; nên sinh lại ở Khu vực D.`)
    }
    if (best.scenePlanRevision != null && best.scenePlanRevision < plan.revision) {
      warnings.push(`Ảnh cảnh ${sc.sceneIndex} sinh theo kịch bản phiên bản ${best.scenePlanRevision} (hiện ${plan.revision}).`)
    }
    const actual = a?.sceneDurations.get(sc.sceneIndex)
    scenes.push({
      sceneIndex: sc.sceneIndex,
      // Thời lượng THẬT của âm thanh C để hình khớp tiếng từng cảnh.
      durationSeconds: Math.round(Math.min(15, Math.max(0.5, actual ?? sc.durationSeconds)) * 10) / 10,
      imageAssetId: best.assetId,
      textOverlay: sc.textOverlay || sc.title,
      voiceScript: sc.voiceScript,
      transitionEffect: sc.transition,
      motionEffect: MOTION[sc.motionEffect] ?? "ZOOM_IN",
    })
  }

  const total = Math.round(scenes.reduce((s, x) => s + x.durationSeconds, 0) * 10) / 10
  let format: PublishVideoFormat = plan.video.format
  if (scenes.length === plan.scenes.length) {
    const picked = pickFormatForDuration(plan.video.format, total)
    if (!picked) problems.push({ kind: "duration", message: `Tổng ${total}s nằm ngoài mọi khuôn video (6–60s) — rút gọn lời thoại ở kịch bản.` })
    else {
      if (picked !== plan.video.format) warnings.push(`Âm thanh dài ${total}s nên dùng khuôn ${picked} thay cho ${plan.video.format}.`)
      format = picked
    }
  }

  return {
    ready: problems.length === 0,
    problems,
    warnings,
    scenes,
    format,
    aspectRatio: plan.publishing.aspectRatio,
    totalDurationSeconds: total,
    audioStorageKey: a?.storageKey ?? null,
  }
}
