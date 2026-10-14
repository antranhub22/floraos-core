import { describe, it, expect, vi } from "vitest"

const callCapability = vi.fn().mockResolvedValue({ kind: "loi" })
vi.mock("@/core/ai/gateway", () => ({ callCapability: (...args: unknown[]) => callCapability(...args) }))
vi.mock("@/core/ai/wiring", () => ({ aiGatewayDeps: () => ({}) }))
vi.mock("@/core/ai/adapters/multi-llm-provider", () => ({ createContentLLM: () => ({}) }))
vi.mock("@/modules/assets/adapters/storage-provider-factory", () => ({
  getStorageProvider: () => ({ get: vi.fn().mockResolvedValue(new Uint8Array([0xff, 0xd8, 0xff])) }),
}))

import { processPaymentProofVisionJob } from "../process-payment-proof-job"
import type { GreetingCardRepository } from "../../infra/greeting-card-repository"
import type { PaymentProofRepository } from "../../infra/payment-proof-repository"

/** Ảnh bill chứa dữ liệu tài chính cá nhân của khách → luôn gọi AI ở mức SENSITIVE, chỉ đọc/ghi ảnh của đúng tiệm. */
describe("processPaymentProofVisionJob", () => {
  it("gọi AI với sàn SENSITIVE; AI không chạy được → UNREADABLE để Điều hành duyệt tay", async () => {
    const repo = {
      findSessionForVerification: vi.fn().mockResolvedValue({
        sale_id: null,
        order: { total_vnd: 1_000_000, balance_vnd: 1_000_000, pricing_rule_ref: null },
        organization: { settings: {} },
      }),
      findAssetForVerification: vi.fn().mockResolvedValue({ storage_key: "k", mime_type: "image/jpeg", metadata: {} }),
      updateAssetMetadata: vi.fn().mockResolvedValue({ count: 1 }),
    } as unknown as GreetingCardRepository

    const res = await processPaymentProofVisionJob({ assetId: "a1", organizationId: "org-1", sendCode: "T01-001", purpose: "DEPOSIT" }, repo)

    expect(callCapability.mock.calls[0]?.[0]).toMatchObject({ privacy: "SENSITIVE" })
    expect(repo.findAssetForVerification).toHaveBeenCalledWith("org-1", "a1")
    expect(repo.updateAssetMetadata).toHaveBeenCalledWith("org-1", "a1", expect.objectContaining({ ai_analysis: expect.objectContaining({ status: "UNREADABLE" }) }))
    expect(res?.status).toBe("UNREADABLE")
  })

  it("bill khớp nhưng mã giao dịch đã dùng cho ảnh khác → SUSPICIOUS (không tự duyệt)", async () => {
    callCapability.mockResolvedValueOnce({
      kind: "xong",
      output: { amountVnd: 1_000_000, isSuccessStatus: true, receiverAccountNumber: "0123456789", transactionCode: "FT999" },
    })
    const repo = {
      findSessionForVerification: vi.fn().mockResolvedValue({
        sale_id: null,
        order: { total_vnd: 1_000_000, balance_vnd: 1_000_000, pricing_rule_ref: null },
        organization: { settings: { brochure_payment: { bankId: "VCB", accountNo: "0123456789", accountName: "TIEM HOA" } } },
      }),
      findAssetForVerification: vi.fn().mockResolvedValue({ storage_key: "k", mime_type: "image/jpeg", metadata: {} }),
      updateAssetMetadata: vi.fn().mockResolvedValue({ count: 1 }),
    } as unknown as GreetingCardRepository
    const proofs = { transactionCodeUsedElsewhere: vi.fn().mockResolvedValue(true) } as unknown as PaymentProofRepository

    const res = await processPaymentProofVisionJob({ assetId: "a2", organizationId: "org-1", sendCode: "T01-001", purpose: "DEPOSIT" }, repo, proofs)

    expect(proofs.transactionCodeUsedElsewhere).toHaveBeenCalledWith("org-1", "FT999", "a2")
    expect(res?.status).toBe("SUSPICIOUS")
  })
})
