import type { InputJsonValue, approval_state, asset_kind, asset_state, assets } from "./entities"

import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy"

import type { DbClient } from "./db-client"

export type CreateAssetInput = {
  /** Đã cấp sẵn ở `create-upload-url.ts` để khớp với `storage_key`. */
  id: string
  productId: string | null
  parentAssetId: string | null
  kind: asset_kind
  version: number
  storageKey: string
  thumbKey?: string | null
  mimeType: string
  width?: number | null
  height?: number | null
  aspectRatio?: string | null
  fileSize?: number | null
  provider?: string | null
  model?: string | null
  modelVersion?: string | null
  pipelineVersion?: string | null
  parameters?: Record<string, unknown> | null
  prompt?: string | null
  inputSha256?: string | null
  outputSha256?: string | null
  qualityScore?: number | null
  identityScore?: number | null
  generatedFlags?: Record<string, unknown> | null
  costUsd?: number | null
  metadata?: Record<string, unknown> | null
  createdBy: string
}

export class AssetRepository {
  constructor(private readonly db: DbClient = prisma) {}

  findById(ctx: TenantContext, id: string): Promise<assets | null> {
    return this.db.assets.findFirst({ where: scopedWhere(ctx, { id }) })
  }

  list(
    ctx: TenantContext,
    options: {
      productId?: string | undefined
      kind?: asset_kind | undefined
      limit: number
      cursor?: string | null
    }
  ): Promise<assets[]> {
    return this.db.assets.findMany({
      where: scopedWhere(ctx, {
        ...(options.productId ? { product_id: options.productId } : {}),
        ...(options.kind ? { kind: options.kind } : {}),
      }),
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: options.limit,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    })
  }

  create(ctx: TenantContext, input: CreateAssetInput): Promise<assets> {
    return this.db.assets.create({
      data: scopedData(ctx, {
        id: input.id,
        product_id: input.productId,
        parent_asset_id: input.parentAssetId,
        kind: input.kind,
        state: "READY" as asset_state,
        version: input.version,
        storage_key: input.storageKey,
        thumb_key: input.thumbKey ?? null,
        mime_type: input.mimeType,
        width: input.width ?? null,
        height: input.height ?? null,
        aspect_ratio: input.aspectRatio ?? null,
        file_size: input.fileSize ?? null,
        provider: input.provider ?? null,
        model: input.model ?? null,
        model_version: input.modelVersion ?? null,
        pipeline_version: input.pipelineVersion ?? null,
        parameters: (input.parameters ?? null) as InputJsonValue,
        prompt: input.prompt ?? null,
        input_sha256: input.inputSha256 ?? null,
        output_sha256: input.outputSha256 ?? null,
        quality_score: input.qualityScore ?? null,
        identity_score: input.identityScore ?? null,
        generated_flags: (input.generatedFlags ?? null) as InputJsonValue,
        cost_usd: input.costUsd ?? null,
        metadata: (input.metadata ?? null) as InputJsonValue,
        created_by: input.createdBy,
      }),
    })
  }

  /**
   * Xoá — `updateMany`-style đếm dòng qua `deleteMany` với điều kiện tổ
   * chức, không qua `delete` theo khoá chính, cùng lý do như
   * `BranchRepository.update` (`YC-T4`).
   */
  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    const result = await this.db.assets.deleteMany({ where: scopedWhere(ctx, { id }) })
    return result.count > 0
  }

  /**
   * Master Image do MỘT job M04a sinh ra. `assets` không có cột `job_id`
   * (đặc tả 07 mục 5 không khai), nên worker ghi `job_id` vào `metadata` và
   * chỗ này lọc theo đường JSON đó — vẫn đi qua `scopedWhere` nên bộ gác tổ
   * chức không hở.
   */
  findMasterByJobId(ctx: TenantContext, jobId: string): Promise<assets | null> {
    return this.db.assets.findFirst({
      where: scopedWhere(ctx, {
        kind: "MASTER" as asset_kind,
        metadata: { path: ["job_id"], equals: jobId },
      }),
      orderBy: { created_at: "desc" },
    })
  }

  /**
   * Cổng 2 — Review & Approve (`media.approve`/`I2`, P9). Đây là đường DUY
   * NHẤT đặt `approval_state = APPROVED` cho một asset, và là chỗ trả nợ #30:
   * trước P9 không có đường nào nên `GET /integration/products/:id/master-image`
   * luôn trả 404.
   *
   * `updateMany` + điều kiện `approval_state: PENDING` ngay trong `where` là
   * chốt chặn đua: hai người bấm duyệt cùng lúc chỉ một người thắng, người
   * kia thấy `count === 0` và nhận 409 thay vì ghi đè `approved_by` của
   * người trước.
   */
  async approve(
    ctx: TenantContext,
    id: string,
    input: { approvedBy: string; approvedAt: Date }
  ): Promise<assets | null> {
    const result = await this.db.assets.updateMany({
      where: scopedWhere(ctx, { id, approval_state: "PENDING" as approval_state }),
      data: {
        approval_state: "APPROVED" as approval_state,
        approved_by: input.approvedBy,
        approved_at: input.approvedAt,
      },
    })
    if (result.count === 0) return null
    return this.findById(ctx, id)
  }

  /**
   * Master Image mới nhất đã DUYỆT của một sản phẩm — P7,
   * `GET /integration/products/:id/master-image` (đặc tả 08 mục 4: "Chỉ ảnh
   * approval_state = APPROVED").
   *
   * **Sửa 09/10 (P9):** bản P7 còn một điều kiện `parent_asset_id: null`,
   * viết với giả định "Master là asset gốc, các bản dẫn xuất (ratio Smart
   * Reframe) mới có cha". Giả định đó SAI khi P9 dựng xong đường tạo Master
   * thật: Master do M04a sinh ra LUÔN có cha là ảnh `ORIGINAL` mà nó được
   * tăng cường từ đó — đúng `YC-A1`/`YC-A2`/`YC-A3` ("asset gốc không bao
   * giờ bị ghi đè", phả hệ qua `parent_asset_id`). Điều kiện cũ khiến hàm
   * này KHÔNG BAO GIỜ tìm thấy gì, kể cả sau khi ảnh đã được duyệt.
   *
   * Bản dẫn xuất theo tỉ lệ vẫn bị loại, nhưng bằng `kind`: chúng là
   * `MARKETING`/`CATALOG`/`SOCIAL`… chứ không phải `MASTER`. Lọc theo vai
   * trò đúng hơn lọc theo phả hệ — một asset có cha không nói lên nó là bản
   * dẫn xuất phụ.
   *
   * Điểm lệch này chỉ lộ ra khi cả hai pha cùng tồn tại: P7 không có đường
   * nào tạo Master để thử, P9 mới có. Ca thử khoá nó gọi endpoint TRƯỚC và
   * SAU lượt duyệt trong cùng một ca (`tests/tenant/media-optimizations.test.ts`).
   */
  findApprovedMaster(ctx: TenantContext, productId: string): Promise<assets | null> {
    return this.db.assets.findFirst({
      where: scopedWhere(ctx, {
        product_id: productId,
        kind: "MASTER" as asset_kind,
        approval_state: "APPROVED" as approval_state,
      }),
      orderBy: { version: "desc" },
    })
  }

  /** Các bản dẫn xuất của một asset — "kèm các tỉ lệ" (đặc tả 06 mục 11). */
  listDerivedFrom(ctx: TenantContext, parentAssetId: string): Promise<assets[]> {
    return this.db.assets.findMany({
      where: scopedWhere(ctx, { parent_asset_id: parentAssetId }),
      orderBy: { created_at: "asc" },
    })
  }
}
