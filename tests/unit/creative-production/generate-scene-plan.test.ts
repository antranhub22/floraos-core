import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TenantContext } from "@/core/tenancy"

const ctx: TenantContext = {
  organizationId: "org-1",
  workspaceId: "ws-1",
  userId: "user-1",
  branchId: null,
  capabilities: new Set(["I1"]),
}

const startInline = vi.fn()
const finishInline = vi.fn()
vi.mock("@/modules/jobs/infra/generation-job-repository", () => ({
  GenerationJobRepository: vi.fn().mockImplementation(() => ({ startInline, finishInline })),
}))
vi.mock("@/modules/jobs/use-cases/enqueue-job", () => ({ enqueueJob: vi.fn() }))
vi.mock("@/modules/usage/use-cases/refund-job", () => ({ refundJob: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/core/ai/gateway", () => ({ callCapability: vi.fn() }))
vi.mock("@/core/ai/wiring", () => ({ aiGatewayDeps: vi.fn() }))
vi.mock("@/core/ai/adapters/openai-llm-provider", () => ({ OpenAILLMProvider: vi.fn() }))

import { callCapability } from "@/core/ai/gateway"
import { enqueueJob } from "@/modules/jobs/use-cases/enqueue-job"
import { refundJob } from "@/modules/usage/use-cases/refund-job"
import { generateScenePlan } from "@/modules/creative-production/use-cases/generate-scene-plan"
import { buildRuleScenePlan, type ScenePlanInput } from "@/modules/creative-production/domain/scene-plan-rules"

const brief: ScenePlanInput = {
  mode: "AUTHENTIC",
  productName: "Bó hoa",
  colors: [],
  components: [],
  occasions: [],
  topic: { id: "t-1", title: "Bó hoa sinh nhật tone vàng" },
}
const plan = { ...buildRuleScenePlan(brief), source: "ai" as const }
const job = { id: "job-1", status: "PENDING", error: null, output: null }

describe("generateScenePlan", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(refundJob).mockResolvedValue(undefined as never)
  })

  it("chạy qua enqueueJob + cổng AI (AIC-18) và ghi kịch bản vào output của job", async () => {
    vi.mocked(enqueueJob).mockResolvedValue({ job, deduped: false, usage: { costCredit: 1, balanceAfter: 9 } } as never)
    vi.mocked(callCapability).mockResolvedValue({ kind: "xong", output: plan } as never)

    const r = await generateScenePlan(ctx, { brief, idempotencyKey: "k" })

    expect(vi.mocked(enqueueJob).mock.calls[0]![1]).toMatchObject({ feature: "creative.scene_plan", idempotencyKey: "k" })
    expect(vi.mocked(callCapability).mock.calls[0]![0]).toMatchObject({ capability: "video_storyboard", jobId: "job-1" })
    expect(finishInline).toHaveBeenCalledWith(ctx, "job-1", expect.objectContaining({ ok: true, output: plan }))
    expect(r).toMatchObject({ status: "COMPLETED", deduped: false, plan })
  })

  it("trùng khoá: trả kịch bản cũ, không gọi mô hình", async () => {
    vi.mocked(enqueueJob).mockResolvedValue({
      job: { ...job, status: "COMPLETED", output: plan },
      deduped: true,
      usage: { costCredit: 0, balanceAfter: null },
    } as never)
    const r = await generateScenePlan(ctx, { brief, idempotencyKey: "k" })
    expect(callCapability).not.toHaveBeenCalled()
    expect(r.plan?.scenes).toHaveLength(3)
    expect(r.deduped).toBe(true)
  })

  it("AI hỏng: job FAILED và hoàn credit", async () => {
    vi.mocked(enqueueJob).mockResolvedValue({ job, deduped: false, usage: { costCredit: 1, balanceAfter: 9 } } as never)
    vi.mocked(callCapability).mockResolvedValue({ kind: "khong_chay_duoc", reason: "KHONG_CO_MO_HINH_DU_DIEU_KIEN" } as never)
    await expect(generateScenePlan(ctx, { brief, idempotencyKey: "k" })).rejects.toThrow(/hoàn credit/)
    expect(finishInline).toHaveBeenCalledWith(ctx, "job-1", expect.objectContaining({ ok: false }))
    expect(refundJob).toHaveBeenCalledWith(ctx, "job-1")
  })

  it("thiếu năng lực I1 thì từ chối trước khi tạo job", async () => {
    await expect(
      generateScenePlan({ ...ctx, capabilities: new Set() }, { brief, idempotencyKey: "k" })
    ).rejects.toThrow()
    expect(enqueueJob).not.toHaveBeenCalled()
  })
})
