import { NextResponse } from "next/server"
import { submitBrochureOrder } from "@/modules/greeting-card/use-cases/submit-brochure-order"

interface RouteParams {
  params: Promise<{ sendCode: string }>
}

export async function POST(request: Request, context: unknown) {
  try {
    const { sendCode } = await (context as RouteParams).params
    const body = await request.json().catch(() => ({}))

    const result = await submitBrochureOrder(sendCode, body)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Không thể tạo đơn hàng"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
