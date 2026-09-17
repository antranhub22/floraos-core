import { NextRequest, NextResponse } from "next/server"
import { ChatChannelRepository } from "@/modules/chat-assistant/infra/chat-channel-repository"
import { handleIncomingChannelMessage } from "@/modules/chat-assistant/use-cases/handle-incoming-channel-message"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const eventName = body.event_name
    const oaId = body.oa_id
    const senderId = body.sender?.id || body.user_id_by_app
    const messageText = body.message?.text

    if (eventName === "user_send_text" && oaId && senderId && messageText) {
      const channelRepo = new ChatChannelRepository()
      const channelIntegration = await channelRepo.findActiveByZaloOaId(oaId)

      if (channelIntegration) {
        const result = await handleIncomingChannelMessage({
          organizationId: channelIntegration.organizationId,
          channel: "ZALO_OA",
          externalSenderId: senderId,
          messageText,
        })

        const accessToken = channelIntegration.config.zaloAccessToken
        if (accessToken) {
          await sendZaloOaReply(accessToken, senderId, result.replyText)
        }
      }
    }

    return NextResponse.json({ error: 0, message: "Success" }, { status: 200 })
  } catch (error) {
    console.error("Zalo OA Webhook error:", error)
    return NextResponse.json({ error: 0, message: "OK" }, { status: 200 })
  }
}

async function sendZaloOaReply(accessToken: string, userId: string, text: string) {
  try {
    await fetch("https://openapi.zalo.me/v3.0/oa/message/cs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: accessToken,
      },
      body: JSON.stringify({
        recipient: { user_id: userId },
        message: { text },
      }),
    })
  } catch (err) {
    console.error("Failed to send Zalo OA reply:", err)
  }
}
