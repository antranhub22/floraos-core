/**
 * Use-case: Package Campaign — Đóng gói chiến dịch hoàn chỉnh.
 *
 * Nhận kết quả từ produceAuthentic() hoặc produceCreative()
 * → Tổng hợp thành CampaignPackage sẵn sàng cho user duyệt.
 *
 * Thuần domain logic — không gọi infra trực tiếp.
 */

import type {
  CampaignPackage,
  ProducedAsset,
  MediaPlan,
  MediaPlanItem,
  ProductionMode,
  NarrativeArcOutput,
} from "../domain/production-types"
import type { ProduceAuthenticResult } from "./produce-authentic"
import type { ProduceCreativeResult } from "./produce-creative"

// ============================================================
// INPUT / OUTPUT
// ============================================================

export interface PackageCampaignInput {
  /** Tên chiến dịch (do user đặt hoặc auto-generate) */
  readonly campaignName?: string | undefined
  /** Kết quả sản xuất AUTHENTIC */
  readonly authenticResult?: ProduceAuthenticResult | undefined
  /** Kết quả sản xuất CREATIVE */
  readonly creativeResult?: ProduceCreativeResult | undefined
}

export interface PackageCampaignResult {
  readonly campaign: CampaignPackage
  /** Tổng số jobs cần dispatch */
  readonly totalJobsCount: number
  /** Tóm tắt chi phí */
  readonly costSummary: CostSummary
}

export interface CostSummary {
  readonly imageCredits: number
  readonly videoCredits: number
  readonly audioCredits: number
  readonly contentCredits: number
  readonly totalCredits: number
}

// ============================================================
// USE-CASE
// ============================================================

/**
 * Đóng gói kết quả sản xuất thành CampaignPackage.
 *
 * Hỗ trợ:
 * - Chỉ AUTHENTIC
 * - Chỉ CREATIVE
 * - Cả hai (A/B testing)
 */
export function packageCampaign(
  input: PackageCampaignInput,
): PackageCampaignResult {
  const { authenticResult, creativeResult } = input

  if (!authenticResult && !creativeResult) {
    throw new Error(
      "packageCampaign() cần ít nhất 1 kết quả sản xuất (AUTHENTIC hoặc CREATIVE)"
    )
  }

  // Xác định mode
  const mode = resolveMode(authenticResult, creativeResult)

  // Gom media plan items
  const allItems: MediaPlanItem[] = []
  if (authenticResult) {
    allItems.push(...authenticResult.mediaPlanItems)
  }
  if (creativeResult) {
    allItems.push(...creativeResult.mediaPlanItems)
  }

  // Tính credit tổng
  const totalCredits =
    (authenticResult?.totalEstimatedCredits ?? 0) +
    (creativeResult?.totalEstimatedCredits ?? 0)

  // Build media plan
  const mediaPlan: MediaPlan = {
    briefId: `campaign-${Date.now()}`,
    mode,
    items: allItems,
    estimatedCredits: totalCredits,
    estimatedTimeMinutes: estimateProductionTime(allItems),
  }

  // Lấy narrative arc đầu tiên (nếu CREATIVE)
  const narrativeArc = creativeResult?.topicResults[0]?.arc

  // Gom topic IDs
  const topicIds = collectTopicIds(authenticResult, creativeResult)

  // Tên chiến dịch
  const campaignName = input.campaignName ?? generateCampaignName(mode, topicIds.length)

  // Build campaign package
  const campaign: CampaignPackage = {
    campaignId: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    campaignName,
    mode,
    topicIds,
    narrativeArc,
    mediaPlan,
    status: "DRAFT",
    producedAssets: [], // Chưa có — sẽ được cập nhật khi jobs hoàn thành
    createdAt: new Date(),
  }

  // Cost summary
  const costSummary = buildCostSummary(allItems)

  return {
    campaign,
    totalJobsCount: allItems.length,
    costSummary,
  }
}

// ============================================================
// HELPERS
// ============================================================

function resolveMode(
  auth?: ProduceAuthenticResult | undefined,
  creative?: ProduceCreativeResult | undefined,
): ProductionMode {
  if (auth && creative) return "CREATIVE" // Dual mode → label as CREATIVE
  if (auth) return "AUTHENTIC"
  return "CREATIVE"
}

function collectTopicIds(
  auth?: ProduceAuthenticResult | undefined,
  creative?: ProduceCreativeResult | undefined,
): readonly string[] {
  const ids = new Set<string>()
  if (auth) {
    for (const r of auth.topicResults) ids.add(r.topicId)
  }
  if (creative) {
    for (const r of creative.topicResults) ids.add(r.topicId)
  }
  return [...ids]
}

function generateCampaignName(mode: ProductionMode, topicCount: number): string {
  const modeLabel = mode === "AUTHENTIC" ? "Chân thật" : "Sáng tạo"
  const date = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  })
  return `Chiến dịch ${modeLabel} — ${topicCount} chủ đề — ${date}`
}

function estimateProductionTime(items: readonly MediaPlanItem[]): number {
  let minutes = 0
  for (const item of items) {
    switch (item.assetType) {
      case "IMAGE_VARIANT": minutes += 2; break
      case "IMAGE_CROP": minutes += 0.1; break
      case "VIDEO_STORY": minutes += 5; break
      case "VIDEO_OVERLAY": minutes += 3; break
      case "AUDIO_MIX": minutes += 1; break
      case "AUDIO_VOICEOVER": minutes += 0.5; break
      case "CONTENT_CAPTION": minutes += 0.5; break
      case "CONTENT_POST": minutes += 1; break
      default: minutes += 1
    }
  }
  return Math.ceil(minutes)
}

function buildCostSummary(items: readonly MediaPlanItem[]): CostSummary {
  let imageCredits = 0
  let videoCredits = 0
  let audioCredits = 0
  let contentCredits = 0

  for (const item of items) {
    switch (item.assetType) {
      case "IMAGE_VARIANT": imageCredits += 5; break
      case "IMAGE_CROP": break // 0 credit
      case "VIDEO_STORY": videoCredits += 10; break
      case "VIDEO_OVERLAY": videoCredits += 10; break
      case "AUDIO_MIX": audioCredits += 3; break
      case "AUDIO_VOICEOVER": audioCredits += 1; break
      case "CONTENT_CAPTION": contentCredits += 1; break
      case "CONTENT_POST": contentCredits += 2; break
      default: break
    }
  }

  return {
    imageCredits,
    videoCredits,
    audioCredits,
    contentCredits,
    totalCredits: imageCredits + videoCredits + audioCredits + contentCredits,
  }
}
