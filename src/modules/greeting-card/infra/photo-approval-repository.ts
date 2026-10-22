import { prisma } from "@/core/tenancy/infra/prisma"

export const CUSTOMER_PHOTO_APPROVED = "CUSTOMER_PHOTO_APPROVED"
const PRODUCT_PHOTO_UPLOADED = "PRODUCT_PHOTO_UPLOADED"

/**
 * Ghi khách xác nhận ảnh thành phẩm (Spec #3) — luồng công khai, không có phiên đăng nhập:
 * `organization_id` lấy từ chính đơn đã được use-case xác minh chủ phiên.
 * Idempotent theo LẦN TẢI ẢNH: bấm lại không tạo bản ghi trùng; nhưng Điều phối tải ảnh mới sau khi
 * khách đã duyệt thì lần duyệt cũ không còn giá trị — khách duyệt lại được ghi thành bản ghi mới.
 */
export class PhotoApprovalRepository {
  constructor(private readonly db = prisma) {}

  async recordApproval(order: { id: string; organization_id: string; production_status: string }) {
    return this.db.$transaction(async (tx) => {
      const latestUpload = await tx.order_qc_records.findFirst({
        where: { organization_id: order.organization_id, order_id: order.id, notes: PRODUCT_PHOTO_UPLOADED },
        orderBy: { created_at: "desc" },
        select: { created_at: true },
      })
      const existing = await tx.order_qc_records.findFirst({
        where: {
          organization_id: order.organization_id, order_id: order.id, notes: CUSTOMER_PHOTO_APPROVED,
          ...(latestUpload ? { created_at: { gte: latestUpload.created_at } } : {}),
        },
        select: { id: true },
      })
      if (existing) return { created: false }

      await tx.order_qc_records.create({
        data: {
          organization_id: order.organization_id,
          order_id: order.id,
          status: "PASSED",
          notes: CUSTOMER_PHOTO_APPROVED,
          inspector_id: null,
        },
      })
      await tx.order_events.create({
        data: {
          organization_id: order.organization_id,
          order_id: order.id,
          axis: "production",
          from_value: order.production_status,
          to_value: "CUSTOMER_APPROVED",
          reason: CUSTOMER_PHOTO_APPROVED,
          actor_id: null,
        },
      })
      return { created: true }
    })
  }
}
