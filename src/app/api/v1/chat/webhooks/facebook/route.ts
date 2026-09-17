import { NextRequest, NextResponse } from "next/server"
import { ChatChannelRepository } from "@/modules/chat-assistant/infra/chat-channel-repository"
import { handleIncomingChannelMessage } from "@/modules/chat-assistant/use-cases/handle-incoming-channel-message"

// 1. Xác thực Webhook từ Facebook Developers
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  // Token xác thực mặc định hoặc theo cấu hình
  const expectedToken = process.env.FB_WEBHOOK_VERIFY_TOKEN || "floraos_facebook_verify_token"

  if (mode === "subscribe" && token === expectedToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse("Forbidden", { status: 403 })
}

// 2. Tiếp nhận sự kiện tin nhắn từ Facebook Messenger
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.object !== "page") {
      return NextResponse.json({ status: "ignored" }, { status: 200 })
    }

    const channelRepo = new ChatChannelRepository()

    for (const entry of body.entry || []) {
      const pageId = entry.id
      // Tìm shop hoa kích hoạt kênh Facebook có pageId này
      const channelIntegration = await channelRepo.findActiveByFbPageId(pageId)
      if (!channelIntegration) continue

      for (const messagingEvent of entry.messaging || []) {
        const senderId = messagingEvent.sender?.id
        const messageText = messagingEvent.message?.text

        if (senderId && messageText) {
          const result = await handleIncomingChannelMessage({
            organizationId: channelIntegration.organizationId,
            channel: "FACEBOOK_MESSENGER",
            externalSenderId: senderId,
            messageText,
          })

          // Gửi phản hồi lại Facebook Send API nếu có page access token
          const pageToken = channelIntegration.config.fbPageAccessToken
          if (pageToken) {
            await sendFacebookReply(pageToken, senderId, result.replyText)
          }
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 })
  } catch (error) {
    console.error("Facebook Webhook error:", error)
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }
}

async function sendFacebookReply(pageAccessToken: string, recipientId: string, text: string) {
  try {
    await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    })
  } catch (err) {
    console.error("Failed to send Facebook reply:", err)
  }
}
