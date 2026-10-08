import { notFound } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { isBrochureOwner } from "@/modules/greeting-card/use-cases/brochure-owner"
import { BrochureOrderRepository } from "@/modules/greeting-card/infra/brochure-order-repository"
import { prisma } from "@/core/tenancy/infra/prisma"

/**
 * POST /api/v1/public/brochure/tracking/[code]/approve-photo
 * Khách bấm xác nhận hình ảnh sản phẩm hoàn thiện (Spec #3).
 */
export const POST = handle<[{ params: Promise<{ code: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-photo-approve", limit: 10, windowMs: 60_000 })
  const { code } = await context.params
  const link = new URL(request.url).searchParams.get("link")

  const repo = new BrochureOrderRepository()
  const order = await repo.getTrackingOrderByCode(code)
  if (!order) throw notFound()

  // Kiểm tra quyền chủ phiên nếu có link
  if (link && !isBrochureOwner(request, link)) {
    throw notFound()
  }

  // Tạo QC record CUSTOMER_PHOTO_APPROVED
  await prisma.$transaction(async (tx) => {
    // Kiểm tra xem đã có bản ghi CUSTOMER_PHOTO_APPROVED chưa
    const existing = await tx.order_qc_records.findFirst({
      where: {
        order_id: order.id,
        notes: "CUSTOMER_PHOTO_APPROVED",
      },
    })

    if (!existing) {
      await tx.order_qc_records.create({
        data: {
          organization_id: order.organization_id,
          order_id: order.id,
          status: "PASSED",
          notes: "CUSTOMER_PHOTO_APPROVED",
          inspector_id: "CUSTOMER",
        },
      })

      await tx.order_events.create({
        data: {
          organization_id: order.organization_id,
          order_id: order.id,
          axis: "production",
          from_value: order.production_status,
          to_value: "CUSTOMER_APPROVED",
          reason: "CUSTOMER_PHOTO_APPROVED",
          actor_id: "CUSTOMER",
        },
      })
    }
  })

  return jsonResponse({ success: true, message: "Đã xác nhận hình ảnh sản phẩm thành công" })
})

export const dynamic = "force-dynamic"
