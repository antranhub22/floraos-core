/**
 * Hình dạng đầu ra CHUNG của mọi endpoint đơn điều phối: `{ order: CoordinatorOrderView }`.
 * `conformance` phía dưới khoá zod ↔ kiểu TS của use-case ở tsc — đổi một
 * bên mà quên bên kia thì `npx tsc --noEmit` đỏ.
 */

import { z } from "zod"

import type { CoordinatorOrderView } from "../use-cases/present-coordinator-order"
import { CoordinationRiskLevelEnum, CoordinatorStageEnum } from "./common"

const isoOrNull = z.string().nullable()

export const CoordinatorOrderViewSchema = z.object({
  id: z.string(),
  orderCode: z.string(),
  stage: CoordinatorStageEnum,
  stageLabel: z.string(),
  riskLevel: CoordinationRiskLevelEnum,
  riskReason: z.string().nullable(),
  customerId: z.string().nullable(),
  customerName: z.string(),
  customerTier: z.string(),
  recipientName: z.string(),
  recipientPhone: z.string(),
  deliveryAddress: z.unknown(),
  deliveryTargetTime: z.string(),
  deliveryTargetAt: isoOrNull,
  nextAction: z.string(),
  partner: z.object({ id: z.string(), name: z.string(), phone: z.string() }).nullable(),
  partnerName: z.string().nullable(),
  productTitle: z.string(),
  sampleImageUrl: z.string().nullable(),
  finishedImageUrls: z.array(z.string()),
  productionProgress: z.number().int(),
  flowers: z.array(
    z.object({ flowerName: z.string(), quantity: z.number(), unit: z.string(), color: z.string(), role: z.string() })
  ),
  cardMessage: z.string(),
  internalNote: z.string().nullable(),
  qc: z
    .object({ status: z.string(), notes: z.string().nullable(), aiScore: z.number().nullable(), inspectedAt: z.string() })
    .nullable(),
  delivery: z.object({
    carrier: z.string().nullable(),
    shipperName: z.string().nullable(),
    shipperPhone: z.string().nullable(),
    state: z.string().nullable(),
    podImageUrl: z.string().nullable(),
    podRecipientName: z.string().nullable(),
    podCapturedAt: isoOrNull,
    actualDeliveryAt: isoOrNull,
  }),
  exceptions: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      type: z.string(),
      severity: z.string(),
      description: z.string(),
      status: z.string(),
      resolution: z.string().nullable(),
      createdAt: z.string(),
      resolvedAt: isoOrNull,
    })
  ),
  hasException: z.boolean(),
  unitPriceVnd: z.number(),
  partnerPayoutVnd: z.number().nullable(),
  partnerRating: z.number().int().nullable(),
  closureNotes: z.string().nullable(),
  closedAt: isoOrNull,
  cancelledReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const CoordinatorOrderResponseSchema = z.object({ order: CoordinatorOrderViewSchema })

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
export const conformance: Equal<z.infer<typeof CoordinatorOrderViewSchema>, CoordinatorOrderView> = true

/** Ví dụ gốc — mỗi bước chỉ ghi đè các trường bước đó đổi. */
export function exampleOrderView(over: Partial<CoordinatorOrderView> = {}): CoordinatorOrderView {
  return {
    id: "6f1c2b1e-0a4d-4c55-9d0e-3b1f9a7c2d10",
    orderCode: "FLR-260925-0001",
    stage: "INTAKE",
    stageLabel: "Tiếp nhận đơn",
    riskLevel: "NORMAL",
    riskReason: null,
    customerId: null,
    customerName: "Nguyễn Văn An",
    customerTier: "VIP",
    recipientName: "Trần Thị Bình",
    recipientPhone: "0901234567",
    deliveryAddress: {
      street: "123 Phố Huế",
      ward: "Phường Ngô Thì Nhậm",
      district: "Quận Hai Bà Trưng",
      city: "Hà Nội",
      country: "Việt Nam",
    },
    deliveryTargetTime: "17:00 hôm nay",
    deliveryTargetAt: "2026-09-25T10:00:00.000Z",
    nextAction: "Kiểm tra thông tin đơn trước khi lập kế hoạch",
    partner: null,
    partnerName: null,
    productTitle: "Bó hoa hồng Pastel",
    sampleImageUrl: null,
    finishedImageUrls: [],
    productionProgress: 0,
    flowers: [{ flowerName: "Hồng Ohara", quantity: 12, unit: "cành", color: "hồng phấn", role: "Chủ đạo" }],
    cardMessage: "Chúc mừng sinh nhật!",
    internalNote: null,
    qc: null,
    delivery: {
      carrier: null,
      shipperName: null,
      shipperPhone: null,
      state: null,
      podImageUrl: null,
      podRecipientName: null,
      podCapturedAt: null,
      actualDeliveryAt: null,
    },
    exceptions: [],
    hasException: false,
    unitPriceVnd: 850000,
    partnerPayoutVnd: null,
    partnerRating: null,
    closureNotes: null,
    closedAt: null,
    cancelledReason: null,
    createdAt: "2026-09-25T02:00:00.000Z",
    updatedAt: "2026-09-25T02:00:00.000Z",
    ...over,
  }
}
