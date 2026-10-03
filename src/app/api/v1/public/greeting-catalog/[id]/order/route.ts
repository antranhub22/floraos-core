import { NextResponse } from "next/server"
import { submitPublicCatalogOrder } from "@/modules/greeting-card/use-cases/submit-public-catalog-order"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: unknown) {
  try {
    const { id } = await (context as RouteParams).params
    const body = await request.json().catch(() => ({}))

    const result = await submitPublicCatalogOrder(id, body)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Không thể tạo đơn đặt hoa"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
