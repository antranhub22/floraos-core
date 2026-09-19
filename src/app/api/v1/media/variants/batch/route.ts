import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { readIdempotencyKey } from "@/modules/jobs/domain/idempotency"
import {
  VARIANT_PRESET_IDS,
  VARIANT_RATIOS,
  type VariantCombination,
} from "@/modules/media/domain/variant-rules"
import { requestVariantBatch } from "@/modules/media/use-cases/request-variants"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

const presetsSchema = z.union([z.literal("all"), z.array(z.enum(VARIANT_PRESET_IDS)).min(1)])
const ratiosSchema = z.union([z.literal("all"), z.array(z.enum(VARIANT_RATIOS)).min(1)])

const postSchema = z.object({
  master_asset_id: z.string().min(1),
  presets: presetsSchema.default("all"),
  ratios: ratiosSchema.default("all"),
  watermark: z.boolean().default(true),
  // AIC-14 — chốt 18/09 (AskUserQuestion): chỉ chỉnh vùng nền, mặc định tắt.
  auto_enhance: z.boolean().default(false),
})

/**
 * `POST /media/variants/batch` (`I4`) — chạy lô nhiều tổ hợp preset×ratio
 * trong MỘT lượt gọi (nợ #108, AIC-17 mở rộng: "30 mẫu khác nhau từ ảnh
 * gốc"). Không phải một đường job/hạn mức mới — mỗi tổ hợp vẫn đi qua
 * nguyên `requestVariants`/`enqueueJob`, chỉ gom lại dưới một
 * `job_group_id` để dựng một màn tiến độ chung. Xem thiết kế đầy đủ ở
 * docstring `requestVariantBatch`.
 *
 * Bỏ trống `presets`/`ratios` (hoặc gửi `"all"`) chạy TOÀN BỘ ma trận 24
 * tổ hợp (`VARIANT_PRESET_IDS × VARIANT_RATIOS`). Gửi mảng cụ thể để chạy
 * một tập con.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I4")

  const idempotencyKey = readIdempotencyKey(request)
  if (!idempotencyKey) {
    throw validationFailed({ "idempotency-key": "Bắt buộc trên mọi endpoint tạo job (YC-U7)" })
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const presets = parsed.data.presets === "all" ? VARIANT_PRESET_IDS : parsed.data.presets
  const ratios = parsed.data.ratios === "all" ? VARIANT_RATIOS : parsed.data.ratios
  const combinations: VariantCombination[] = ratios.flatMap((ratio) =>
    presets.map((preset) => ({ preset, ratio }))
  )

  const result = await requestVariantBatch(ctx, {
    masterAssetId: parsed.data.master_asset_id,
    combinations,
    watermark: parsed.data.watermark,
    autoEnhance: parsed.data.auto_enhance,
    idempotencyKey,
  })

  return jsonResponse(
    {
      job_group_id: result.jobGroupId,
      jobs: result.jobs.map((j) => ({
        job_id: j.jobId,
        status: j.status,
        preset: j.preset,
        ratio: j.ratio,
        deduped: j.deduped,
        cost_credit: j.costCredit,
      })),
    },
    { status: 201 }
  )
})
