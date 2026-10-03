import { NextResponse } from "next/server"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { createProductSnapshot } from "@/modules/greeting-card/domain/greeting-card-rules"

interface RouteParams {
  params: Promise<{ sendCode: string }>
}

export async function POST(request: Request, context: unknown) {
  try {
    const { sendCode } = await (context as RouteParams).params
    const body = await request.json().catch(() => ({}))
    const { productId, product } = body

    if (!productId) {
      return NextResponse.json({ error: "Thiếu thông tin sản phẩm" }, { status: 400 })
    }

    const repo = new GreetingCardRepository()
    const session = await repo.getPublicSessionBySendCode(sendCode)
    if (!session) {
      return NextResponse.json({ error: "Không tìm thấy Thẻ chào" }, { status: 404 })
    }

    const snapshot = product
      ? createProductSnapshot(product)
      : createProductSnapshot({
          id: productId,
          code: "PROD",
          name: "Sản phẩm đã chọn",
          price: 500000,
          imageUrl: null,
          sortOrder: 0,
        })

    await repo.updateSession(session.id, {
      status: "SELECTED",
      selectedProductId: productId,
      productSnapshot: snapshot,
      selectedAt: new Date(),
    })

    await repo.recordJourneyEvent(session.organization_id, session.id, "SELECT_PRODUCT", {
      productId,
      snapshot,
    })

    return NextResponse.json({ success: true, snapshot })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi xử lý yêu cầu"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
