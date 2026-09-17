/**
 * GET|POST /api/v1/chat/conversations/[id]/messages
 * T1: Xem tin nhắn trong cuộc hội thoại
 * T2: Gửi tin nhắn và nhận phản hồi AI tư vấn hoa
 */

import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getConversationMessages } from "@/modules/chat-assistant/use-cases/get-conversation-messages"
import { sendChatMessage } from "@/modules/chat-assistant/use-cases/send-chat-message"

export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "T1")

  const { id } = await context.params
  const messages = await getConversationMessages(ctx, id)
  return jsonResponse({ messages })
})

export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "T2")

  const { id } = await context.params
  const body = await request.json()
  const result = await sendChatMessage(ctx, id, body.query || body.content || "")
  return jsonResponse(result)
})
