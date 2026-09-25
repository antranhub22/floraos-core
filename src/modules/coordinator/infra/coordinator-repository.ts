/**
 * Coordinator Repository (Infra Layer).
 * Tương tác trực tiếp với Prisma CSDL (orders + order_coordinations + order_items).
 * Tuân thủ tuyệt đối quy tắc Tenant Isolation — bắt buộc organization_id.
 */

import { prisma } from "@/core/tenancy/infra/prisma"
import type { coordinator_stage, coordination_risk_level } from "@/generated/prisma/client"
import type { CoordinatorStage, CoordinationRiskLevel } from "../domain/coordinator-types"
import { mapStageToOrderAxes } from "../domain/state-mapper"
import type { StructuredAddress } from "@/modules/products/domain/product-master-index"

export interface SaveCoordinatorOrderInput {
  orderCode?: string | undefined
  stage: CoordinatorStage
  stageLabel?: string | undefined
  riskLevel: CoordinationRiskLevel
  riskReason?: string | null | undefined
  customerName: string
  customerTier: string
  recipientName: string
  recipientPhone: string
  deliveryAddress: StructuredAddress | string
  deliveryTargetTime: string
  nextAction: string
  partnerName?: string | undefined
  productTitle: string
  sampleImageUrl?: string | undefined
  unitPriceVnd?: number | undefined
  flowers?: Array<{
    flowerName: string
    quantity: number
    unit: string
    color: string
    role: string
  }> | undefined
  cardMessage?: string | undefined
  internalNote?: string | undefined
}

export class CoordinatorRepository {
  /**
   * Tạo đơn hàng mới kèm hồ sơ điều phối (Control Tower) trong một transaction nguyên tử.
   */
  async createOrderWithCoordination(
    organizationId: string,
    userId: string,
    input: SaveCoordinatorOrderInput
  ) {
    const axes = mapStageToOrderAxes(input.stage)
    const code = input.orderCode || `FLR-2026-${Math.floor(100 + Math.random() * 900)}`

    // Đảm bảo không trùng mã code trong cùng tổ chức
    const existing = await prisma.orders.findUnique({
      where: {
        organization_id_code: {
          organization_id: organizationId,
          code,
        },
      },
    })
    const finalCode = existing ? `${code}-${Date.now().toString().slice(-4)}` : code

    try {
      return await prisma.$transaction(async (tx) => {
        const order = await tx.orders.create({
          data: {
            organization_id: organizationId,
            code: finalCode,
            status: axes.status,
            production_status: axes.productionStatus,
            delivery_status: axes.deliveryStatus,
            total_vnd: input.unitPriceVnd || 0,
            card_message: input.cardMessage || null,
            internal_note: input.internalNote || null,
            delivery_window: { timeSlot: input.deliveryTargetTime },
            delivery_address:
              typeof input.deliveryAddress === "object"
                ? (input.deliveryAddress as any)
                : { formattedAddress: input.deliveryAddress },
            created_by: userId,
          },
        })

        // Lưu chi tiết hoa BOM vào order_items nếu có
        if (input.flowers && input.flowers.length > 0) {
          await tx.order_items.createMany({
            data: input.flowers.map((fl) => ({
              organization_id: organizationId,
              order_id: order.id,
              description: `${fl.flowerName} (${fl.color}, ${fl.role})`,
              quantity: fl.quantity || 1,
              unit_price_vnd: 0,
              metadata: {
                flowerName: fl.flowerName,
                color: fl.color,
                role: fl.role,
                unit: fl.unit,
              },
            })),
          })
        }

        const coordination = await tx.order_coordinations.create({
          data: {
            organization_id: organizationId,
            order_id: order.id,
            stage: input.stage as coordinator_stage,
            risk_level: input.riskLevel as coordination_risk_level,
            risk_reason: input.riskReason || null,
            next_action: input.nextAction || null,
            metadata: {
              customerName: input.customerName,
              customerTier: input.customerTier,
              recipientName: input.recipientName,
              recipientPhone: input.recipientPhone,
              productTitle: input.productTitle,
              sampleImageUrl: input.sampleImageUrl,
              partnerName: input.partnerName,
              flowers: input.flowers,
            },
          },
        })

        return {
          id: order.id,
          orderCode: order.code,
          stage: coordination.stage,
          riskLevel: coordination.risk_level,
          coordinationId: coordination.id,
        }
      })
    } catch (err: any) {
      if (err?.code === "P2021" || err?.message?.includes("does not exist")) {
        console.warn("Table order_coordinations not found in DB. Please run `npx prisma db push`.")
        // Fallback: tạo bản ghi orders để không làm gãy luồng
        const order = await prisma.orders.create({
          data: {
            organization_id: organizationId,
            code: finalCode,
            status: axes.status,
            production_status: axes.productionStatus,
            delivery_status: axes.deliveryStatus,
            total_vnd: input.unitPriceVnd || 0,
            card_message: input.cardMessage || null,
            internal_note: input.internalNote || null,
            delivery_window: { timeSlot: input.deliveryTargetTime },
            delivery_address:
              typeof input.deliveryAddress === "object"
                ? (input.deliveryAddress as any)
                : { formattedAddress: input.deliveryAddress },
            created_by: userId,
          },
        })
        return {
          id: order.id,
          orderCode: order.code,
          stage: input.stage,
          riskLevel: input.riskLevel,
          coordinationId: `temp-${order.id}`,
        }
      }
      throw err
    }
  }

  /**
   * Lấy danh sách đơn kèm thông tin điều phối đầy đủ theo tổ chức.
   */
  async listOrdersWithCoordination(
    organizationId: string,
    options?: { stage?: string | undefined; limit?: number | undefined }
  ) {
    try {
      const rows = await prisma.orders.findMany({
        where: {
          organization_id: organizationId,
        },
        include: {
          coordination: true,
          items: true,
        },
        orderBy: {
          created_at: "desc",
        },
        take: options?.limit ?? 50,
      })

      return rows.map((row) => {
        const meta = (row.coordination?.metadata as Record<string, any>) || {}
        const deliveryAddress = row.delivery_address as any
        const deliveryWindow = row.delivery_window as any

        return {
          id: row.id,
          orderCode: row.code,
          stage: (row.coordination?.stage || "INTAKE") as CoordinatorStage,
          stageLabel: getStageLabel(row.coordination?.stage || "INTAKE"),
          riskLevel: (row.coordination?.risk_level || "NORMAL") as CoordinationRiskLevel,
          riskReason: row.coordination?.risk_reason || undefined,
          customerName: meta.customerName || "Khách Hàng",
          customerTier: meta.customerTier || "BRONZE",
          recipientName: meta.recipientName || "Người Nhận",
          recipientPhone: meta.recipientPhone || "",
          deliveryAddress: deliveryAddress || { formattedAddress: "Chưa có địa chỉ" },
          deliveryTargetTime: deliveryWindow?.timeSlot || "Trong ngày",
          nextAction: row.coordination?.next_action || "Đang xử lý điều phối",
          partnerName: meta.partnerName || undefined,
          productTitle: meta.productTitle || "Mẫu hoa tươi",
          sampleImageUrl: meta.sampleImageUrl || undefined,
          flowers: (meta.flowers as any[]) || [],
          cardMessage: row.card_message || "",
          internalNote: row.internal_note || undefined,
          hasException: row.coordination?.stage === "EXCEPTION",
          unitPriceVnd: Number(row.total_vnd) || 0,
        }
      })
    } catch (err: any) {
      if (err?.code === "P2021" || err?.message?.includes("does not exist")) {
        console.warn("Table order_coordinations not found in DB. Please run `npx prisma db push`.")
        return []
      }
      throw err
    }
  }

  /**
   * Cập nhật chuyển bước (Stage Advance) cho đơn hàng.
   */
  async updateOrderStage(
    organizationId: string,
    orderIdOrCode: string,
    nextStage: CoordinatorStage,
    nextAction?: string | undefined
  ) {
    try {
      const order = await prisma.orders.findFirst({
        where: {
          organization_id: organizationId,
          OR: [{ id: orderIdOrCode }, { code: orderIdOrCode }],
        },
        include: {
          coordination: true,
        },
      })

      if (!order) {
        throw new Error(`Order ${orderIdOrCode} not found in organization`)
      }

      const axes = mapStageToOrderAxes(nextStage)

      return await prisma.$transaction(async (tx) => {
        // 1. Cập nhật 3 trục trạng thái của bảng orders
        await tx.orders.update({
          where: { id: order.id },
          data: {
            status: axes.status,
            production_status: axes.productionStatus,
            delivery_status: axes.deliveryStatus,
          },
        })

        // 2. Cập nhật stage và nextAction trong order_coordinations
        if (order.coordination) {
          await tx.order_coordinations.update({
            where: { id: order.coordination.id },
            data: {
              stage: nextStage as coordinator_stage,
              next_action: nextAction || getNextActionDefault(nextStage),
              updated_at: new Date(),
            },
          })
        } else {
          await tx.order_coordinations.create({
            data: {
              organization_id: organizationId,
              order_id: order.id,
              stage: nextStage as coordinator_stage,
              risk_level: "NORMAL",
              next_action: nextAction || getNextActionDefault(nextStage),
            },
          })
        }
      })
    } catch (err: any) {
      if (err?.code === "P2021" || err?.message?.includes("does not exist")) {
        console.warn("Table order_coordinations not found in DB. Please run `npx prisma db push`.")
        return
      }
      throw err
    }
  }
}

function getStageLabel(stage: string): string {
  switch (stage) {
    case "INTAKE":
      return "Tiếp nhận đơn"
    case "PLANNING":
    case "ASSIGNING":
      return "Chờ phân công xưởng"
    case "IN_PRODUCTION":
      return "Đang cắm hoa"
    case "QUALITY_CHECK":
      return "Chờ duyệt QC"
    case "DISPATCHING":
      return "Đang giao hàng"
    case "DELIVERED":
      return "Đã giao (Chờ đóng đơn)"
    case "COMPLETED":
      return "Hoàn tất 100%"
    case "EXCEPTION":
      return "Sự cố cần xử lý"
    default:
      return stage
  }
}

function getNextActionDefault(stage: CoordinatorStage): string {
  switch (stage) {
    case "INTAKE":
      return "Kiểm tra thông tin đơn trước khi lập kế hoạch"
    case "PLANNING":
    case "ASSIGNING":
      return "Phân công đối tác xưởng ngoài hoặc thợ cắm hoa"
    case "IN_PRODUCTION":
      return "Xưởng đang tiếp nhận cắm hoa theo BOM"
    case "QUALITY_CHECK":
      return "Kiểm tra ảnh hoa thợ vừa cắm xong đối chiếu Master Index"
    case "DISPATCHING":
      return "Shipper đang giao tới người nhận"
    case "DELIVERED":
      return "Nghiệm thu đóng đơn và giải ngân đối tác"
    case "COMPLETED":
      return "Đơn đã hoàn thành trọn vẹn"
    case "EXCEPTION":
      return "Xử lý sự cố phát sinh"
    default:
      return "Tiếp tục tiến trình điều phối"
  }
}
