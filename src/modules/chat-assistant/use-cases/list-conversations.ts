/**
 * Use-case: List Conversations.
 */

import type { TenantContext } from "@/core/tenancy/tenant-context"
import type { ChatConversation } from "../domain/chat-types"
import { ChatRepository } from "../infra/chat-repository"

export async function listConversations(
  ctx: TenantContext,
  status = "ACTIVE",
  limit = 50,
  repo: ChatRepository = new ChatRepository()
): Promise<ChatConversation[]> {
  return repo.listConversations(ctx, status, limit)
}
