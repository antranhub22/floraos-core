import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { registerAsset } from "@/modules/assets/use-cases/register-asset"
import { listAssets } from "@/modules/assets/use-cases/list-assets"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

const ASSET_KINDS = [
  "ORIGINAL",
  "ANALYZED",
  "ENHANCED",
  "MASTER",
  "MARKETING",
  "CATALOG",
  "LANDING",
  "SOCIAL",
] as const

const schema = z.object({
  asset_id: z.string().min(1),
  product_id: z.string().nullish(),
  parent_asset_id: z.string().nullish(),
  kind: z.enum(ASSET_KINDS),
  storage_key: z.string().min(1),
  mime_type: z.string().min(1),
  width: z.number().int().positive().nullish(),
  height: z.number().int().positive().nullish(),
  aspect_ratio: z.string().nullish(),
  file_size: z.number().int().positive().nullish(),
  provider: z.string().nullish(),
  model: z.string().nullish(),
  model_version: z.string().nullish(),
  pipeline_version: z.string().nullish(),
  parameters: z.record(z.string(), z.unknown()).nullish(),
  prompt: z.string().nullish(),
  output_sha256: z.string().nullish(),
  quality_score: z.number().nullish(),
  identity_score: z.number().nullish(),
  generated_flags: z.record(z.string(), z.unknown()).nullish(),
  cost_usd: z.number().nullish(),
})

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "G1")

  const url = new URL(request.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam === null ? undefined : Number(limitParam)
  if (limit !== undefined && !Number.isInteger(limit)) {
    throw validationFailed({ limit: "Phải là số nguyên" })
  }

  const result = await listAssets(ctx, {
    productId: url.searchParams.get("product_id") ?? undefined,
    kind: url.searchParams.get("kind") ?? undefined,
    limit,
    cursor: url.searchParams.get("cursor"),
  })
  return jsonResponse(result)
})

export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "G2")

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const data = parsed.data

  const asset = await registerAsset(ctx, {
    assetId: data.asset_id,
    productId: data.product_id ?? null,
    parentAssetId: data.parent_asset_id ?? null,
    kind: data.kind,
    storageKey: data.storage_key,
    mimeType: data.mime_type,
    width: data.width ?? null,
    height: data.height ?? null,
    aspectRatio: data.aspect_ratio ?? null,
    fileSize: data.file_size ?? null,
    provider: data.provider ?? null,
    model: data.model ?? null,
    modelVersion: data.model_version ?? null,
    pipelineVersion: data.pipeline_version ?? null,
    parameters: data.parameters ?? null,
    prompt: data.prompt ?? null,
    outputSha256: data.output_sha256 ?? null,
    qualityScore: data.quality_score ?? null,
    identityScore: data.identity_score ?? null,
    generatedFlags: data.generated_flags ?? null,
    costUsd: data.cost_usd ?? null,
  })
  return jsonResponse({ asset }, { status: 201 })
})
