import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { PaymentProofRepository } from "../infra/payment-proof-repository"
import { callCapability } from "@/core/ai/gateway"
import { aiGatewayDeps } from "@/core/ai/wiring"
import { createContentLLM } from "@/core/ai/adapters/multi-llm-provider"
import { createPaymentProofVisionAdapter } from "../adapters/payment-proof-vision-adapter"
import {
  verifyBillAgainstOrder,
  markDuplicateBill,
  type PaymentProofAnalysisResult,
  type PaymentProofExtraction,
} from "../domain/payment-proof-analysis"
import { parseBrochurePaymentConfig } from "../domain/brochure-commerce-rules"
import { parsePaymentPolicy } from "../domain/brochure-payment-policy"
import { proofExpectedAmountVnd } from "../domain/payment-plan"
import type { TenantContext } from "@/core/tenancy"
import { log } from "@/core/observability/log"

export interface ProcessPaymentProofInput {
  assetId: string
  organizationId: string
  sendCode: string
  purpose: "DEPOSIT" | "BALANCE"
}

/**
 * Xử lý ngầm (Background Job): Bóc tách thông tin chuyển khoản từ ảnh bill qua AI Vision
 * và thẩm định đối soát so với tài khoản tiệm và số tiền đơn hàng.
 * Tuân thủ Clean Architecture: chỉ truy vấn dữ liệu thông qua Repository.
 */
export async function processPaymentProofVisionJob(
  input: ProcessPaymentProofInput,
  repo = new GreetingCardRepository(),
  proofs = new PaymentProofRepository()
): Promise<PaymentProofAnalysisResult | null> {
  const { assetId, organizationId, sendCode, purpose } = input

  try {
    // 1. Tải thông tin Session, Order và Cấu hình ngân hàng của Tiệm qua Repo
    const session = await repo.findSessionForVerification(organizationId, sendCode)

    if (!session || !session.order) {
      return null
    }

    // Tiệm chưa bật "AI đọc bill" (mặc định) → không gọi AI, không tốn token; Điều hành duyệt tay
    if (parsePaymentPolicy(session.organization.settings).aiReadPaymentProof !== true) return null

    const shopBank = parseBrochurePaymentConfig(session.organization.settings)
    const order = session.order

    // Số tiền cần thấy trên bill: cùng công thức máy chủ ghi sổ (cọc làm tròn lên nghìn; đơn cũ theo % tiệm)
    const expectedAmountVnd = proofExpectedAmountVnd(
      purpose,
      { totalVnd: Number(order.total_vnd), balanceVnd: Number(order.balance_vnd), pricingRuleRef: order.pricing_rule_ref },
      parsePaymentPolicy(session.organization.settings).depositPercent,
    )

    // 2. Lấy dữ liệu ảnh từ storage qua Repo
    const asset = await repo.findAssetForVerification(organizationId, assetId)

    if (!asset) return null

    const storage = getStorageProvider()
    const bytes = await storage.get(asset.storage_key)
    const base64 = Buffer.from(bytes).toString("base64")
    const mimeType = asset.mime_type || "image/jpeg"

    // 3. Khởi tạo TenantContext chuẩn theo kiến trúc FloraOS
    const ctx: TenantContext = {
      organizationId,
      workspaceId: organizationId,
      userId: session.sale_id || "system",
      branchId: null,
      capabilities: new Set(["ai.generate"]),
    }

    let extracted: PaymentProofExtraction | null = null

    try {
      const aiResult = await callCapability(
        {
          capability: "content_generation",
          // PO 14/10/2026: tiệm tự bật thì cho GPT-4o (OpenAI) đọc bill — dữ liệu bill rời hạ tầng,
          // nên chỉ chạy khi công tắc bật; mức SHOP, ghim đúng mô hình GPT-4o (đọc ảnh tốt nhất hiện có).
          privacy: "SHOP",
          pinnedModelKey: "openai_structured",
          entity: { type: "payment_proof_analysis", id: assetId },
        },
        createPaymentProofVisionAdapter(
          createContentLLM(),
          { image: { mimeType, base64 } },
          organizationId
        ),
        aiGatewayDeps(ctx)
      )

      if (aiResult.kind === "xong") {
        extracted = aiResult.output
      } else {
        // Trước đây im lặng → không ai biết AI đọc bill hỏng (PO 15/10/2026)
        log.warn("greeting_card.payment_proof_ai_not_done", { organizationId, feature: "greeting-card", assetId, kind: aiResult.kind })
      }
    } catch (error) {
      // Nếu gọi AI thất bại (vd thiếu khoá, môi trường offline), ghi nhận không đọc được
      log.warn("greeting_card.payment_proof_ai_failed", {
        organizationId, feature: "greeting-card", assetId, message: error instanceof Error ? error.message : String(error),
      })
      extracted = null
    }

    let analysis: PaymentProofAnalysisResult

    if (!extracted) {
      analysis = {
        status: "UNREADABLE",
        extracted: {
          amountVnd: 0,
          isSuccessStatus: false,
          notes: "Không thể phân tích ảnh qua AI",
        },
        expectedAmountVnd,
        amountDifferenceVnd: -expectedAmountVnd,
        confidenceScore: 0,
        reasons: ["Không thể tự động đọc thông tin từ ảnh bill"],
        analyzedAt: new Date().toISOString(),
      }
    } else {
      const duplicate = extracted.transactionCode
        ? await proofs.transactionCodeUsedElsewhere(organizationId, extracted.transactionCode, assetId)
        : false
      analysis = markDuplicateBill(verifyBillAgainstOrder({ extracted, expectedAmountVnd, shopBank }), duplicate)
    }

    // 4. Lưu kết quả phân tích vào Asset Metadata
    const currentMeta = (asset.metadata as Record<string, unknown>) || {}
    await repo.updateAssetMetadata(organizationId, assetId, {
      ...currentMeta,
      ai_analysis: analysis,
    })

    return analysis
  } catch (error) {
    // Không ném lỗi ra ngoài làm hỏng luồng gọi — nhưng phải để lại dấu vết
    log.warn("greeting_card.payment_proof_job_failed", {
      organizationId, feature: "greeting-card", assetId, message: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
