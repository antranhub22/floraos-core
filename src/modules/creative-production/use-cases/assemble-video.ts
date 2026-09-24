/**
 * Đợt 4 (24/09/2026) — dựng video từ bộ tài sản của kịch bản sản xuất tổng.
 *
 * Đọc kịch bản (Chặng 05) + ảnh Khu vực D của đúng kịch bản trên Master + bản
 * phối Khu vực C của đúng kịch bản → `assembleVideo` (thuần) → tạo video job
 * `DRAFT` gắn `scene_plan_id`, `audio_job_id`, `audio_storage_key`. Worker
 * render dùng NGUYÊN bản phối C, không đọc lại TTS. `dryRun` chỉ trả báo cáo
 * sẵn sàng (thiếu gì, ở khu vực nào) — không tạo gì.
 */

import { AppError, notFound } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { prisma } from "@/core/tenancy/infra/prisma"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { VideoJobRepository } from "@/modules/video-studio/infra/video-job-repository"
import type { CaptionStyle, VideoFormat } from "@/modules/video-studio/domain/video-types"

import { SCENE_PLAN_FEATURE, parseStoredScenePlan, type ScenePlan } from "../domain/scene-plan-rules"
import { assembleVideo, type AssemblyAudio, type AssemblyResult, type AssemblyVariant } from "../domain/video-assembly-rules"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface AssembleVideoInput {
  readonly scenePlanId: string
  /** Kịch bản cơ bản (`rule:…`) không lưu phía máy chủ — client gửi kèm. */
  readonly plan?: unknown
  readonly masterAssetId: string
  readonly audioJobId?: string | null | undefined
  readonly title?: string | undefined
  readonly dryRun?: boolean | undefined
}

export interface AssembleVideoOutput {
  readonly assembly: AssemblyResult
  readonly audioJobId: string | null
  readonly videoJobId: string | null
  readonly plan: { readonly revision: number; readonly aspectRatio: string; readonly sceneCount: number }
}

async function loadPlan(ctx: TenantContext, scenePlanId: string, provided: unknown): Promise<ScenePlan> {
  if (UUID_RE.test(scenePlanId)) {
    const job = await new GenerationJobRepository().findById(ctx, scenePlanId)
    if (!job || job.feature !== SCENE_PLAN_FEATURE) throw notFound()
    const plan = job.status === "COMPLETED" ? parseStoredScenePlan(job.output) : null
    if (!plan) throw new AppError("CONFLICT", "Kịch bản chưa sẵn sàng")
    return plan
  }
  if (scenePlanId.startsWith("rule:")) {
    const plan = parseStoredScenePlan(provided)
    if (!plan) throw new AppError("VALIDATION_FAILED", "Thiếu nội dung kịch bản cơ bản")
    return plan
  }
  throw notFound()
}

function toAudio(job: { id: string; status: string; payload: unknown; output: unknown }): AssemblyAudio {
  const payload = (job.payload ?? {}) as Record<string, unknown>
  const output = (job.output ?? {}) as Record<string, unknown>
  const durations = new Map<number, number>()
  for (const s of Array.isArray(output.scenes) ? (output.scenes as Record<string, unknown>[]) : []) {
    const idx = Number(s.sceneIndex)
    const d = Number(s.actualDurationSeconds)
    if (Number.isFinite(idx) && Number.isFinite(d) && d > 0) durations.set(idx, d)
  }
  return {
    jobId: job.id,
    status: job.status,
    storageKey: typeof output.audio_storage_key === "string" ? output.audio_storage_key : null,
    hasVoice: output.has_voice === true,
    scenePlanId: typeof payload.scenePlanId === "string" ? payload.scenePlanId : null,
    scenePlanRevision: typeof payload.scenePlanRevision === "number" ? payload.scenePlanRevision : null,
    sceneDurations: durations,
  }
}

export async function assembleVideoFromPlan(ctx: TenantContext, input: AssembleVideoInput): Promise<AssembleVideoOutput> {
  requireCapability(ctx, "I1")
  const plan = await loadPlan(ctx, input.scenePlanId, input.plan)

  const assets = new AssetRepository()
  const master = await assets.findById(ctx, input.masterAssetId)
  if (!master || master.kind !== "MASTER") throw new AppError("VALIDATION_FAILED", "Cần Master Image đã duyệt của sản phẩm")
  const rows = await assets.list(ctx, { parentAssetId: master.id, kind: "MARKETING", limit: 300 })
  const variants: AssemblyVariant[] = rows.map((r) => {
    const m = (r.metadata ?? {}) as Record<string, unknown>
    return {
      assetId: r.id,
      sceneIndex: typeof m.scene_index === "number" ? m.scene_index : -1,
      scenePlanId: typeof m.scene_plan_id === "string" ? m.scene_plan_id : null,
      scenePlanRevision: typeof m.scene_plan_revision === "number" ? m.scene_plan_revision : null,
      ratio: typeof m.ratio === "string" ? m.ratio : r.aspect_ratio ?? null,
      variantKey: typeof m.variant_key === "string" ? m.variant_key : null,
      approvalState: r.approval_state ?? null,
      createdAt: r.created_at,
    }
  })

  // Âm thanh: job chỉ định, hoặc bản phối xong mới nhất của ĐÚNG kịch bản.
  let audioJob: { id: string; status: string; payload: unknown; output: unknown } | null = null
  if (input.audioJobId) {
    const j = await new GenerationJobRepository().findById(ctx, input.audioJobId)
    if (j && j.feature === "audio.generate") audioJob = j
  } else {
    audioJob = await prisma.generation_jobs.findFirst({
      where: scopedWhere(ctx, {
        feature: "audio.generate",
        status: "COMPLETED" as const,
        payload: { path: ["scenePlanId"], equals: input.scenePlanId },
      }),
      orderBy: { created_at: "desc" },
    })
  }
  const audio = audioJob ? toAudio(audioJob) : null

  const assembly = assembleVideo({ plan, planRef: input.scenePlanId, variants, audio })
  const out = {
    assembly,
    audioJobId: audio?.jobId ?? null,
    plan: { revision: plan.revision, aspectRatio: plan.publishing.aspectRatio, sceneCount: plan.scenes.length },
  }
  if (input.dryRun || !assembly.ready) return { ...out, videoJobId: null }

  const repo = new VideoJobRepository()
  const job = await repo.create(ctx, {
    productId: master.product_id,
    title: (input.title?.trim() || `${plan.topicTitle} — video`).slice(0, 200),
    format: assembly.format as VideoFormat,
    durationSeconds: Math.max(1, Math.round(assembly.totalDurationSeconds)),
    aspectRatio: assembly.aspectRatio,
    musicTrack: null,
    voiceCode: null,
    hasSubtitle: plan.video.hasSubtitle,
    captionStyle: plan.video.captionStyle as CaptionStyle,
    hasWatermark: plan.video.hasWatermark,
    costCredits: 0,
    scenes: assembly.scenes.map((s) => ({
      sceneIndex: s.sceneIndex,
      durationSeconds: s.durationSeconds,
      imageAssetId: s.imageAssetId,
      textOverlay: s.textOverlay,
      voiceScript: s.voiceScript,
      transitionEffect: s.transitionEffect,
      motionEffect: s.motionEffect,
    })),
  })
  await repo.attachPlanAudio(ctx, job.id, {
    scenePlanId: input.scenePlanId,
    scenePlanRevision: plan.revision,
    audioJobId: audio?.jobId ?? null,
    audioStorageKey: assembly.audioStorageKey,
  })
  return { ...out, videoJobId: job.id }
}
