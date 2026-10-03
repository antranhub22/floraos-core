import { NextResponse } from "next/server"
import { getGreetingCatalogForCustomer } from "@/modules/greeting-card/use-cases/get-greeting-catalog"

interface RouteParams {
  params: Promise<{ sendCode: string }>
}

export async function GET(request: Request, context: unknown) {
  try {
    const { sendCode } = await (context as RouteParams).params
    const data = await getGreetingCatalogForCustomer(sendCode)

    if (data.status === "NOT_FOUND") {
      return NextResponse.json({ error: "Không tìm thấy Thẻ chào hoặc đường link đã hết hạn" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi xử lý yêu cầu"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
