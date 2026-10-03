import { NextResponse } from "next/server"

/**
 * GET /api/health
 * Health check endpoint cho Render deployment.
 * Trả 200 khi app đang chạy, dùng cho readiness probe.
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString() },
    { status: 200 }
  )
}
