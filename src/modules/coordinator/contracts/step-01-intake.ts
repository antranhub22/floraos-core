/**
 * Bước 01: Tiếp nhận Đơn & Khởi tạo Hồ sơ Điều phối (INTAKE).
 * Chuyển đơn hàng (từ M10/M08/M06) thành hồ sơ điều phối thống nhất.
 */

import { z } from "zod"
import { defineStep } from "./define-step"
import {
  CoordinatorStageEnum,
  CoordinationRiskLevelEnum,
  CustomerTierEnum,
  StructuredAddressSchema,
} from "./common"

export const Step01IntakeInputSchema = z.object({
  orderId: z.string().uuid(),
  source: z.enum(["ORDER_M10", "CHAT_M08", "CATALOG_M06", "MANUAL"]),
  priority: z.enum(["STANDARD", "RUSH", "VIP"]),
  coordinatorNote: z.string().optional(),
})

export const Step01IntakeOutputSchema = z.object({
  coordinationId: z.string().uuid(),
  orderId: z.string().uuid(),
  orderCode: z.string(),
  stage: CoordinatorStageEnum,
  riskLevel: CoordinationRiskLevelEnum,
  customerSnapshot: z.object({
    id: z.string().optional(),
    name: z.string(),
    phone: z.string(),
    tier: CustomerTierEnum,
  }),
  deliverySnapshot: z.object({
    recipientName: z.string(),
    phone: z.string(),
    address: StructuredAddressSchema,
    requiredTime: z.string(),
  }),
  productCount: z.number().int().positive(),
  receivedAt: z.string(),
})

export const step01IntakeContract = defineStep({
  id: "01",
  step: 1,
  code: "INTAKE",
  slug: "intake",
  title: "Tiếp nhận Đơn hàng",
  summary: "Nạp đơn hàng vào Tháp Điều phối và khởi tạo hồ sơ theo dõi",
  endpoint: {
    method: "POST",
    path: "/api/v1/coordinator/intake",
    capability: "O1",
  },
  input: Step01IntakeInputSchema,
  output: Step01IntakeOutputSchema,
  examples: {
    input: {
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      source: "ORDER_M10",
      priority: "STANDARD",
      coordinatorNote: "Khách hẹn giao đúng 17h trước tiệc",
    },
    output: {
      coordinationId: "a1b2c3d4-e29b-41d4-a716-446655440001",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      orderCode: "FLR-2026-001",
      stage: "INTAKE",
      riskLevel: "NORMAL",
      customerSnapshot: {
        id: "c1b2c3d4-e29b-41d4-a716-446655440002",
        name: "Nguyễn Văn An",
        phone: "0901234567",
        tier: "GOLD",
      },
      deliverySnapshot: {
        recipientName: "Trần Thị Bình",
        phone: "0912345678",
        address: {
          street: "Số 18, Ngõ 95, Đường Chùa Bộc",
          ward: "Phường Trung Liệt",
          district: "Quận Đống Đa",
          city: "Thành phố Hà Nội",
          country: "Việt Nam",
          formattedAddress: "Số 18, Ngõ 95, Đường Chùa Bộc, Phường Trung Liệt, Quận Đống Đa, Thành phố Hà Nội, Việt Nam",
        },
        requiredTime: "2026-09-25T17:00:00.000Z",
      },
      productCount: 1,
      receivedAt: "2026-09-25T10:00:00.000Z",
    },
  },
})
