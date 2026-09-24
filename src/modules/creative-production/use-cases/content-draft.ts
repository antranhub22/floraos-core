import { AppError } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"

import { ContentDraftRepository, type ContentDraftKey } from "../infra/content-draft-repository"
import type { PackagePost } from "../domain/campaign-package-rules"

export interface ContentDraftDto {
  asset_id: string
  topic_id: string
  mode: string
  topic_title: string | null
  posts: PackagePost[]
  updated_at: string
}

function toDto(row: {
  asset_id: string
  topic_id: string
  mode: string
  topic_title: string | null
  posts: unknown
  updated_at: Date
}): ContentDraftDto {
  return {
    asset_id: row.asset_id,
    topic_id: row.topic_id,
    mode: row.mode,
    topic_title: row.topic_title,
    posts: Array.isArray(row.posts) ? (row.posts as PackagePost[]) : [],
    updated_at: row.updated_at.toISOString(),
  }
}

/**
 * Tự lưu bài Khu vực B (24/09/2026). Ảnh phải thuộc ĐÚNG tổ chức của phiên —
 * không nhận một `asset_id` lạ làm khoá.
 */
export async function saveContentDraft(
  ctx: TenantContext,
  key: ContentDraftKey,
  data: { posts: PackagePost[]; topicTitle: string | null }
): Promise<ContentDraftDto> {
  requireCapability(ctx, "I1")
  const asset = await new AssetRepository().findById(ctx, key.assetId)
  if (!asset) throw new AppError("NOT_FOUND", "Không có ảnh sản phẩm này trong kho của tổ chức")
  return toDto(await new ContentDraftRepository().upsert(ctx, key, data))
}

export async function getContentDraft(ctx: TenantContext, key: ContentDraftKey): Promise<ContentDraftDto | null> {
  requireCapability(ctx, "I1")
  const row = await new ContentDraftRepository().find(ctx, key)
  return row ? toDto(row) : null
}
