import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { ProductRepository, type CreateProductInput } from "@/modules/products/infra/product-repository"

const itemSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().nullable().optional(),
  shape: z.string().nullable().optional(),
  facing: z.string().nullable().optional(),
  container: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  attributes: z.record(z.string(), z.unknown()).nullable().optional(),
  image_asset_id: z.string().nullable().optional(),
})

const batchSchema = z.object({
  items: z.array(itemSchema).min(1).max(500),
  skip_duplicates: z.boolean().optional().default(true),
  overwrite_existing_images: z.boolean().optional().default(false),
  overwrite_existing: z.boolean().optional().default(false),
})

export type BatchImportItem = z.infer<typeof itemSchema>

/**
 * POST /api/v1/products/batch-import (Quyền: L2)
 * Nhập sản phẩm đồng loạt từ danh sách Excel/Folder ảnh đã parse và upload asset.
 */
export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "L2")

  const parsed = batchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const { items, skip_duplicates, overwrite_existing_images, overwrite_existing } = parsed.data
  const shouldOverwrite = overwrite_existing || overwrite_existing_images
  const repo = new ProductRepository()

  // 1. Kiểm tra mã trùng hàng loạt
  const inputCodes = items.map((i) => i.code)
  const existingCodes = await repo.listExistingCodes(ctx, inputCodes)

  const createdProducts: Array<{ id: string; code: string; name: string }> = []
  const updatedCodes: string[] = []
  const skippedCodes: string[] = []
  const failedItems: Array<{ code: string; error: string }> = []
  const writtenInRun = new Set<string>()
  const imagesAttached: string[] = []
  const driveLinksUpdated: string[] = []

  for (const item of items) {
    if (existingCodes.has(item.code) || writtenInRun.has(item.code)) {
      if (skip_duplicates) {
        skippedCodes.push(item.code)
        // Mã đã có: nếu bật cờ overwrite hoặc có dữ liệu mới → cập nhật thông tin và bù ảnh/link cho sản phẩm.
        if (!writtenInRun.has(item.code)) {
          try {
            if (shouldOverwrite) {
              const updated = await repo.updateExistingFromBatch(ctx, item)
              if (updated) updatedCodes.push(item.code)
              if (item.image_asset_id) imagesAttached.push(item.code)
              if (item.attributes?.drive_link) driveLinksUpdated.push(item.code)
            } else {
              if (item.image_asset_id) {
                const attached = await repo.attachMainImageIfMissing(ctx, item.code, item.image_asset_id)
                if (attached) imagesAttached.push(item.code)
              }
              const linkUpdated = await repo.refreshDriveLinkIfNotDrive(ctx, item.code, item.attributes?.drive_link)
              if (linkUpdated) driveLinksUpdated.push(item.code)
            }
          } catch (err) {
            failedItems.push({ code: item.code, error: err instanceof Error ? err.message : "Lỗi cập nhật sản phẩm" })
          }
        }
        continue
      } else {
        failedItems.push({ code: item.code, error: "Mã sản phẩm đã tồn tại" })
        continue
      }
    }

    try {
      const product = await repo.create(ctx, {
        code: item.code,
        name: item.name,
        category: item.category ?? null,
        shape: item.shape ?? null,
        facing: item.facing ?? null,
        container: item.container ?? null,
        status: item.status ?? "ACTIVE",
        attributes: item.attributes ?? null,
        imageAssetId: item.image_asset_id ?? null,
      })

      writtenInRun.add(item.code)
      createdProducts.push({
        id: product.id,
        code: product.code,
        name: product.name,
      })
    } catch (err) {
      failedItems.push({
        code: item.code,
        error: err instanceof Error ? err.message : "Lỗi lưu sản phẩm",
      })
    }
  }

  return jsonResponse({
    success: true,
    total_requested: items.length,
    created_count: createdProducts.length,
    updated_count: updatedCodes.length,
    skipped_count: skippedCodes.length,
    images_attached_count: imagesAttached.length,
    drive_links_updated_count: driveLinksUpdated.length,
    failed_count: failedItems.length,
    created: createdProducts,
    updated: updatedCodes,
    skipped: skippedCodes,
    failed: failedItems,
  }, { status: 201 })
})
