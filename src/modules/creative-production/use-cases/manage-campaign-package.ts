/**
 * Use-cases: Gói chiến dịch Creative Studio (Khu vực F — Chặng 07, 08, 09, 10).
 *
 * 23/09/2026 — thay cho giao diện dựng sẵn (QA luôn PASSED, duyệt không ghi gì):
 *
 *   createCampaignPackage / updateCampaignPackage — Chặng 07 PACKAGE
 *   runCampaignQa                                 — Chặng 08 QA (chạy phía máy chủ)
 *   approveCampaignPackage                        — Chặng 09 APPROVE (+ audit_logs cùng giao dịch)
 *   saveLaunchPlan                                — Chặng 10 LAUNCH (kế hoạch + mã bài đã đăng)
 *
 * Gói chỉ giữ ĐỊNH DANH tới tài sản thật; mọi định danh được kiểm thuộc đúng
 * tổ chức và đúng Master trước khi ghi.
 */

import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { SCENE_PLAN_FEATURE, parseStoredScenePlan } from "../domain/scene-plan-rules"
import { resolvePublishing } from "../domain/publishing-rules"
import { conflict, notFound, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import { AudioJobRepository } from "@/modules/audio-studio/infra/audio-job-repository"
import { runInTransaction } from "@/modules/jobs/infra/transaction"
import { BrandProfileRepository } from "@/modules/profiles/infra/brand-profile-repository"
import { VideoJobRepository } from "@/modules/video-studio/infra/video-job-repository"
import { videoViewUrl } from "@/modules/video-studio/use-cases/get-video-job"

import {
  canApprovePackage,
  canEditPackage,
  evaluateCampaignQa,
  statusFromQa,
  type CampaignPackageStatus,
  type LaunchPlan,
  type PackagePost,
  type QaReport,
  type QaScope,
} from "../domain/campaign-package-rules"
import {
  CampaignPackageRepository,
  type campaign_packages,
} from "../infra/campaign-package-repository"

const PREVIEW_EXPIRES_IN = 3600

export interface CampaignTopicSnapshot {
  readonly id: string
  readonly title: string
  readonly angleCategory?: string | undefined
  readonly hook?: string | undefined
  readonly cta?: string | undefined
  /** Preset Cảnh 2 (Khu vực D) — một chiều so sánh của Chặng 13. */
  readonly scene2Preset?: string | undefined
  /** Kịch bản sản xuất tổng của gói + phiên bản lúc tạo gói (Đợt 5). */
  readonly scenePlanId?: string | undefined
  readonly scenePlanRevision?: number | undefined
}

export interface CreateCampaignPackageInput {
  readonly name: string
  readonly mode: "CREATIVE" | "AUTHENTIC"
  readonly masterAssetId: string
  readonly topic?: CampaignTopicSnapshot | undefined
  readonly posts?: readonly PackagePost[] | undefined
  readonly variantAssetIds?: readonly string[] | undefined
  readonly videoJobId?: string | null | undefined
  /** Mọi video của gói (mỗi khung một video, 24/09/2026). */
  readonly videoJobIds?: readonly string[] | undefined
  readonly audioJobId?: string | null | undefined
}

export interface UpdateCampaignPackageInput {
  readonly name?: string | undefined
  readonly posts?: readonly PackagePost[] | undefined
  readonly variantAssetIds?: readonly string[] | undefined
  readonly videoJobId?: string | null | undefined
  readonly videoJobIds?: readonly string[] | undefined
  readonly audioJobId?: string | null | undefined
}

/**
 * Hợp `video_job_id` (video chính, API cũ) + `video_job_ids` thành một danh sách
 * không trùng; phần tử đầu là video chính. `undefined` = không đổi.
 */
export function mergeVideoIds(
  primary: string | null | undefined,
  list: readonly string[] | undefined
): { videoJobId: string | null; videoJobIds: string[] } | undefined {
  if (primary === undefined && list === undefined) return undefined
  const ids = Array.from(new Set([...(primary ? [primary] : []), ...(list ?? [])]))
  return { videoJobId: ids[0] ?? null, videoJobIds: ids }
}

// ─── Kiểm định danh ──────────────────────────────────────────────────────────

async function assertMaster(ctx: TenantContext, masterAssetId: string) {
  const master = await new AssetRepository().findById(ctx, masterAssetId)
  if (!master) throw notFound()
  if (master.kind !== "MASTER" || master.approval_state !== "APPROVED") {
    throw conflict("Gói chiến dịch phải neo vào một Master Image đã duyệt (cổng 2, I2).")
  }
  return master
}

async function assertVariants(ctx: TenantContext, masterAssetId: string, ids: readonly string[]) {
  const repo = new AssetRepository()
  const unique = Array.from(new Set(ids))
  for (const id of unique) {
    const a = await repo.findById(ctx, id)
    if (!a || a.kind !== "MARKETING" || a.parent_asset_id !== masterAssetId) {
      throw validationFailed({
        variant_asset_ids: `Asset ${id} không phải biến thể marketing của Master ${masterAssetId}.`,
      })
    }
  }
  return unique
}

async function assertVideos(ctx: TenantContext, ids: readonly string[] | undefined) {
  const repo = new VideoJobRepository()
  for (const id of ids ?? []) {
    if (!(await repo.findById(ctx, id))) {
      throw validationFailed({ video_job_id: `Video job ${id} không tồn tại trong tổ chức.` })
    }
  }
}

async function assertAudio(ctx: TenantContext, id: string | null | undefined) {
  if (!id) return
  if (!(await new AudioJobRepository().findById(ctx, id))) {
    throw validationFailed({ audio_job_id: "Audio job không tồn tại trong tổ chức." })
  }
}

// ─── Chặng 07 ────────────────────────────────────────────────────────────────

export async function createCampaignPackage(ctx: TenantContext, input: CreateCampaignPackageInput) {
  const master = await assertMaster(ctx, input.masterAssetId)
  const variantIds = await assertVariants(ctx, master.id, input.variantAssetIds ?? [])
  const vids = mergeVideoIds(input.videoJobId ?? null, input.videoJobIds ?? []) ?? { videoJobId: null, videoJobIds: [] }
  await assertVideos(ctx, vids.videoJobIds)
  await assertAudio(ctx, input.audioJobId)

  const row = await new CampaignPackageRepository().create(ctx, {
    productId: master.product_id,
    masterAssetId: master.id,
    name: input.name.trim(),
    mode: input.mode,
    topic: input.topic ?? null,
    content: { posts: input.posts ?? [] },
    variantAssetIds: variantIds,
    videoJobId: vids.videoJobId,
    videoJobIds: vids.videoJobIds,
    audioJobId: input.audioJobId ?? null,
  })
  return getCampaignPackage(ctx, row.id)
}

export async function updateCampaignPackage(
  ctx: TenantContext,
  id: string,
  input: UpdateCampaignPackageInput
) {
  const repo = new CampaignPackageRepository()
  const current = await repo.findById(ctx, id)
  if (!current) throw notFound()
  if (!canEditPackage(current.status as CampaignPackageStatus)) {
    throw conflict("Gói đã duyệt không sửa được — tạo gói mới cho chiến dịch khác.")
  }
  const variantIds =
    input.variantAssetIds !== undefined
      ? await assertVariants(ctx, current.master_asset_id, input.variantAssetIds)
      : undefined
  const vids = mergeVideoIds(input.videoJobId, input.videoJobIds)
  await assertVideos(ctx, vids?.videoJobIds)
  await assertAudio(ctx, input.audioJobId)

  const updated = await repo.updateDraft(ctx, id, {
    name: input.name?.trim(),
    content: input.posts !== undefined ? { posts: input.posts } : undefined,
    variantAssetIds: variantIds,
    videoJobId: vids?.videoJobId,
    videoJobIds: vids?.videoJobIds,
    audioJobId: input.audioJobId,
  })
  if (!updated) throw conflict("Gói vừa được duyệt ở nơi khác — tải lại để xem.")
  return getCampaignPackage(ctx, id)
}

// ─── Đọc ─────────────────────────────────────────────────────────────────────

export function postsOf(row: Pick<campaign_packages, "content">): PackagePost[] {
  const content = row.content as { posts?: PackagePost[] } | null
  return Array.isArray(content?.posts) ? content!.posts : []
}

/** Mọi video của gói — gói cũ chỉ có `video_job_id`. */
export function videoIdsOf(row: Pick<campaign_packages, "video_job_id" | "video_job_ids">): string[] {
  const list = row.video_job_ids ?? []
  if (list.length > 0) return [...list]
  return row.video_job_id ? [row.video_job_id] : []
}

export function launchPlanOf(row: Pick<campaign_packages, "launch_plan">): LaunchPlan | null {
  const plan = row.launch_plan as LaunchPlan | null
  return plan && Array.isArray(plan.channels) ? plan : null
}

export async function getCampaignPackage(ctx: TenantContext, id: string) {
  const row = await new CampaignPackageRepository().findById(ctx, id)
  if (!row) throw notFound()

  const storage = getStorageProvider()
  const assetRepo = new AssetRepository()
  const variants = []
  for (const assetId of row.variant_asset_ids) {
    const a = await assetRepo.findById(ctx, assetId)
    if (!a) continue
    const meta = (a.metadata && typeof a.metadata === "object" ? a.metadata : {}) as Record<string, unknown>
    variants.push({
      asset_id: a.id,
      url: await storage.signedUrl(a.storage_key, PREVIEW_EXPIRES_IN),
      aspect_ratio: a.aspect_ratio,
      identity_score: a.identity_score,
      approval_state: a.approval_state,
      scene_index: typeof meta.scene_index === "number" ? meta.scene_index : null,
      watermark: meta.watermark === true,
    })
  }

  const videoRepo = new VideoJobRepository()
  const videos = []
  for (const vid of videoIdsOf(row)) {
    const v = await videoRepo.findById(ctx, vid)
    if (!v) continue
    videos.push({
      id: v.id,
      title: v.title,
      stage: v.stage,
      video_approval: v.video_approval,
      aspect_ratio: v.aspect_ratio,
      final_video_url: v.final_video_url,
      script_approval: v.script_approval,
      // URL ký có hạn để phát video ngay ở Chặng 07 (24/09/2026).
      view_url: await videoViewUrl(ctx, v.final_video_url),
    })
  }
  const video = videos[0] ?? null

  let audio = null
  if (row.audio_job_id) {
    const a = await new AudioJobRepository().findById(ctx, row.audio_job_id)
    if (a) {
      audio = {
        job_id: a.id,
        stage: a.stage,
        audio_url: a.mixedAudioStorageKey
          ? await storage.signedUrl(a.mixedAudioStorageKey, PREVIEW_EXPIRES_IN)
          : null,
      }
    }
  }

  return {
    id: row.id,
    name: row.name,
    mode: row.mode,
    status: row.status,
    master_asset_id: row.master_asset_id,
    product_id: row.product_id,
    topic: row.topic,
    posts: postsOf(row),
    variant_asset_ids: row.variant_asset_ids,
    video_job_id: row.video_job_id,
    video_job_ids: videoIdsOf(row),
    audio_job_id: row.audio_job_id,
    variants,
    video,
    videos,
    audio,
    qa_report: row.qa_report as QaReport | null,
    qa_checked_at: row.qa_checked_at?.toISOString() ?? null,
    approved_by: row.approved_by,
    approved_at: row.approved_at?.toISOString() ?? null,
    launch_plan: launchPlanOf(row),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

export async function listCampaignPackages(
  ctx: TenantContext,
  options: { masterAssetId?: string | undefined; limit?: number | undefined }
) {
  const limit = options.limit ?? 20
  if (limit < 1 || limit > 100) throw validationFailed({ limit: "Phải trong khoảng 1..100" })
  const rows = await new CampaignPackageRepository().list(ctx, { masterAssetId: options.masterAssetId, limit })
  return {
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      master_asset_id: r.master_asset_id,
      approved_at: r.approved_at?.toISOString() ?? null,
      created_at: r.created_at.toISOString(),
    })),
  }
}

// ─── Chặng 08 ────────────────────────────────────────────────────────────────

export async function runCampaignQa(ctx: TenantContext, id: string, now: Date = new Date()) {
  const repo = new CampaignPackageRepository()
  const row = await repo.findById(ctx, id)
  if (!row) throw notFound()
  if (row.status === "APPROVED") throw conflict("Gói đã duyệt — không chạy lại QA.")

  const assetRepo = new AssetRepository()
  const variants = []
  for (const assetId of row.variant_asset_ids) {
    const a = await assetRepo.findById(ctx, assetId)
    if (!a) continue
    const meta = (a.metadata && typeof a.metadata === "object" ? a.metadata : {}) as Record<string, unknown>
    variants.push({
      assetId: a.id,
      approvalState: a.approval_state,
      identityScore: typeof a.identity_score === "number" ? a.identity_score : null,
      aspectRatio: typeof meta.ratio === "string" ? meta.ratio : a.aspect_ratio,
      watermark: meta.watermark === true,
      scenePlanId: typeof meta.scene_plan_id === "string" ? meta.scene_plan_id : null,
      scenePlanRevision: typeof meta.scene_plan_revision === "number" ? meta.scene_plan_revision : null,
    })
  }

  const videoRepo = new VideoJobRepository()
  const videoRows = []
  for (const vid of videoIdsOf(row)) {
    const v = await videoRepo.findById(ctx, vid)
    if (v) videoRows.push(v)
  }
  const audioRow = row.audio_job_id ? await new AudioJobRepository().findById(ctx, row.audio_job_id) : null
  const brand = await new BrandProfileRepository().current(ctx)
  const forbidden = brand?.forbidden_styles
  const forbiddenStyles =
    typeof forbidden === "string"
      ? forbidden
      : Array.isArray(forbidden)
      ? forbidden.join(", ")
      : forbidden
      ? JSON.stringify(forbidden)
      : null

  const report = evaluateCampaignQa({
    posts: postsOf(row),
    variants,
    video: null,
    videos: videoRows.map((v) => ({
      stage: v.stage,
      approval: v.video_approval,
      aspectRatio: v.aspect_ratio,
      scenePlanId: v.scene_plan_id,
      scenePlanRevision: v.scene_plan_revision,
      usesPlanAudio: Boolean(v.audio_storage_key),
    })),
    audio: audioRow ? { stage: audioRow.stage, ...(await audioPlanLink(ctx, audioRow.id)) } : null,
    plan: await currentPlanOf(ctx, row),
    brand: { hasLogo: Boolean(brand?.logo_asset_id), forbiddenStyles },
    now,
  })

  const saved = await repo.saveQa(ctx, id, statusFromQa(report.verdict), report, now)
  if (!saved) throw conflict("Gói vừa được duyệt ở nơi khác — tải lại để xem.")
  return getCampaignPackage(ctx, id)
}

// ─── Chặng 09 ────────────────────────────────────────────────────────────────

export async function approveCampaignPackage(
  ctx: TenantContext,
  id: string,
  input: { acknowledgeWarnings: boolean },
  now: Date = new Date()
) {
  const repo = new CampaignPackageRepository()
  const row = await repo.findById(ctx, id)
  if (!row) throw notFound()

  const status = row.status as CampaignPackageStatus
  const decision = canApprovePackage(status, input.acknowledgeWarnings)
  if (!decision.ok) throw conflict(decision.reason)

  await runInTransaction(async (tx) => {
    const ok = await new CampaignPackageRepository(tx).approve(ctx, id, status, now)
    if (!ok) throw conflict("Trạng thái gói vừa thay đổi — tải lại rồi duyệt lại.")
    await recordAuditLog(
      ctx,
      {
        action: "campaign_package.approve",
        entityType: "campaign_packages",
        entityId: id,
        before: { status },
        after: {
          status: "APPROVED",
          acknowledged_warnings: input.acknowledgeWarnings,
          qa_verdict: (row.qa_report as QaReport | null)?.verdict ?? null,
        },
      },
      tx
    )
  })
  return getCampaignPackage(ctx, id)
}

// ─── Chặng 10 ────────────────────────────────────────────────────────────────

export async function saveLaunchPlan(ctx: TenantContext, id: string, plan: LaunchPlan) {
  const repo = new CampaignPackageRepository()
  const row = await repo.findById(ctx, id)
  if (!row) throw notFound()
  if (row.status !== "APPROVED") throw conflict("Chỉ lập kế hoạch đăng cho gói đã duyệt (Chặng 09).")
  const saved = await repo.saveLaunchPlan(ctx, id, plan)
  if (!saved) throw conflict("Không lưu được kế hoạch đăng.")
  return getCampaignPackage(ctx, id)
}

// ─── Đợt 5 (24/09/2026): đồng nhất kịch bản sản xuất tổng ────────────────────

async function audioPlanLink(ctx: TenantContext, audioJobId: string) {
  const j = await new GenerationJobRepository().findById(ctx, audioJobId)
  const p = (j?.payload ?? {}) as Record<string, unknown>
  return {
    scenePlanId: typeof p.scenePlanId === "string" ? p.scenePlanId : null,
    scenePlanRevision: typeof p.scenePlanRevision === "number" ? p.scenePlanRevision : null,
  }
}

/** Kịch bản hiện hành của gói: đọc phiên bản mới nhất từ job kịch bản; kịch bản cơ bản dùng số lưu trong gói. */
async function currentPlanOf(
  ctx: TenantContext,
  row: campaign_packages
): Promise<{ scenePlanId: string; revision: number; scope?: QaScope | undefined } | null> {
  const topic = (row.topic ?? null) as CampaignTopicSnapshot | null
  const id = topic?.scenePlanId
  if (!id) return null
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const j = await new GenerationJobRepository().findById(ctx, id)
    const plan = j && j.feature === SCENE_PLAN_FEATURE && j.status === "COMPLETED" ? parseStoredScenePlan(j.output) : null
    if (plan) {
      const pub = resolvePublishing(
        plan.publishing.allPlatforms ? "all" : plan.publishing.platforms,
        plan.publishing.allOutputs ? "all" : plan.publishing.outputs
      )
      return {
        scenePlanId: id,
        revision: plan.revision,
        // Phạm vi sản xuất của kịch bản → trục QA "Đủ phạm vi đã chọn".
        scope: { produce: pub.produce, ratios: pub.ratios, postChannels: pub.postChannels },
      }
    }
  }
  return { scenePlanId: id, revision: topic?.scenePlanRevision ?? 1 }
}
