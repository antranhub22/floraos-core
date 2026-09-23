/**
 * Use-case: Hiệu quả gói chiến dịch — Chặng 11 SELL · 12 MEASURE · 13 LEARN · 14 NEXT BEST ACTION.
 *
 * 23/09/2026 — thay cho số gõ cứng ("34 đơn", "20.366.000đ", "Độ tin cậy 96%").
 * Mọi con số ở đây đọc từ CSDL của chính tổ chức: `orders`/`order_items` theo
 * sản phẩm của gói kể từ ngày duyệt, `chat_conversations`, `content_metrics`
 * theo mã bài đã gắn ở Chặng 10. Chưa đủ dữ liệu thì NÓI là chưa đủ.
 */

import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"

import {
  extractWinningPatterns,
  nextBestActions,
  summarizePerformance,
  type CampaignPackageStatus,
  type PackageOutcome,
} from "../domain/campaign-package-rules"
import { CampaignPackageRepository } from "../infra/campaign-package-repository"
import { launchPlanOf } from "./manage-campaign-package"

const MAX_PACKAGES_FOR_LEARN = 50

function sceneTwoPreset(topic: unknown): string | null {
  const t = topic as { scene2Preset?: unknown } | null
  return typeof t?.scene2Preset === "string" ? t.scene2Preset : null
}

function angleOf(topic: unknown): string | null {
  const t = topic as { angleCategory?: unknown } | null
  return typeof t?.angleCategory === "string" ? t.angleCategory : null
}

export async function getCampaignPerformance(ctx: TenantContext, id: string, now: Date = new Date()) {
  const repo = new CampaignPackageRepository()
  const row = await repo.findById(ctx, id)
  if (!row) throw notFound()

  const plan = launchPlanOf(row)
  const postRefs = plan?.postRefs ?? []
  const approvedAt = row.approved_at

  const [orders, conversations, metrics] = await Promise.all([
    approvedAt && row.product_id ? repo.orderFactsForProduct(ctx, row.product_id, approvedAt) : Promise.resolve([]),
    approvedAt ? repo.countConversationsSince(ctx, approvedAt) : Promise.resolve(0),
    repo.metricFacts(ctx, postRefs),
  ])

  const performance = summarizePerformance({
    approvedAt,
    orders,
    conversationsSince: conversations,
    postRefs,
    metrics,
  })
  const caveats = [...performance.caveats]
  if (!row.product_id) caveats.push("Master Image chưa gắn sản phẩm — không đếm được đơn theo sản phẩm.")

  // Chặng 13 — so trên các gói ĐÃ DUYỆT của chính tiệm.
  const approved = await repo.list(ctx, { status: "APPROVED", limit: MAX_PACKAGES_FOR_LEARN })
  const outcomes: PackageOutcome[] = []
  for (const p of approved) {
    if (!p.approved_at || !p.product_id) continue
    const facts = await repo.orderFactsForProduct(ctx, p.product_id, p.approved_at)
    const s = summarizePerformance({
      approvedAt: p.approved_at,
      orders: facts,
      conversationsSince: 0,
      postRefs: [],
      metrics: [],
    })
    outcomes.push({
      packageId: p.id,
      angleCategory: angleOf(p.topic),
      scene2Preset: sceneTwoPreset(p.topic),
      hasVideo: Boolean(p.video_job_id),
      revenueVnd: s.orders.revenueVnd,
      orderCount: s.orders.count,
    })
  }
  const learn = extractWinningPatterns(outcomes)

  const actions = nextBestActions({
    now,
    status: row.status as CampaignPackageStatus,
    approvedAt,
    hasVideo: Boolean(row.video_job_id),
    postRefs: postRefs.length,
    performance,
    learn,
    packageAngle: angleOf(row.topic),
  })

  return {
    package_id: row.id,
    status: row.status,
    sell: {
      conversations_since_approval: performance.conversations,
      orders: performance.orders.count,
    },
    measure: { ...performance, caveats },
    learn,
    next_best_actions: actions,
    computed_at: now.toISOString(),
  }
}
