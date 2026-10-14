import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { callCapability } from "@/core/ai/gateway"
import { aiGatewayDeps } from "@/core/ai/wiring"
import { createContentLLM } from "@/core/ai/adapters/multi-llm-provider"
import { createPaymentProofVisionAdapter } from "../adapters/payment-proof-vision-adapter"
import {
  verifyBillAgainstOrder,
  type PaymentProofAnalysisResult,
  type PaymentProofExtraction,
} from "../domain/payment-proof-analysis"
import { parseBrochurePaymentConfig } from "../domain/brochure-commerce-rules"
import type { TenantContext } from "@/core/tenancy"

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
  repo = new GreetingCardRepository()
): Promise<PaymentProofAnalysisResult | null> {
  const { assetId, organizationId, sendCode, purpose } = input

  try {
    // 1. Tải thông tin Session, Order và Cấu hình ngân hàng của Tiệm qua Repo
    const session = await repo.findSessionForVerification(organizationId, sendCode)

    if (!session || !session.order) {
      return null
    }

    const shopBank = parseBrochurePaymentConfig(session.organization.settings)
    const order = session.order

    // Tính toán số tiền mong đợi cần thu (Cọc hay Trả đủ hay Đợt 2)
    let expectedAmountVnd = Number(order.total_vnd)
    if (purpose === "BALANCE") {
      expectedAmountVnd = Math.max(0, Number(order.balance_vnd))
    } else {
      // Đợt 1: nếu đã cọc thì là cọc, nếu trả đủ thì là toàn bộ
      const pricingRef = order.pricing_rule_ref as { paymentPlan?: { depositPercent?: number } } | null
      const depositPct = pricingRef?.paymentPlan?.depositPercent ?? 0
      if (depositPct > 0 && depositPct < 100) {
        expectedAmountVnd = Math.round((Number(order.total_vnd) * depositPct) / 100)
      }
    }

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
          // Bill chứa số tài khoản, tên và giao dịch của khách → dữ liệu cá nhân: chỉ mô hình không đưa
          // dữ liệu rời hạ tầng. Không có mô hình như vậy → UNREADABLE → Điều hành đối soát tay.
          privacy: "SENSITIVE",
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
      }
    } catch {
      // Nếu gọi AI thất bại (vd môi trường local dev/offline), ghi nhận không đọc được
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
      analysis = verifyBillAgainstOrder({
        extracted,
        expectedAmountVnd,
        shopBank,
      })
    }

    // 4. Lưu kết quả phân tích vào Asset Metadata
    const currentMeta = (asset.metadata as Record<string, unknown>) || {}
    await repo.updateAssetMetadata(organizationId, assetId, {
      ...currentMeta,
      ai_analysis: analysis,
    })

    return analysis
  } catch {
    // Không ném lỗi ra ngoài làm hỏng luồng gọi
    return null
  }
}
