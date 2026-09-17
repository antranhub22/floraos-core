/**
 * List Chat Channels Use Case (M08).
 * Lấy danh sách tất cả các kênh tích hợp, thông tin biểu phí và trạng thái kích hoạt hiện tại.
 */

import type { TenantContext } from "@/core/tenancy"
import { ChatChannelRepository } from "../infra/chat-channel-repository"
import {
  CHANNEL_PRICING_CATALOG,
  isChannelSubscriptionActive,
} from "../domain/channel-integration-rules"
import type {
  SupportedChatChannel,
  ChannelPricingInfo,
  ChannelConfig,
} from "../domain/channel-integration-types"

export interface ChannelStatusItem {
  channel: SupportedChatChannel
  pricing: ChannelPricingInfo
  isEnabled: boolean
  isSubscriptionActive: boolean
  subscriptionExpiresAt: string | null
  config: ChannelConfig
}

export async function listChatChannels(
  ctx: TenantContext,
  repository = new ChatChannelRepository()
): Promise<ChannelStatusItem[]> {
  const existingList = await repository.listAll(ctx)
  const existingMap = new Map(existingList.map((c) => [c.channel, c]))

  const allChannels = Object.keys(CHANNEL_PRICING_CATALOG) as SupportedChatChannel[]

  return allChannels.map((channel) => {
    const existing = existingMap.get(channel)
    const pricing = CHANNEL_PRICING_CATALOG[channel]!
    const isEnabled = existing ? existing.isEnabled : false
    const expiresAtDate = existing?.subscriptionExpiresAt
      ? new Date(existing.subscriptionExpiresAt)
      : null

    const isSubscriptionActive = isChannelSubscriptionActive(channel, isEnabled, expiresAtDate)

    return {
      channel,
      pricing,
      isEnabled,
      isSubscriptionActive,
      subscriptionExpiresAt: existing?.subscriptionExpiresAt || null,
      config: existing?.config || {},
    }
  })
}
