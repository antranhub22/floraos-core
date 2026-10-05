import { NextResponse } from "next/server"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { createProductSnapshot } from "@/modules/greeting-card/domain/greeting-card-rules"
import { catalogItemToProduct } from "@/modules/greeting-card/domain/catalog-product-price"

interface RouteParams {
  params: Promise<{ sendCode: string }>
}

export async function POST(request: Request, context: unknown) {
  try {
    const { sendCode } = await (context as RouteParams).params
    const body = await request.json().catch(() => ({}))
    // Chỉ nhận productId; tên, giá, ảnh lấy từ bộ sưu tập phía máy chủ (không tin dữ liệu khách gửi)
    const { productId } = body as { productId?: string }

    if (!productId) {
      return NextResponse.json({ error: "Thiếu thông tin sản phẩm" }, { status: 400 })
    }

    const repo = new GreetingCardRepository()
    const session = await repo.getPublicSessionBySendCode(sendCode)
    if (!session) {
      return NextResponse.json({ error: "Không tìm thấy Thẻ chào" }, { status: 404 })
    }

    const item = session.catalog.items.find((i) => i.product.id === productId)
    if (!item) {
      return NextResponse.json({ error: "Mẫu hoa không có trong bộ sưu tập này" }, { status: 404 })
    }
    const mainImage = item.product.images.find((img) => img.role === "MAIN") ?? item.product.images[0]
    const assetMap = mainImage ? await repo.getAssetsStorageMap([mainImage.asset_id]) : new Map<string, string>()
    const snapshot = createProductSnapshot(
      catalogItemToProduct(item, mainImage ? assetMap.get(mainImage.asset_id) ?? null : null),
    )

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
