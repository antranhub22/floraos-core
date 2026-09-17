import { z } from "zod"
import { handle, jsonResponse } from "@/core/http/response"
import { validationFailed } from "@/core/http/errors"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { listChatChannels } from "@/modules/chat-assistant/use-cases/list-chat-channels"
import { configureChatChannel } from "@/modules/chat-assistant/use-cases/configure-chat-channel"
import type { SupportedChatChannel } from "@/modules/chat-assistant/domain/channel-integration-types"

const configureSchema = z.object({
  channel: z.enum([
    "INTERNAL_DASHBOARD",
    "STOREFRONT_CATALOG",
    "LANDING_PAGE",
    "FACEBOOK_MESSENGER",
    "ZALO_OA",
    "EMBEDDED_WIDGET",
  ]),
  isEnabled: z.boolean(),
  config: z
    .object({
      welcomeMessage: z.string().optional(),
      avatarUrl: z.string().optional(),
      botName: z.string().optional(),
      fbPageId: z.string().optional(),
      fbPageAccessToken: z.string().optional(),
      fbVerifyToken: z.string().optional(),
      zaloOaId: z.string().optional(),
      zaloAppId: z.string().optional(),
      zaloSecretKey: z.string().optional(),
      zaloAccessToken: z.string().optional(),
      zaloRefreshToken: z.string().optional(),
      embedAllowedOrigins: z.array(z.string()).optional(),
    })
    .optional(),
})

export const GET = handle(async (req) => {
  const { ctx } = await requireTenantContext(req)
  const channels = await listChatChannels(ctx)
  return jsonResponse({ channels })
})

export const POST = handle(async (req) => {
  const { ctx } = await requireTenantContext(req)
  const body = await req.json().catch(() => null)
  const parsed = configureSchema.safeParse(body)
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues })
  }

  const result = await configureChatChannel(ctx, {
    channel: parsed.data.channel as SupportedChatChannel,
    isEnabled: parsed.data.isEnabled,
    config: parsed.data.config,
  })

  return jsonResponse({ channel: result }, { status: 200 })
})
