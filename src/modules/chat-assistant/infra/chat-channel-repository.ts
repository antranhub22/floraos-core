/**
 * Chat Channel Integration Repository (Infra).
 * Quản lý lưu trữ cấu hình kênh tích hợp, cách ly theo TenantContext.
 */

import { prisma } from "@/core/tenancy/infra/prisma"
import type { TenantContext } from "@/core/tenancy"
import type {
  ChatChannelIntegration,
  SupportedChatChannel,
  ChannelConfig,
} from "../domain/channel-integration-types"

export class ChatChannelRepository {
  async findByChannel(
    ctx: TenantContext,
    channel: SupportedChatChannel
  ): Promise<ChatChannelIntegration | null> {
    const row = await prisma.chat_channel_integrations.findUnique({
      where: {
        organization_id_channel: {
          organization_id: ctx.organizationId,
          channel: channel as any,
        },
      },
    })

    if (!row) return null
    return this.mapToDomain(row)
  }

  async listAll(ctx: TenantContext): Promise<ChatChannelIntegration[]> {
    const rows = await prisma.chat_channel_integrations.findMany({
      where: {
        organization_id: ctx.organizationId,
      },
      orderBy: { created_at: "asc" },
    })

    return rows.map((r) => this.mapToDomain(r))
  }

  async upsertChannel(
    ctx: TenantContext,
    input: {
      channel: SupportedChatChannel
      isEnabled: boolean
      config: ChannelConfig
      subscriptionExpiresAt?: Date | null
    }
  ): Promise<ChatChannelIntegration> {
    const row = await prisma.chat_channel_integrations.upsert({
      where: {
        organization_id_channel: {
          organization_id: ctx.organizationId,
          channel: input.channel as any,
        },
      },
      create: {
        organization_id: ctx.organizationId,
        channel: input.channel as any,
        is_enabled: input.isEnabled,
        config: input.config as any,
        subscription_expires_at: input.subscriptionExpiresAt ?? null,
      },
      update: {
        is_enabled: input.isEnabled,
        config: input.config as any,
        ...(input.subscriptionExpiresAt !== undefined
          ? { subscription_expires_at: input.subscriptionExpiresAt }
          : {}),
      },
    })

    return this.mapToDomain(row)
  }

  // Phương thức tra cứu phục vụ Webhook công khai từ Facebook Messenger
  async findActiveByFbPageId(fbPageId: string): Promise<ChatChannelIntegration | null> {
    const rows = await prisma.chat_channel_integrations.findMany({
      where: {
        channel: "FACEBOOK_MESSENGER",
        is_enabled: true,
      },
    })

    const found = rows.find((r) => {
      const cfg = (r.config as any) || {}
      return cfg.fbPageId === fbPageId
    })

    return found ? this.mapToDomain(found) : null
  }

  // Phương thức tra cứu phục vụ Webhook công khai từ Zalo OA
  async findActiveByZaloOaId(zaloOaId: string): Promise<ChatChannelIntegration | null> {
    const rows = await prisma.chat_channel_integrations.findMany({
      where: {
        channel: "ZALO_OA",
        is_enabled: true,
      },
    })

    const found = rows.find((r) => {
      const cfg = (r.config as any) || {}
      return cfg.zaloOaId === zaloOaId
    })

    return found ? this.mapToDomain(found) : null
  }

  async getChannelConfigForOrg(
    organizationId: string,
    channel: SupportedChatChannel
  ): Promise<ChatChannelIntegration | null> {
    const row = await prisma.chat_channel_integrations.findUnique({
      where: {
        organization_id_channel: {
          organization_id: organizationId,
          channel: channel as any,
        },
      },
    })
    return row ? this.mapToDomain(row) : null
  }

  async checkAndDeductUsageCredit(
    organizationId: string,
    costCredit: number,
    channel: SupportedChatChannel,
    senderId: string
  ): Promise<boolean> {
    const org = await prisma.organizations.findUnique({
      where: { id: organizationId },
      select: { credit_balance: true },
    })

    if (!org || org.credit_balance < costCredit) return false

    await prisma.organizations.update({
      where: { id: organizationId },
      data: { credit_balance: { decrement: costCredit } },
    })

    await prisma.usage.create({
      data: {
        organization_id: organizationId,
        workspace_id: "system",
        user_id: "customer",
        feature: "chat.message.ai_reply",
        cost_credit: costCredit,
        status: "COMPLETED",
        metadata: {
          channel,
          senderId,
        },
      },
    })

    return true
  }

  async findOrCreateChannelConversation(
    organizationId: string,
    channel: SupportedChatChannel,
    externalSenderId: string
  ): Promise<string> {
    let conversation = await prisma.chat_conversations.findFirst({
      where: {
        organization_id: organizationId,
        channel: channel as any,
        title: `Khách: ${externalSenderId}`,
        status: "ACTIVE",
      },
    })

    if (!conversation) {
      conversation = await prisma.chat_conversations.create({
        data: {
          organization_id: organizationId,
          channel: channel as any,
          title: `Khách: ${externalSenderId}`,
          status: "ACTIVE",
        },
      })
    }

    return conversation.id
  }

  async saveChannelMessage(
    organizationId: string,
    conversationId: string,
    senderType: "USER" | "ASSISTANT",
    content: string,
    metadata?: Record<string, unknown> | undefined
  ): Promise<void> {
    await prisma.chat_messages.create({
      data: {
        organization_id: organizationId,
        conversation_id: conversationId,
        sender_type: senderType,
        content,
        metadata: (metadata as any) ?? undefined,
      },
    })
  }

  private mapToDomain(row: any): ChatChannelIntegration {
    return {
      id: row.id,
      organizationId: row.organization_id,
      channel: row.channel as SupportedChatChannel,
      isEnabled: row.is_enabled,
      config: (row.config as ChannelConfig) || {},
      subscriptionExpiresAt: row.subscription_expires_at
        ? new Date(row.subscription_expires_at).toISOString()
        : null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }
  }
}
