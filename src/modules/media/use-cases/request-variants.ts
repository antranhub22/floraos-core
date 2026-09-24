import { randomUUID } from "node:crypto"

import { conflict, notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import { enqueueJob } from "@/modules/jobs/use-cases/enqueue-job"
import { GenerationJobRepository } from "@/modules/jobs/infra/generation-job-repository"
import { SCENE_PLAN_FEATURE, parseStoredScenePlan } from "@/modules/creative-production/domain/scene-plan-rules"
import {
  resolveVariantDirection,
  variantDirectionPayload,
  type PlanSceneHint,
  type VariantDirectionInput,
} from "@/modules/media/domain/variant-direction-rules"
import {
  ALL_VARIANT_COMBINATIONS,
  isEligibleMasterForVariants,
  MAX_SCENE_PROMPT_LENGTH,
  MEDIA_VARIANT_CLOUD_FEATURE,
  MEDIA_VARIANT_FEATURE,
  type NarrativeSceneIndex,
  type VariantCloudProvider,
  variantBatchIdempotencyKey,
  type VariantCombination,
  type VariantPresetId,
  type VariantRatio,
} from "@/modules/media/domain/variant-rules"

export { MEDIA_VARIANT_FEATURE }

export type RequestVariantsInput = {
  masterAssetId: string
  preset: VariantPresetId
  ratio: VariantRatio
  watermark: boolean
  /** AIC-14 — tự động cân bằng sáng/tương phản, CHỈ ở vùng nền đã ghép
   *  (chốt 18/09, AskUserQuestion: "Chỉ chỉnh phông nền"). Mặc định tắt,
   *  không đổi hành vi cũ khi không truyền. */
  autoEnhance?: boolean
  idempotencyKey: string
  /** Phân cảnh Narrative Arc (Khu vực D Creative Studio) — ghi vào metadata asset. */
  sceneIndex?: NarrativeSceneIndex | undefined
  /** Kịch bản bối cảnh (`creative.scene_plan` job id) mà cảnh này thuộc về. */
  scenePlanId?: string | undefined
  /** Phiên bản kịch bản sản xuất tổng lúc sinh ảnh (Đợt 3, 24/09/2026). */
  scenePlanRevision?: number | undefined
  /** Chỉ đạo khung hình (Đợt 1 nâng cấp chất lượng, 24/09/2026) — thiếu thì lấy từ kịch bản. */
  direction?: VariantDirectionInput | undefined
}

/**
 * Gợi ý của ĐÚNG cảnh trong kịch bản sản xuất tổng (`shot`, `lighting`,
 * `palette`). Chỉ là gợi ý: không đọc được (kịch bản cơ bản không có job, job
 * chưa xong, id lạ) thì trả `null` — không bao giờ chặn việc tạo ảnh.
 */
async function sceneHintFor(
  ctx: TenantContext,
  scenePlanId: string | undefined,
  sceneIndex: number | undefined
): Promise<PlanSceneHint | null> {
  if (!scenePlanId || !sceneIndex || !/^[0-9a-f-]{36}$/i.test(scenePlanId)) return null
  try {
    const job = await new GenerationJobRepository().findById(ctx, scenePlanId)
    if (!job || job.feature !== SCENE_PLAN_FEATURE || job.status !== "COMPLETED") return null
    const scene = parseStoredScenePlan(job.output)?.scenes.find((s) => s.sceneIndex === sceneIndex)
    return scene ? { shot: scene.shot, lighting: scene.lighting, palette: scene.palette } : null
  } catch {
    return null
  }
}

async function directionPayload(ctx: TenantContext, input: RequestVariantsInput) {
  const hint = await sceneHintFor(ctx, input.scenePlanId, input.sceneIndex)
  return variantDirectionPayload(resolveVariantDirection(input.direction ?? {}, hint))
}

/**
 * `POST /media/variants` (`I4`) — M04b, đường DUY NHẤT tạo biến thể marketing.
 *
 * Đi qua nguyên `enqueueJob` của P3, giống hệt M04a: cùng đường hạn mức, cùng
 * giao dịch, cùng `Idempotency-Key`. Bản trước của M04b chạy bằng một route
 * tự `spawn` Python rồi đọc stdout — đường đó không có tổ chức, không có
 * năng lực, không trừ credit, và vi phạm thẳng luật "cấm `subprocess` +
 * parse stdout, cấm chạy job qua HTTP" ở `AGENTS.md`.
 *
 * Kiểm asset TRƯỚC khi vào hàng đợi, cùng lý do như `request-optimization.ts`:
 * một job trỏ vào asset của tổ chức khác chỉ `FAILED` ở worker, sau khi
 * credit đã bị trừ ở bước enqueue.
 *
 * `409` chứ không `403` khi Master chưa duyệt: người gọi CÓ năng lực `I4`,
 * chỉ là bản ghi chưa ở trạng thái dùng được. Trả `403` sẽ đẩy người dùng đi
 * xin thêm quyền cho một việc mà quyền không giải quyết được.
 */
export async function requestVariants(ctx: TenantContext, input: RequestVariantsInput) {
  const master = await new AssetRepository().findById(ctx, input.masterAssetId)
  if (!master) throw notFound()

  if (!isEligibleMasterForVariants(master)) {
    throw conflict(
      "Biến thể marketing chỉ dựng được trên Master Image đã duyệt (cổng 2, media.approve)"
    )
  }

  return enqueueJob(ctx, {
    feature: MEDIA_VARIANT_FEATURE,
    productId: master.product_id,
    payload: {
      master_asset_id: input.masterAssetId,
      preset: input.preset,
      ratio: input.ratio,
      watermark: input.watermark,
      auto_enhance: input.autoEnhance ?? false,
      ...(input.sceneIndex ? { scene_index: input.sceneIndex } : {}),
      ...(input.scenePlanId ? { scene_plan_id: input.scenePlanId } : {}),
      ...(input.scenePlanRevision ? { scene_plan_revision: input.scenePlanRevision } : {}),
      ...(await directionPayload(ctx, input)),
    },
    idempotencyKey: input.idempotencyKey,
  })
}

export type RequestCloudVariantInput = RequestVariantsInput & {
  provider: VariantCloudProvider
  /** Mô tả KHÔNG GIAN hậu cảnh (không mô tả bó hoa) — worker luôn nối thêm
   *  ràng buộc "cảnh trống", cắt còn `MAX_SCENE_PROMPT_LENGTH` ký tự. */
  scenePrompt?: string | undefined
}

/**
 * `POST /media/variants` với `engine: "cloud_provider"` (`I4`) — nhánh Cloud
 * của M04b, 23/09/2026.
 *
 * Đi qua CHÍNH `enqueueJob` như nhánh local: kiểm hạn mức, trừ credit, ghi
 * `usage`, `Idempotency-Key`, `NOTIFY` trong một giao dịch. Worker Python
 * (`process_variant_job`) gọi nhà cung cấp để sinh HẬU CẢNH trống, dán nguyên
 * khối chủ thể đã tách từ Master Image, đo Subject Integrity thật; nhà cung
 * cấp lỗi (thiếu khoá, 402/403/429) thì lùi về phông Studio cục bộ của preset
 * và ghi rõ `cloud_fallback` vào asset + sự kiện job.
 *
 * Cùng cổng Master đã duyệt như nhánh local — nhánh Cloud cũ không có cổng này.
 */
export async function requestCloudVariant(ctx: TenantContext, input: RequestCloudVariantInput) {
  const master = await new AssetRepository().findById(ctx, input.masterAssetId)
  if (!master) throw notFound()

  if (!isEligibleMasterForVariants(master)) {
    throw conflict(
      "Biến thể marketing chỉ dựng được trên Master Image đã duyệt (cổng 2, media.approve)"
    )
  }

  const scenePrompt = (input.scenePrompt ?? "").trim().slice(0, MAX_SCENE_PROMPT_LENGTH)

  return enqueueJob(ctx, {
    feature: MEDIA_VARIANT_CLOUD_FEATURE,
    productId: master.product_id,
    payload: {
      master_asset_id: input.masterAssetId,
      preset: input.preset,
      ratio: input.ratio,
      watermark: input.watermark,
      auto_enhance: input.autoEnhance ?? false,
      provider: input.provider,
      ...(scenePrompt ? { scene_prompt: scenePrompt } : {}),
      ...(input.sceneIndex ? { scene_index: input.sceneIndex } : {}),
      ...(input.scenePlanId ? { scene_plan_id: input.scenePlanId } : {}),
      ...(input.scenePlanRevision ? { scene_plan_revision: input.scenePlanRevision } : {}),
      ...(await directionPayload(ctx, input)),
    },
    idempotencyKey: input.idempotencyKey,
  })
}

export type RequestVariantBatchInput = {
  masterAssetId: string
  /** Bỏ trống = toàn bộ ma trận 24 tổ hợp (`ALL_VARIANT_COMBINATIONS`). */
  combinations?: readonly VariantCombination[]
  watermark: boolean
  autoEnhance?: boolean
  /** Khoá gốc của CẢ lượt gọi — mỗi job trong lô có khoá riêng dẫn xuất từ
   *  khoá này (`variantBatchIdempotencyKey`), không dùng thẳng. */
  idempotencyKey: string
}

export type RequestVariantBatchJobResult = {
  preset: VariantPresetId
  ratio: VariantRatio
  jobId: string
  status: string
  deduped: boolean
  costCredit: number
}

export type RequestVariantBatchResult = {
  jobGroupId: string
  jobs: RequestVariantBatchJobResult[]
}

/**
 * `POST /media/variants/batch` (`I4`) — chạy lô nhiều tổ hợp preset×ratio
 * trong MỘT lượt gọi (nợ #108, AIC-17 mở rộng).
 *
 * KHÔNG phải một đường job/hạn mức mới: mỗi tổ hợp vẫn đi qua nguyên
 * `enqueueJob` — vẫn `Idempotency-Key` riêng (dẫn xuất từ khoá gốc, xem
 * `variantBatchIdempotencyKey`), vẫn trừ credit riêng từng job (chốt 18/09:
 * "Tính như hiện tại", không giảm giá theo lô). `job_group_id` là thứ DUY
 * NHẤT lô này thêm — một khoá gom màn tiến độ, không phải khoá nghiệp vụ.
 *
 * Từng job gọi TUẦN TỰ (không `Promise.all`): mỗi lượt `enqueueJob` tự mở
 * giao dịch riêng (kiểm hạn mức + trừ credit + tạo job), chạy song song 24
 * giao dịch cùng lúc trên cùng một tổ chức chỉ để tranh khoá, không nhanh
 * hơn được bao nhiêu. Một tổ hợp lỗi (hết credit/hạn mức) sẽ NÉM lỗi ra
 * ngoài — các job đã tạo trước đó ở lô này đã commit xong, vẫn đứng, xem
 * được qua `job_group_id`; đây là hệ quả tất yếu của "mỗi job một giao dịch
 * riêng", không phải một lỗi cần vá.
 */
export async function requestVariantBatch(
  ctx: TenantContext,
  input: RequestVariantBatchInput
): Promise<RequestVariantBatchResult> {
  const master = await new AssetRepository().findById(ctx, input.masterAssetId)
  if (!master) throw notFound()

  if (!isEligibleMasterForVariants(master)) {
    throw conflict(
      "Biến thể marketing chỉ dựng được trên Master Image đã duyệt (cổng 2, media.approve)"
    )
  }

  const combinations = input.combinations ?? ALL_VARIANT_COMBINATIONS
  const jobGroupId = randomUUID()
  const jobs: RequestVariantBatchJobResult[] = []

  for (const combo of combinations) {
    const result = await enqueueJob(ctx, {
      feature: MEDIA_VARIANT_FEATURE,
      productId: master.product_id,
      payload: {
        master_asset_id: input.masterAssetId,
        preset: combo.preset,
        ratio: combo.ratio,
        watermark: input.watermark,
        auto_enhance: input.autoEnhance ?? false,
      },
      idempotencyKey: variantBatchIdempotencyKey(input.idempotencyKey, combo),
      jobGroupId,
    })
    jobs.push({
      preset: combo.preset,
      ratio: combo.ratio,
      jobId: result.job.id,
      status: result.job.status,
      deduped: result.deduped,
      costCredit: result.usage.costCredit,
    })
  }

  return { jobGroupId, jobs }
}
