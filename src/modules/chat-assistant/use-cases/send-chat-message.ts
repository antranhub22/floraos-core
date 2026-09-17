/**
 * Use-case: Send Chat Message (Gửi tin nhắn và nhận phản hồi AI tư vấn hoa).
 * Tích hợp sâu với Product Master Index & Customer Master Index (SSOT).
 */

import { notFound, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import { listProductMasterIndex } from "@/modules/products/use-cases/get-product-master-index"
import { getCustomerMasterIndex } from "@/modules/crm/use-cases/get-customer-master-index"
import type { ChatMessage } from "../domain/chat-types"
import { ChatRepository } from "../infra/chat-repository"
import { DifyChatProvider } from "../adapters/dify-chat-provider"

export async function sendChatMessage(
  ctx: TenantContext,
  conversationId: string,
  query: string,
  repo: ChatRepository = new ChatRepository(),
  provider: DifyChatProvider = new DifyChatProvider()
): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
  if (!query.trim()) {
    throw validationFailed({ query: "Nội dung tin nhắn không được để trống" })
  }

  const conversation = await repo.getConversation(ctx, conversationId)
  if (!conversation) {
    throw notFound()
  }

  // 1. Lưu tin nhắn người dùng
  const userMessage = await repo.addMessage(ctx, conversationId, "USER", query)

  // 2. Nạp ngữ cảnh từ Master Index (SSOT)
  const masterProducts = await listProductMasterIndex(ctx, 30)
  let customer = null
  if (conversation.customerId) {
    try {
      customer = await getCustomerMasterIndex(ctx, conversation.customerId)
    } catch {
      // Khách vãng lai hoặc không tìm thấy
    }
  }

  // 3. Gọi Dify AI Chat Provider
  const aiOutput = await provider.send({
    query,
    conversationId,
    customer,
    masterProducts,
  })

  // 4. Lưu phản hồi của AI cùng danh sách mẫu hoa gợi ý từ Master Index hoặc thông tin hướng dẫn SaaS
  const assistantMessage = await repo.addMessage(
    ctx,
    conversationId,
    "ASSISTANT",
    aiOutput.replyText,
    {
      suggestedFlowers: aiOutput.suggestedFlowers,
      userIntent: aiOutput.userIntent,
      targetRoute: aiOutput.targetRoute,
      actionLabel: aiOutput.actionLabel,
      actionSteps: aiOutput.actionSteps,
    }
  )

  return { userMessage, assistantMessage }
}
