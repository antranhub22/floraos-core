/**
 * Client helpers — Gói chiến dịch (Khu vực F) dùng chung cho Khu vực B và F.
 *
 * Chỉ gọi API; không giữ dữ liệu nặng ở URL hay sessionStorage (luật bàn giao
 * 22/09/2026). Mọi phán quyết (QA, duyệt) nằm ở máy chủ.
 */

export type PackageChannel = "facebook" | "instagram" | "tiktok" | "zalo"

export interface PackagePostDto {
  channel: PackageChannel
  text: string
  hashtags: string[]
}

export interface QaCheckDto {
  id: string
  title: string
  verdict: "PASS" | "NEEDS_REVIEW" | "REJECTED"
  reasons: string[]
}

export interface CampaignPackageDto {
  id: string
  name: string
  mode: string
  status: "DRAFT" | "QA_PASSED" | "QA_NEEDS_REVIEW" | "QA_REJECTED" | "APPROVED"
  master_asset_id: string
  product_id: string | null
  topic: { id: string; title: string; angleCategory?: string; scene2Preset?: string } | null
  posts: PackagePostDto[]
  variant_asset_ids: string[]
  video_job_id: string | null
  /** Mọi video của gói — mỗi khung trong phạm vi một video (24/09/2026). */
  video_job_ids?: string[]
  audio_job_id: string | null
  variants: Array<{
    asset_id: string
    url: string
    aspect_ratio: string | null
    identity_score: number | null
    approval_state: string
    scene_index: number | null
    watermark: boolean
  }>
  video: {
    id: string
    title: string
    stage: string
    video_approval: string
    script_approval?: string
    aspect_ratio: string
    final_video_url: string | null
    view_url?: string | null
  } | null
  /** Mọi video của gói (theo `video_job_ids`). */
  videos?: Array<NonNullable<CampaignPackageDto["video"]>>
  audio: { job_id: string; stage: string; audio_url: string | null } | null
  qa_report: { verdict: "PASS" | "NEEDS_REVIEW" | "REJECTED"; checks: QaCheckDto[]; checkedAt: string } | null
  qa_checked_at: string | null
  approved_by: string | null
  approved_at: string | null
  launch_plan: {
    channels: PackageChannel[]
    scheduledAt: string | null
    postRefs: Array<{ platform: PackageChannel; contentId: string }>
  } | null
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
  return body.error?.message || `Lỗi HTTP ${res.status}`
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as T
}

/**
 * Master Image đã duyệt ứng với asset của Khu vực A: chính nó nếu đã là
 * MASTER/APPROVED, hoặc bản MASTER con tạo qua "Skip — Dùng ảnh gốc".
 */
export async function resolveApprovedMaster(assetId: string | undefined): Promise<string | null> {
  if (!assetId) return null
  const self = await fetch(`/api/v1/assets/${encodeURIComponent(assetId)}`)
  if (self.ok) {
    const { asset: a } = (await self.json()) as { asset?: { kind?: string; approval_state?: string } }
    if (a?.kind === "MASTER" && a.approval_state === "APPROVED") return assetId
  }
  const res = await fetch(
    `/api/v1/assets?kind=MASTER&approval_state=APPROVED&parent_asset_id=${encodeURIComponent(assetId)}&limit=1`
  )
  if (!res.ok) return null
  const body = (await res.json()) as { data?: Array<{ id: string }> }
  return body.data?.[0]?.id ?? null
}

/** "Skip — Dùng ảnh gốc": nâng ORIGINAL thành MASTER đã duyệt (I2). */
export async function promoteToMaster(originalAssetId: string): Promise<string> {
  const out = await apiJson<{ master_asset_id: string }>("/api/v1/media/promote-to-master", {
    method: "POST",
    body: JSON.stringify({ asset_id: originalAssetId }),
  })
  return out.master_asset_id
}

export async function findLatestPackage(masterAssetId: string): Promise<CampaignPackageDto | null> {
  const list = await apiJson<{ data: Array<{ id: string }> }>(
    `/api/v1/creative-production/packages?master_asset_id=${encodeURIComponent(masterAssetId)}&limit=1`
  )
  const first = list.data[0]
  return first ? apiJson<CampaignPackageDto>(`/api/v1/creative-production/packages/${first.id}`) : null
}

/** Lưu bài đăng vào gói mới nhất CHƯA DUYỆT của Master; chưa có thì tạo gói mới. */
export async function savePostsToPackage(input: {
  masterAssetId: string
  name: string
  mode: "CREATIVE" | "AUTHENTIC"
  topic: CampaignPackageDto["topic"]
  posts: PackagePostDto[]
}): Promise<CampaignPackageDto> {
  const latest = await findLatestPackage(input.masterAssetId)
  if (latest && latest.status !== "APPROVED") {
    return apiJson<CampaignPackageDto>(`/api/v1/creative-production/packages/${latest.id}`, {
      method: "PATCH",
      body: JSON.stringify({ posts: input.posts }),
    })
  }
  return apiJson<CampaignPackageDto>("/api/v1/creative-production/packages", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      mode: input.mode,
      master_asset_id: input.masterAssetId,
      ...(input.topic ? { topic: input.topic } : {}),
      posts: input.posts,
    }),
  })
}

/** Preset Cảnh 2 theo góc tiếp cận thật của Chặng 04 (`TopicAngleCategory`). */
export function sceneTwoPresetFor(angle: string | undefined): "wedding" | "luxury_hotel" | "living_room" {
  if (angle === "EMOTIONAL") return "wedding"
  if (angle === "PRODUCT_SHOWCASE" || angle === "TREND") return "luxury_hotel"
  return "living_room"
}

// ── Bài Khu vực B tự lưu (24/09/2026) ──────────────────────────────────────

export interface ContentDraftDto {
  asset_id: string
  topic_id: string
  mode: string
  topic_title: string | null
  posts: PackagePostDto[]
  updated_at: string
}

/** Khoá bản nháp — cùng quy ước với kịch bản bối cảnh (chưa chọn chủ đề = "no-topic"). */
export function contentDraftKey(ctx: {
  assetId?: string | undefined
  selectedTopic?: { id: string } | null | undefined
  mode: "CREATIVE" | "AUTHENTIC"
}): { asset_id: string; topic_id: string; mode: "CREATIVE" | "AUTHENTIC" } | null {
  if (!ctx.assetId) return null
  return { asset_id: ctx.assetId, topic_id: ctx.selectedTopic?.id ?? "no-topic", mode: ctx.mode }
}

export async function getContentDraft(
  key: { asset_id: string; topic_id: string; mode: string }
): Promise<ContentDraftDto | null> {
  const q = new URLSearchParams(key)
  const body = await apiJson<{ draft: ContentDraftDto | null }>(`/api/v1/creative-production/content-drafts?${q.toString()}`)
  return body.draft
}

export async function saveContentDraft(
  key: { asset_id: string; topic_id: string; mode: string },
  posts: PackagePostDto[],
  topicTitle: string | null
): Promise<ContentDraftDto> {
  const body = await apiJson<{ draft: ContentDraftDto }>("/api/v1/creative-production/content-drafts", {
    method: "PUT",
    body: JSON.stringify({ ...key, topic_title: topicTitle, posts }),
  })
  return body.draft
}
