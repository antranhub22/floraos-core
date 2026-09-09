import type { asset_kind, asset_state, assets } from "./entities"

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
    options: { productId?: string | undefined; limit: number; cursor?: string | null }
  ): Promise<assets[]> {
    return this.db.assets.findMany({
      where: scopedWhere(ctx, options.productId ? { product_id: options.productId } : {}),
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
        parameters: (input.parameters ?? null) as never,
        prompt: input.prompt ?? null,
        input_sha256: input.inputSha256 ?? null,
        output_sha256: input.outputSha256 ?? null,
        quality_score: input.qualityScore ?? null,
        identity_score: input.identityScore ?? null,
        generated_flags: (input.generatedFlags ?? null) as never,
        cost_usd: input.costUsd ?? null,
        metadata: (input.metadata ?? null) as never,
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
}
