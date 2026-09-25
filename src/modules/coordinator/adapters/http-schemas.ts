/**
 * Hợp đồng HTTP của `/api/v1/coordinator/*` (Chức năng 12). Route chỉ gọi
 * `parseBody` — body sai trả 400 `VALIDATION_FAILED` kèm `issues`, không phải
 * 500 như bản trước (`schema.parse` ném `ZodError` ra `handle()`).
 */

import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { COORDINATOR_STAGES } from "../domain/stage-transitions"
import { EXCEPTION_SEVERITIES, EXCEPTION_TYPES } from "../domain/operation-rules"

export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  return parsed.data
}

const text = (max: number) => z.string().trim().max(max)
const requiredText = (max: number, message: string) => z.string().trim().min(1, message).max(max)
const id = z.string().trim().min(1).max(64)

/**
 * URL ảnh mẫu từ Product Master / catalog. Cấm `data:` — bản trước nhét ảnh
 * base64 vài MB vào `metadata` của đơn. Ảnh tải lên đi qua `assets` (`sampleAssetId`).
 */
const externalImageUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => /^https?:\/\//i.test(v) || v.startsWith("/"), "Chỉ nhận URL http(s) hoặc đường dẫn nội bộ; ảnh tải lên dùng sampleAssetId")

export const stageSchema = z.enum(COORDINATOR_STAGES as [string, ...string[]])

export const listQuerySchema = z.object({
  stage: stageSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
})

const addressSchema = z.union([
  requiredText(500, "Thiếu địa chỉ giao").transform((formattedAddress) => ({ formattedAddress })),
  z.object({
    street: requiredText(200, "Thiếu số nhà, tên đường"),
    ward: requiredText(100, "Thiếu phường/xã"),
    district: requiredText(100, "Thiếu quận/huyện"),
    city: requiredText(100, "Thiếu tỉnh/thành phố"),
    country: text(100).optional(),
    formattedAddress: text(500).optional(),
  }),
])

export const createOrderSchema = z.object({
  customerId: id.optional(),
  customerName: requiredText(200, "Thiếu tên khách hàng"),
  customerTier: z.enum(["NEW", "BRONZE", "SILVER", "GOLD", "VIP"]).default("NEW"),
  recipientName: requiredText(200, "Thiếu tên người nhận"),
  recipientPhone: z.string().trim().regex(/^\+?[0-9 .-]{8,15}$/, "Số điện thoại người nhận không hợp lệ"),
  deliveryAddress: addressSchema,
  deliveryTargetTime: requiredText(100, "Thiếu khung giờ giao"),
  deliveryTargetAt: z.string().datetime({ offset: true }).optional(),
  productTitle: requiredText(300, "Thiếu tên sản phẩm hoa"),
  sampleImageUrl: externalImageUrl.optional(),
  sampleAssetId: id.optional(),
  unitPriceVnd: z.number().nonnegative().max(1_000_000_000).default(0),
  flowers: z
    .array(
      z.object({
        flowerName: requiredText(120, "Thiếu tên hoa"),
        quantity: z.number().int().positive().max(10_000),
        unit: text(20).default("cành"),
        color: text(60).default(""),
        role: text(60).default(""),
      })
    )
    .max(100)
    .default([]),
  cardMessage: text(1000).optional(),
  internalNote: text(2000).optional(),
})

export const updateStageSchema = z.object({
  stage: stageSchema,
  nextAction: text(300).optional(),
})

export const assignPartnerSchema = z.object({
  partnerId: id,
  notes: text(1000).optional(),
  overrideCapacity: z.boolean().optional(),
})

export const productionUpdateSchema = z.object({
  action: z.enum(["UPDATE_PROGRESS", "MARK_READY", "REPORT_MATERIAL_ISSUE"]),
  progressPercent: z.number().int().min(0).max(100),
  finishedAssetIds: z.array(id).max(10).optional(),
  issueNote: text(1000).optional(),
})

export const qcInspectionSchema = z.object({
  decision: z.enum(["PASSED", "REWORK_REQUESTED", "REJECTED"]),
  notes: text(2000).optional(),
  checklist: z.record(z.string().max(60), z.boolean()).optional(),
})

export const deliveryUpdateSchema = z.object({
  event: z.enum(["PICKED_UP", "ON_THE_WAY", "DELIVERED_SUCCESS", "DELIVERY_FAILED"]),
  carrier: text(100).optional(),
  shipperName: requiredText(200, "Thiếu tên shipper"),
  shipperPhone: text(20).optional(),
  podAssetId: id.optional(),
  recipientSignedName: text(200).optional(),
  failureReason: text(1000).optional(),
})

export const openExceptionSchema = z.object({
  type: z.enum(EXCEPTION_TYPES),
  severity: z.enum(EXCEPTION_SEVERITIES).default("MEDIUM"),
  description: requiredText(2000, "Thiếu mô tả sự cố"),
})

export const resolveExceptionSchema = z.object({
  resolution: requiredText(2000, "Thiếu cách xử lý"),
})

export const closeOrderSchema = z.object({
  partnerRating: z.number().int().min(1).max(5).optional(),
  partnerPayoutVnd: z.number().nonnegative().max(1_000_000_000).optional(),
  notes: text(2000).optional(),
})

export const cancelOrderSchema = z.object({
  reason: requiredText(1000, "Thiếu lý do huỷ"),
})

export const createPartnerSchema = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9_-]{2,32}$/, "Mã đối tác 2–32 ký tự chữ/số/-/_"),
  name: requiredText(200, "Thiếu tên đối tác"),
  phone: z.string().trim().regex(/^\+?[0-9 .-]{8,15}$/, "Số điện thoại không hợp lệ"),
  address: text(500).optional(),
  district: text(100).optional(),
  province: text(100).optional(),
  tier: z.enum(["STANDARD", "PREFERRED", "VIP"]).default("STANDARD"),
  capacityDaily: z.number().int().min(1).max(1000).default(10),
})

export const updatePartnerSchema = createPartnerSchema
  .omit({ code: true })
  .partial()
  .extend({ isActive: z.boolean().optional() })
