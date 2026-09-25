/**
 * Đọc `content_generations` (P27, mục 6 kế hoạch) — tách khỏi
 * `generate-content.ts` vì không tạo job, không gọi cổng AI, không trừ
 * credit. Dùng cho `GET /api/v1/content-engine/generations/:id` và
 * `GET /api/v1/content-engine/generations?asset_id&topic_id&mode`.
 */

import { AppError } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import type { TenantContext } from "@/core/tenancy"

import {
  ContentGenerationRepository,
  type content_generations,
  type LatestContentGenerationFilter,
} from "../infra/content-generation-repository"

/** `GET /api/v1/content-engine/generations/:id` (`I1`). */
export async function getContentGenerationById(ctx: TenantContext, id: string): Promise<content_generations> {
  requireCapability(ctx, "I1")
  const found = await new ContentGenerationRepository().findById(ctx, id)
  if (!found) throw new AppError("NOT_FOUND", "Không có lượt sinh bài này")
  return found
}

/** `GET /api/v1/content-engine/generations?asset_id&topic_id&mode` — bản mới nhất, KHÔNG tạo job. */
export async function findLatestContentGeneration(
  ctx: TenantContext,
  filter: LatestContentGenerationFilter
): Promise<content_generations | null> {
  requireCapability(ctx, "I1")
  return new ContentGenerationRepository().findLatest(ctx, filter)
}
