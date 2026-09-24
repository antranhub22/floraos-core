import { AppError } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { callCapability } from "@/core/ai/gateway"
import { aiGatewayDeps } from "@/core/ai/wiring"
import { OpenAILLMProvider } from "@/core/ai/adapters/openai-llm-provider"
import type { TenantContext } from "@/core/tenancy"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { enqueueJob } from "@/modules/jobs/use-cases/enqueue-job"
import { refundJob } from "@/modules/usage/use-cases/refund-job"

import { createScenePlanAdapter } from "../adapters/scene-plan-ai-adapter"
import { applyScenePlanEdit, type ScenePlanEdit } from "../domain/scene-plan-edit"
import {
  parseStoredScenePlan,
  SCENE_PLAN_FEATURE,
  type ScenePlan,
  type ScenePlanInput,
} from "../domain/scene-plan-rules"

export type ScenePlanJobView = {
  jobId: string
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED"
  error: string | null
  plan: ScenePlan | null
}

export type ScenePlanResult = ScenePlanJobView & {
  deduped: boolean
  usage: { costCredit: number; balanceAfter: number | null }
}

function view(job: {
  id: string
  status: string
  error: string | null
  output: unknown
}): ScenePlanJobView {
  return {
    jobId: job.id,
    status: job.status as ScenePlanJobView["status"],
    error: job.error,
    plan: job.status === "COMPLETED" ? parseStoredScenePlan(job.output) : null,
  }
}

/**
 * AI viết kịch bản bối cảnh cho MỘT chủ đề (quyết định PO 24/09/2026).
 *
 * Cùng khuôn với `generateProductCopy`: `enqueueJob` (hạn mức, usage, khoá
 * idempotency trong một giao dịch) → chạy tại chỗ qua cổng AI (lượt viết mất
 * vài giây, người dùng đang chờ trên màn hình) → ghi kịch bản vào
 * `generation_jobs.output`. Hỏng thì `FAILED` và hoàn credit (D3-b).
 *
 * Trùng khoá: trả lại đúng job cũ, không gọi mô hình, không trừ credit.
 */
export async function generateScenePlan(
  ctx: TenantContext,
  input: { brief: ScenePlanInput; idempotencyKey: string; productId?: string | null; assetId?: string | null }
): Promise<ScenePlanResult> {
  requireCapability(ctx, "I1")

  const enq = await enqueueJob(ctx, {
    feature: SCENE_PLAN_FEATURE,
    payload: {
      topic_id: input.brief.topic.id,
      topic_title: input.brief.topic.title,
      mode: input.brief.mode,
      asset_id: input.assetId ?? null,
      platforms: input.brief.platforms ?? null,
    },
    productId: input.productId ?? null,
    idempotencyKey: input.idempotencyKey,
  })

  if (enq.deduped) {
    return { ...view(enq.job), deduped: true, usage: enq.usage }
  }

  const jobRepo = new GenerationJobRepository()
  await jobRepo.startInline(ctx, enq.job.id, new Date())

  try {
    const aiResult = await callCapability(
      {
        capability: "video_storyboard",
        privacy: "SHOP",
        entity: { type: "scene_plan", id: enq.job.id },
        jobId: enq.job.id,
      },
      createScenePlanAdapter(new OpenAILLMProvider(), input.brief, ctx.organizationId),
      aiGatewayDeps(ctx)
    )
    if (aiResult.kind !== "xong") {
      throw new AppError("INTERNAL", `Cổng AI không chạy được: ${aiResult.reason}`)
    }
    const plan = aiResult.output as ScenePlan
    await jobRepo.finishInline(ctx, enq.job.id, { ok: true, now: new Date(), output: plan })
    return {
      jobId: enq.job.id,
      status: "COMPLETED",
      error: null,
      plan,
      deduped: false,
      usage: enq.usage,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định"
    await jobRepo.finishInline(ctx, enq.job.id, { ok: false, error: message, now: new Date() })
    await refundJob(ctx, enq.job.id).catch(() => undefined)
    throw new AppError("INTERNAL", `AI chưa viết được kịch bản bối cảnh (đã hoàn credit): ${message}`)
  }
}

/** `GET /scene-plans/:id` — chỉ job `creative.scene_plan` của đúng tổ chức. */
export async function getScenePlan(ctx: TenantContext, jobId: string): Promise<ScenePlanJobView> {
  requireCapability(ctx, "I1")
  const job = await new GenerationJobRepository().findById(ctx, jobId)
  if (!job || job.feature !== SCENE_PLAN_FEATURE) throw new AppError("NOT_FOUND", "Không có kịch bản này")
  return view(job)
}

/**
 * Tra kịch bản theo khoá idempotency mà KHÔNG tạo job — Khu vực C/D mở ra thì
 * dùng lại kịch bản đã có; chưa có thì người dùng tự bấm viết (không tự trừ credit).
 */
export async function findScenePlanByKey(
  ctx: TenantContext,
  idempotencyKey: string
): Promise<ScenePlanJobView | null> {
  requireCapability(ctx, "I1")
  const job = await new GenerationJobRepository().findByIdempotencyKey(ctx, SCENE_PLAN_FEATURE, idempotencyKey)
  return job ? view(job) : null
}

/**
 * `PATCH /scene-plans/:id` (v2, 24/09/2026) — sửa kịch bản sản xuất tổng tại
 * chỗ (nền tảng đăng, thời lượng / lời thoại / phụ đề / chuyển cảnh từng cảnh,
 * âm thanh, video, bài đăng). Miễn phí; tăng `revision`.
 */
export async function updateScenePlan(ctx: TenantContext, jobId: string, edit: ScenePlanEdit): Promise<ScenePlanJobView> {
  requireCapability(ctx, "I1")
  const jobs = new GenerationJobRepository()
  const job = await jobs.findById(ctx, jobId)
  if (!job || job.feature !== SCENE_PLAN_FEATURE) throw new AppError("NOT_FOUND", "Không có kịch bản này")
  const plan = job.status === "COMPLETED" ? parseStoredScenePlan(job.output) : null
  if (!plan) throw new AppError("CONFLICT", "Kịch bản chưa sẵn sàng để sửa")
  const r = applyScenePlanEdit(plan, edit)
  if (!r.ok) throw new AppError("VALIDATION_FAILED", r.reason)
  const saved = await jobs.replaceOutput(ctx, jobId, SCENE_PLAN_FEATURE, r.plan)
  if (!saved) throw new AppError("CONFLICT", "Không ghi được kịch bản")
  return { jobId, status: "COMPLETED", error: null, plan: r.plan }
}
