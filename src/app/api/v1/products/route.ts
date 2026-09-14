import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { createProduct } from "@/modules/products/use-cases/create-product"
import { listProducts } from "@/modules/products/use-cases/list-products"

const PRODUCT_STATUS = ["DRAFT", "ACTIVE", "ARCHIVED"] as const

/** `GET /products` (`L1`, đặc tả 06 mục 6) — M03. Lọc `branch_id`/`status`/`category`. */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "L1")

  const url = new URL(request.url)
  const statusParam = url.searchParams.get("status")
  if (statusParam !== null && !PRODUCT_STATUS.includes(statusParam as (typeof PRODUCT_STATUS)[number])) {
    throw validationFailed({ status: `Phải là một trong: ${PRODUCT_STATUS.join(", ")}` })
  }

  const limitParam = url.searchParams.get("limit")
  const limit = limitParam === null ? undefined : Number(limitParam)
  if (limit !== undefined && !Number.isInteger(limit)) {
    throw validationFailed({ limit: "Phải là số nguyên" })
  }

  const priceMinParam = url.searchParams.get("price_min")
  const priceMaxParam = url.searchParams.get("price_max")
  if (priceMinParam !== null && isNaN(Number(priceMinParam))) {
    throw validationFailed({ price_min: "Phải là số" })
  }
  if (priceMaxParam !== null && isNaN(Number(priceMaxParam))) {
    throw validationFailed({ price_max: "Phải là số" })
  }

  const result = await listProducts(
    ctx,
    {
      ...(url.searchParams.has("branch_id") ? { branchId: url.searchParams.get("branch_id") } : {}),
      ...(statusParam !== null ? { status: statusParam as (typeof PRODUCT_STATUS)[number] } : {}),
      ...(url.searchParams.has("category") ? { category: url.searchParams.get("category") ?? "" } : {}),
      ...(url.searchParams.has("occasion_code") ? { occasionCode: url.searchParams.get("occasion_code") ?? "" } : {}),
      ...(url.searchParams.has("color") ? { color: url.searchParams.get("color") ?? "" } : {}),
      ...(url.searchParams.has("collection") ? { collection: url.searchParams.get("collection") ?? "" } : {}),
      ...(priceMinParam !== null ? { priceMin: Number(priceMinParam) } : {}),
      ...(priceMaxParam !== null ? { priceMax: Number(priceMaxParam) } : {}),
    },
    { limit, cursor: url.searchParams.get("cursor") }
  )
  return jsonResponse(result)
})

const postSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  branch_id: z.string().min(1).nullable().optional(),
  category: z.string().min(1).nullable().optional(),
  shape: z.string().min(1).nullable().optional(),
  facing: z.string().min(1).nullable().optional(),
  container: z.string().min(1).nullable().optional(),
  status: z.enum(PRODUCT_STATUS).optional(),
  attributes: z.record(z.string(), z.unknown()).nullable().optional(),
})

/** `POST /products` (`L2`, đặc tả 06 mục 6). */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "L2")

  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const product = await createProduct(ctx, {
    code: parsed.data.code,
    name: parsed.data.name,
    branchId: parsed.data.branch_id ?? null,
    category: parsed.data.category ?? null,
    shape: parsed.data.shape ?? null,
    facing: parsed.data.facing ?? null,
    container: parsed.data.container ?? null,
    status: parsed.data.status,
    attributes: parsed.data.attributes ?? null,
  })

  return jsonResponse(product, { status: 201 })
})
