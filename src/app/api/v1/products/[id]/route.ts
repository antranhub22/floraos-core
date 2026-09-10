import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getProduct } from "@/modules/products/use-cases/get-product"
import { updateProduct } from "@/modules/products/use-cases/update-product"

const PRODUCT_STATUS = ["DRAFT", "ACTIVE", "ARCHIVED"] as const

/** `GET /products/:id` (`L1`, đặc tả 06 mục 6) — M03, redaction theo `L5`. */
export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "L1")

  const { id } = await context.params
  return jsonResponse(await getProduct(ctx, id))
})

const patchSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  branch_id: z.string().min(1).nullable().optional(),
  category: z.string().min(1).nullable().optional(),
  shape: z.string().min(1).nullable().optional(),
  facing: z.string().min(1).nullable().optional(),
  container: z.string().min(1).nullable().optional(),
  status: z.enum(PRODUCT_STATUS).optional(),
  attributes: z.record(z.string(), z.unknown()).nullable().optional(),
})

/**
 * `PATCH /products/:id` (`L3`, đặc tả 06 mục 6). Chuyển sang `ARCHIVED` đòi
 * thêm `L4` (`product.archive`, trần cứng `dieu_hanh` — `capability-catalog.ts`)
 * — `L3` một mình không đủ để "ngừng kinh doanh một sản phẩm", đúng bảng ở
 * đặc tả 02 mục "Sản phẩm và giá — nhóm L". Không có route `/archive` riêng
 * trong đặc tả 06 nên chặn thêm ngay trong `PATCH` là chỗ duy nhất hợp lý.
 */
export const PATCH = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "L3")

  const { id } = await context.params
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  if (parsed.data.status === "ARCHIVED") requireCapability(ctx, "L4")

  const updated = await updateProduct(ctx, id, {
    code: parsed.data.code,
    name: parsed.data.name,
    branchId: parsed.data.branch_id,
    category: parsed.data.category,
    shape: parsed.data.shape,
    facing: parsed.data.facing,
    container: parsed.data.container,
    status: parsed.data.status,
    attributes: parsed.data.attributes,
  })

  return jsonResponse(updated)
})
