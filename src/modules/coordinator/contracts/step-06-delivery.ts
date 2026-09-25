/**
 * Bước 06: Điều phối Giao vận & Thu thập Bằng chứng Giao hoa (DISPATCHING & POD).
 * Giao việc cho Shipper, theo dõi tiến độ giao hoa, chụp ảnh người nhận ký nhận (POD).
 */

import { z } from "zod"
import { defineStep } from "./define-step"
import { CoordinatorStageEnum } from "./common"

export const Step06DeliveryInputSchema = z.object({
  coordinationId: z.string().uuid(),
  shipperName: z.string(),
  shipperPhone: z.string(),
  podImageUrl: z.string().url().optional(),
  recipientSignedName: z.string().optional(),
  deliveryStatus: z.enum(["PICKED_UP", "ON_THE_WAY", "DELIVERED_SUCCESS", "DELIVERY_FAILED"]),
  failureReason: z.string().optional(),
})

export const Step06DeliveryOutputSchema = z.object({
  coordinationId: z.string().uuid(),
  stage: CoordinatorStageEnum,
  shipperSnapshot: z.object({
    name: z.string(),
    phone: z.string(),
  }),
  isDelivered: z.boolean(),
  podSnapshot: z.object({
    podImageUrl: z.string().optional(),
    recipientSignedName: z.string().optional(),
    deliveredAt: z.string().optional(),
  }),
  nextAction: z.string(),
})

export const step06DeliveryContract = defineStep({
  id: "06",
  step: 6,
  code: "DELIVERY",
  slug: "delivery",
  title: "Giao vận & Bằng chứng Giao hoa (POD)",
  summary: "Giám sát tài xế giao hoa và thu thập hình ảnh trao tận tay người nhận",
  endpoint: {
    method: "POST",
    path: "/api/v1/coordinator/delivery-update",
    capability: "O1",
  },
  input: Step06DeliveryInputSchema,
  output: Step06DeliveryOutputSchema,
  examples: {
    input: {
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      shipperName: "Lê Văn Hùng (AhaMove)",
      shipperPhone: "0933221100",
      podImageUrl: "https://storage.floraos.vn/org/test/pod-flower-delivery.jpg",
      recipientSignedName: "Trần Thị Bình",
      deliveryStatus: "DELIVERED_SUCCESS",
    },
    output: {
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      stage: "DELIVERED",
      shipperSnapshot: {
        name: "Lê Văn Hùng (AhaMove)",
        phone: "0933221100",
      },
      isDelivered: true,
      podSnapshot: {
        podImageUrl: "https://storage.floraos.vn/org/test/pod-flower-delivery.jpg",
        recipientSignedName: "Trần Thị Bình",
        deliveredAt: "2026-09-25T16:55:00.000Z",
      },
      nextAction: "Đơn giao thành công trước hẹn 5 phút. Chuyển sang bước đóng đơn và trích xuất học máy.",
    },
  },
})
