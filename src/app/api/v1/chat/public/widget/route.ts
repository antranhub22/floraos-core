import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { OrganizationRepository } from "@/modules/organization/infra/organization-repository"
import { handleIncomingChannelMessage } from "@/modules/chat-assistant/use-cases/handle-incoming-channel-message"

const publicChatSchema = z.object({
  slug: z.string().min(1),
  visitorId: z.string().min(1),
  message: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = publicChatSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Tham số không hợp lệ" }, { status: 400 })
    }

    const { slug, visitorId, message } = parsed.data
    const orgRepo = new OrganizationRepository()
    const org = await orgRepo.findBySlug(slug)

    if (!org) {
      return NextResponse.json({ error: "Không tìm thấy cửa hàng" }, { status: 404 })
    }

    const result = await handleIncomingChannelMessage({
      organizationId: org.id,
      channel: "STOREFRONT_CATALOG",
      externalSenderId: visitorId,
      messageText: message,
    })

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    })
  } catch (error: any) {
    console.error("Public Chat Widget error:", error)
    return NextResponse.json({ error: error.message || "Lỗi xử lý tin nhắn" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
