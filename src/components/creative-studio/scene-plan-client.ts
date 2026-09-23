/**
 * Client kịch bản bối cảnh theo chủ đề (`/api/v1/creative-production/scene-plans`).
 * Dùng chung cho Khu vực C (lời thoại từng cảnh) và Khu vực D (bối cảnh ảnh).
 */

import {
  buildRuleScenePlan,
  scenePlanKey,
  type ScenePlan,
  type ScenePlanInput,
  type ScenePlanMode,
  type ScenePlanScene,
} from "@/modules/creative-production/domain/scene-plan-rules"
import type { ConcreteTopic } from "@/modules/market-intelligence/domain/product-intelligence-types"

export type { ScenePlan, ScenePlanScene }

/** Giá trị `scenePlanId` trên URL khi người dùng chọn kịch bản cơ bản (không AI). */
export const RULE_PLAN_REF = "rule"

export interface ScenePlanContext {
  mode: ScenePlanMode
  productName: string
  productId?: string | undefined
  assetId?: string | undefined
  selectedTopic: ConcreteTopic | null
  commercialPassport?: {
    category: string
    style: string
    components: string[]
    colors: string[]
    priceRange?: string | undefined
    targetAudience?: string | undefined
    suggestedOccasions?: string[] | undefined
  } | undefined
}

export type LoadedScenePlan = {
  plan: ScenePlan
  /** Job id của kịch bản AI, hoặc `rule:<topic>:<mode>` với kịch bản cơ bản. */
  ref: string
  jobId: string | null
}

/** Chủ đề giả khi đi thẳng từ /tai-anh không qua Chặng 04–05 — ghi rõ trên giao diện. */
function topicOf(ctx: ScenePlanContext) {
  const t = ctx.selectedTopic
  if (t) {
    return { id: t.id, title: t.title, angleCategory: t.angleCategory, hook: t.hook, cta: t.cta, format: t.format }
  }
  return { id: "no-topic", title: ctx.productName || "Sản phẩm hoa" }
}

export function scenePlanInputOf(ctx: ScenePlanContext): ScenePlanInput {
  const p = ctx.commercialPassport
  return {
    mode: ctx.mode,
    productName: ctx.productName || "Bó hoa",
    category: p?.category || undefined,
    style: p?.style || undefined,
    colors: p?.colors ?? [],
    components: p?.components ?? [],
    occasions: p?.suggestedOccasions ?? [],
    targetAudience: p?.targetAudience,
    priceRange: p?.priceRange,
    topic: topicOf(ctx),
  }
}

export function rulePlanRef(ctx: ScenePlanContext): string {
  return `rule:${topicOf(ctx).id}:${ctx.mode}`.slice(0, 160)
}

export function loadRulePlan(ctx: ScenePlanContext): LoadedScenePlan {
  return { plan: buildRuleScenePlan(scenePlanInputOf(ctx)), ref: rulePlanRef(ctx), jobId: null }
}

type PlanResponse = { job_id: string | null; status: string | null; error: string | null; plan: ScenePlan | null }

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
  return body.error?.message || `HTTP ${res.status}`
}

/**
 * Tra kịch bản đã có — theo `scenePlanId` trên URL nếu có, ngược lại theo
 * khoá (ảnh + chủ đề + mode). Không tạo job, không trừ credit.
 */
export async function findScenePlan(
  ctx: ScenePlanContext,
  urlPlanId: string | null
): Promise<{ loaded: LoadedScenePlan | null; failedJob: boolean }> {
  if (urlPlanId === RULE_PLAN_REF) return { loaded: loadRulePlan(ctx), failedJob: false }

  let body: PlanResponse | null = null
  if (urlPlanId) {
    const res = await fetch(`/api/v1/creative-production/scene-plans/${encodeURIComponent(urlPlanId)}`)
    if (res.ok) body = (await res.json()) as PlanResponse
  }
  if (!body?.plan && ctx.assetId) {
    const topic = topicOf(ctx)
    const q = new URLSearchParams({ asset_id: ctx.assetId, topic_id: topic.id, mode: ctx.mode })
    const res = await fetch(`/api/v1/creative-production/scene-plans?${q.toString()}`)
    if (!res.ok) throw new Error(await readError(res))
    body = (await res.json()) as PlanResponse
  }
  if (body?.plan && body.job_id) {
    return { loaded: { plan: body.plan, ref: body.job_id, jobId: body.job_id }, failedJob: false }
  }
  return { loaded: null, failedJob: body?.status === "FAILED" }
}

/**
 * AI viết kịch bản (1 credit). Lần đầu dùng khoá cố định của ảnh + chủ đề để
 * mở lại không trừ tiền; "Viết lại" hoặc sau một lượt hỏng thì khoá mới.
 */
export async function writeScenePlan(ctx: ScenePlanContext, fresh: boolean): Promise<LoadedScenePlan> {
  const input = scenePlanInputOf(ctx)
  const base = ctx.assetId
    ? scenePlanKey({ assetId: ctx.assetId, topicId: input.topic.id, mode: ctx.mode })
    : `scene-plan:no-asset:${input.topic.id}:${ctx.mode}`
  const key = fresh ? `${base}:${crypto.randomUUID()}` : base

  const res = await fetch("/api/v1/creative-production/scene-plans", {
    method: "POST",
    headers: { "Content-Type": "application/json", "idempotency-key": key },
    body: JSON.stringify({
      mode: ctx.mode,
      ...(ctx.assetId ? { asset_id: ctx.assetId } : {}),
      ...(ctx.productId ? { product_id: ctx.productId } : {}),
      product: {
        name: input.productName,
        ...(input.category ? { category: input.category } : {}),
        ...(input.style ? { style: input.style } : {}),
        colors: input.colors.slice(0, 12),
        components: input.components.slice(0, 12),
        occasions: input.occasions.slice(0, 12),
        ...(input.targetAudience ? { target_audience: input.targetAudience } : {}),
        ...(input.priceRange ? { price_range: input.priceRange } : {}),
      },
      topic: {
        id: input.topic.id,
        title: input.topic.title,
        ...(input.topic.angleCategory ? { angle_category: input.topic.angleCategory } : {}),
        ...(input.topic.hook ? { hook: input.topic.hook } : {}),
        ...(input.topic.cta ? { cta: input.topic.cta } : {}),
        ...(input.topic.format ? { format: input.topic.format } : {}),
      },
    }),
  })
  if (!res.ok) throw new Error(await readError(res))
  const body = (await res.json()) as PlanResponse
  if (body.status === "FAILED") throw new Error(body.error || "Lượt viết kịch bản trước đã hỏng — bấm viết lại.")
  if (!body.plan || !body.job_id) throw new Error("Kịch bản đang được viết ở một phiên khác — thử lại sau vài giây.")
  return { plan: body.plan, ref: body.job_id, jobId: body.job_id }
}
