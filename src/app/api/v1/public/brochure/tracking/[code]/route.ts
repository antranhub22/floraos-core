import { NextResponse } from "next/server"
import { getBrochureTracking } from "@/modules/greeting-card/use-cases/get-brochure-tracking"

interface RouteParams {
  params: Promise<{ code: string }>
}

export async function GET(request: Request, context: unknown) {
  try {
    const { code } = await (context as RouteParams).params
    const data = await getBrochureTracking(code)

    if (data.status === "NOT_FOUND") {
      return NextResponse.json({ error: "Không tìm thấy thông tin đơn hàng" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi xử lý yêu cầu"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
