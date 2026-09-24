import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { assembleVideoFromPlan } from "@/modules/creative-production/use-cases/assemble-video"
import { PUBLISH_RATIOS } from "@/modules/creative-production/domain/publishing-rules"

const bodySchema = z.object({
  scene_plan_id: z.string().trim().min(1).max(160),
  /** Chỉ với kịch bản cơ bản (`rule:…`) — kịch bản AI đọc từ kho. */
  plan: z.unknown().optional(),
  master_asset_id: z.string().uuid(),
  audio_job_id: z.string().uuid().optional(),
  title: z.string().max(200).optional(),
  dry_run: z.boolean().optional(),
  /** Khung của video — mỗi khung trong phạm vi một video (PO 24/09/2026). */
  ratio: z.enum(PUBLISH_RATIOS).optional(),
})

/**
 * `POST /api/v1/creative-production/video-assembly` (`I1`, Đợt 4 24/09/2026) —
 * dựng video từ bộ tài sản của kịch bản sản xuất tổng: ảnh Khu vực D (đúng
 * kịch bản, đúng cảnh) + nguyên bản phối Khu vực C + phụ đề/chuyển cảnh/khuôn
 * của kịch bản. `dry_run: true` chỉ kiểm tra sẵn sàng. Thiếu ảnh/âm thanh → 200
 * với `ready: false` + danh sách `problems` (không tạo job). Không trừ credit
 * (render trừ `video.render` sau P3).
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I1")
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const d = parsed.data
  const r = await assembleVideoFromPlan(ctx, {
    scenePlanId: d.scene_plan_id,
    plan: d.plan,
    masterAssetId: d.master_asset_id,
    audioJobId: d.audio_job_id ?? null,
    title: d.title,
    dryRun: d.dry_run ?? false,
    ratio: d.ratio ?? null,
  })
  return jsonResponse({
    ready: r.assembly.ready,
    problems: r.assembly.problems,
    warnings: r.assembly.warnings,
    format: r.assembly.format,
    aspect_ratio: r.assembly.aspectRatio,
    total_duration_seconds: r.assembly.totalDurationSeconds,
    scenes: r.assembly.scenes,
    audio_job_id: r.audioJobId,
    video_job_id: r.videoJobId,
    plan: r.plan,
  })
})
