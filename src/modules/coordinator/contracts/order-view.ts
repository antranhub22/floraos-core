/**
 * Hình dạng đầu ra CHUNG của mọi endpoint đơn điều phối: `{ order: CoordinatorOrderView }`.
 * `conformance` phía dưới khoá zod ↔ kiểu TS của use-case ở tsc — đổi một
 * bên mà quên bên kia thì `npx tsc --noEmit` đỏ.
 */

import { z } from "zod"

import type { CoordinatorOrderView } from "../use-cases/present-coordinator-order"
import {
  AtomicAccessoryBomItemSchema,
  AtomicFlowerBomItemSchema,
  AtomicFoliageBomItemSchema,
  AtomicWrappingLayerSchema,
  CoordinationRiskLevelEnum,
  CoordinatorStageEnum,
} from "./common"

/**
 * Snapshot Master Index bất biến (MI-5, Hợp đồng MI §5) — ĐP-2.3/2.11
 * (26/09/2026). Khớp với `CoordinatorProductSnapshot`
 * (`modules/products/domain/product-master-index.ts`). KHÔNG có
 * `costPriceVnd` — giá vốn không được rời Master Index vào một đơn mà đối
 * tác/khách có thể nhìn thấy.
 */
const CoordinatorProductSnapshotSchema = z.object({
  productId: z.string(),
  code: z.string(),
  name: z.string(),
  category: z.string(),
  style: z.string(),
  colorPalette: z.object({ primaryColor: z.string(), secondaryColor: z.string().optional() }),
  referenceImageUrls: z.array(z.string()),
  bom: z.object({
    flowers: z.array(AtomicFlowerBomItemSchema),
    foliage: z.array(AtomicFoliageBomItemSchema),
    wrapping: z.array(AtomicWrappingLayerSchema),
    accessories: z.array(AtomicAccessoryBomItemSchema),
  }),
  tierCount: z.number().optional(),
  substitutionPolicy: z.object({ allowed: z.boolean(), note: z.string().optional() }).optional(),
  dimensions: z.object({ heightCm: z.number(), widthCm: z.number() }).optional(),
  warningTags: z.array(z.string()),
  quotePriceVnd: z.number().nullable(),
  masterUpdatedAt: z.string(),
  capturedAt: z.string(),
})

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
  customerPhone: z.string(),
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
  productId: z.string().nullable(),
  product: CoordinatorProductSnapshotSchema.nullable(),
  foliage: z.array(AtomicFoliageBomItemSchema),
  wrapping: z.array(AtomicWrappingLayerSchema),
  accessories: z.array(AtomicAccessoryBomItemSchema),
  substitutionPolicy: z.object({ allowed: z.boolean(), note: z.string().optional() }).nullable(),
  referenceImageUrls: z.array(z.string()),
  cardMessage: z.string(),
  cardRequired: z.boolean(),
  internalNote: z.string().nullable(),
  partnerInstruction: z.string().nullable(),
  // ── ĐP-4a.1 (26/09/2026) — T01: đủ trường P0/P1 (Đặc tả trường §2.1/§3.1) ──
  source: z.string().nullable(),
  sourceReference: z.string().nullable(),
  channel: z.string().nullable(),
  orderType: z.string().nullable(),
  priority: z.string().nullable(),
  serviceLevel: z.string().nullable(),
  deliveryType: z.string().nullable(),
  deliveryLocationType: z.string().nullable(),
  conditionalFieldGroups: z.array(
    z.enum([
      "SYMPATHY",
      "GRAND_OPENING",
      "WEDDING_EVENT",
      "CORPORATE",
      "SUBSCRIPTION",
      "OFFICE_BUILDING",
      "HOSPITAL",
      "HOTEL",
      "VENUE",
    ])
  ),
  receivedAt: isoOrNull,
  deliveryWindowStart: isoOrNull,
  deliveryWindowEnd: isoOrNull,
  salesOwnerId: z.string().nullable(),
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
  paidVnd: z.number(),
  balanceVnd: z.number(),
  paymentStatus: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"]),
  partnerPayoutVnd: z.number().nullable(),
  partnerRating: z.number().int().nullable(),
  closureNotes: z.string().nullable(),
  closedAt: isoOrNull,
  cancelledReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  customFields: z.record(z.string(), z.unknown()),
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
    customerPhone: "0987654321",
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
    productId: null,
    product: null,
    foliage: [],
    wrapping: [],
    accessories: [],
    substitutionPolicy: null,
    referenceImageUrls: [],
    cardMessage: "Chúc mừng sinh nhật!",
    cardRequired: true,
    internalNote: null,
    partnerInstruction: null,
    source: "MANUAL",
    sourceReference: null,
    channel: null,
    orderType: null,
    priority: "NORMAL",
    serviceLevel: null,
    deliveryType: null,
    deliveryLocationType: null,
    conditionalFieldGroups: [],
    receivedAt: null,
    deliveryWindowStart: null,
    deliveryWindowEnd: null,
    salesOwnerId: null,
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
    paidVnd: 0,
    balanceVnd: 850000,
    paymentStatus: "UNPAID",
    partnerPayoutVnd: null,
    partnerRating: null,
    closureNotes: null,
    closedAt: null,
    cancelledReason: null,
    createdAt: "2026-09-25T02:00:00.000Z",
    updatedAt: "2026-09-25T02:00:00.000Z",
    customFields: {},
    ...over,
  }
}
