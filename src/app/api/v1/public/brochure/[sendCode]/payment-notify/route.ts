import { NextResponse } from "next/server"
import { reportCustomerPayment } from "@/modules/greeting-card/use-cases/confirm-brochure-payment"

interface RouteParams {
  params: Promise<{ sendCode: string }>
}

export async function POST(request: Request, context: unknown) {
  try {
    const { sendCode } = await (context as RouteParams).params
    const result = await reportCustomerPayment(sendCode)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi xử lý yêu cầu"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
