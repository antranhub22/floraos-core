/**
 * Đợt 3 nâng cấp chất lượng ảnh biến thể (25/09/2026): chất lượng / tăng nét /
 * cách ghép — giá hiện trên nút = giá `enqueueJob` trừ; payload đúng tên trường;
 * hằng hai phía TS ↔ worker không lệch.
 */
import { readFileSync } from "node:fs"
import path from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TenantContext } from "@/core/tenancy"
import {
  COMPOSE_MODES,
  VARIANT_QUALITIES,
  VARIANT_UPSCALES,
} from "@/modules/media/domain/variant-direction-rules"
import {
  HIGH_QUALITY_SURCHARGE,
  renderOptionsPayload,
  variantTotalCostCredit,
  variantUnitCostCredit,
} from "@/modules/media/domain/variant-candidates"
import { costCreditForFeature } from "@/modules/usage/domain/pricing"
import { mediaVariantBodySchema } from "@/modules/creative-production/contracts/stage-06c-media"

const ROOT = path.resolve(__dirname, "../../..")

const enqueueJob = vi.fn()
const findById = vi.fn()
vi.mock("@/modules/jobs/use-cases/enqueue-job", () => ({
  enqueueJob: (...args: unknown[]) => enqueueJob(...args),
}))
vi.mock("@/modules/assets/infra/asset-repository", () => ({
  AssetRepository: vi.fn().mockImplementation(() => ({ findById })),
}))
vi.mock("@/modules/jobs/infra/generation-job-repository", () => ({
  GenerationJobRepository: vi.fn().mockImplementation(() => ({ findById: vi.fn() })),
}))
const { requestCloudVariant, requestVariants } = await import("@/modules/media/use-cases/request-variants")

const ctx = { organizationId: "org-1", userId: "u-1" } as unknown as TenantContext
const base = { masterAssetId: "m-1", preset: "wedding" as const, ratio: "9:16" as const, watermark: false, idempotencyKey: "k" }

describe("giá theo tuỳ chọn dựng ảnh", () => {
  it("mặc định = giá theo feature như trước Đợt 3", () => {
    expect(variantUnitCostCredit("local_studio")).toBe(costCreditForFeature("media.variant"))
    expect(variantUnitCostCredit("cloud_provider", { quality: "standard", upscale: "none", composeMode: "paste" })).toBe(
      costCreditForFeature("media.variant.cloud")
    )
  })

  it("quality=high chỉ tính phụ phí ở đám mây (cục bộ không có Ultra)", () => {
    expect(variantUnitCostCredit("cloud_provider", { quality: "high" })).toBe(
      costCreditForFeature("media.variant.cloud") + HIGH_QUALITY_SURCHARGE
    )
    expect(variantUnitCostCredit("local_studio", { quality: "high" })).toBe(costCreditForFeature("media.variant"))
  })

  it("nhân theo số phương án", () => {
    expect(variantTotalCostCredit("cloud_provider", 2, { quality: "high" })).toBe(
      2 * variantUnitCostCredit("cloud_provider", { quality: "high" })
    )
  })
})

describe("renderOptionsPayload", () => {
  it("chỉ gửi giá trị khác mặc định, đúng tên trường hợp đồng 06c", () => {
    expect(renderOptionsPayload({ quality: "standard", upscale: "none", composeMode: "paste" })).toEqual({})
    expect(renderOptionsPayload({ quality: "high", upscale: "2x", composeMode: "harmonize" })).toEqual({
      quality: "high",
      upscale: "2x",
      compose_mode: "harmonize",
    })
  })

  it("hợp đồng 06c có mặc định standard / none / paste", () => {
    const d = mediaVariantBodySchema.parse({ master_asset_id: "m", preset: "wedding", ratio: "9:16" })
    expect(d).toMatchObject({ quality: "standard", upscale: "none", compose_mode: "paste" })
  })
})

describe("request-variants — tuỳ chọn dựng ảnh vào payload + costCredit", () => {
  beforeEach(() => {
    enqueueJob.mockReset().mockResolvedValue({
      job: { id: "job-1", status: "PENDING" },
      deduped: false,
      usage: { costCredit: 4, balanceAfter: 10 },
    })
    findById.mockReset().mockResolvedValue({ id: "m-1", kind: "MASTER", approval_state: "APPROVED", product_id: "p-1" })
  })

  it("đám mây chất lượng cao: payload mang quality/upscale/compose_mode, costCredit đúng bảng giá", async () => {
    await requestCloudVariant(ctx, {
      ...base,
      provider: "stability",
      render: { quality: "high", upscale: "2x", composeMode: "harmonize" },
    })
    const input = enqueueJob.mock.calls[0]![1] as { costCredit: number; payload: Record<string, unknown> }
    expect(input.payload).toMatchObject({ quality: "high", upscale: "2x", compose_mode: "harmonize" })
    expect(input.costCredit).toBe(variantUnitCostCredit("cloud_provider", { quality: "high", upscale: "2x" }))
  })

  it("cục bộ mặc định: costCredit = giá feature, payload không có trường Đợt 3", async () => {
    await requestVariants(ctx, base)
    const input = enqueueJob.mock.calls[0]![1] as { costCredit: number; payload: Record<string, unknown> }
    expect(input.costCredit).toBe(costCreditForFeature("media.variant"))
    expect(input.payload.quality).toBeUndefined()
    expect(input.payload.compose_mode).toBeUndefined()
  })
})

describe("hằng TS ↔ worker Python không lệch", () => {
  const src = readFileSync(path.join(ROOT, "workers/media_ai/providers/background/base.py"), "utf8")
  const tuple = (name: string) => {
    const m = src.match(new RegExp(`^${name} = \\(([^)]*)\\)`, "m"))
    return m ? [...m[1]!.matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null
  }
  it("CHAT_LUONG / TANG_NET / CACH_GHEP", () => {
    expect(tuple("CHAT_LUONG")).toEqual([...VARIANT_QUALITIES])
    expect(tuple("TANG_NET")).toEqual([...VARIANT_UPSCALES])
    expect(tuple("CACH_GHEP")).toEqual([...COMPOSE_MODES])
  })
})
