import type { TenantContext } from "@/core/tenancy"
import {
  mapCatalogRowToProduct,
  validateCatalogRow,
  type CatalogSourceRow,
} from "@/modules/avi-gift-import/domain/catalog-mapping"
import { ProductRepository } from "@/modules/products/infra/product-repository"

export type ImportCatalogResult = {
  created: number
  skippedExisting: number
  failed: Array<{ code: string; error: string }>
  dataWarnings: string[]
}

/**
 * Nạp danh mục AVI GIFT vào `products` (P8, H7). Idempotent theo `code`
 * (`@@unique([organization_id, code])`) — chạy lại một lượt nạp đã chạy
 * trước đó chỉ BỎ QUA những mã đã có, không ghi đè và không lỗi. An toàn
 * để chạy lại khi lượt trước dừng giữa chừng (mất mạng tới Postgres, hết bộ
 * nhớ…) mà không tạo dữ liệu trùng.
 *
 * Không dùng `createProduct` (`use-cases/create-product.ts`, `L2`) — hàm đó
 * NÉM lỗi 409 khi trùng mã, đúng cho một người bấm tạo tay từng sản phẩm,
 * sai cho một lượt nạp 1.316 dòng cần chạy lại được. Gọi thẳng
 * `ProductRepository`, cùng cách `approveAnalysis` (P5) gọi thẳng
 * repository khi luật nghiệp vụ của use-case đơn lẻ không khớp ngữ cảnh.
 */
export async function importCatalog(
  ctx: TenantContext,
  rows: CatalogSourceRow[],
  importedAt: Date
): Promise<ImportCatalogResult> {
  const repo = new ProductRepository()
  let created = 0
  let skippedExisting = 0
  const failed: Array<{ code: string; error: string }> = []
  const dataWarnings: string[] = []

  for (const row of rows) {
    dataWarnings.push(...validateCatalogRow(row))

    let mapped
    try {
      mapped = mapCatalogRowToProduct(row, importedAt)
    } catch (error) {
      failed.push({ code: row.code || "(rỗng)", error: (error as Error).message })
      continue
    }

    const existing = await repo.findByCode(ctx, mapped.code)
    if (existing) {
      skippedExisting += 1
      continue
    }

    await repo.create(ctx, {
      code: mapped.code,
      name: mapped.name,
      status: mapped.status,
      attributes: mapped.attributes as unknown as Record<string, unknown>,
    })
    created += 1
  }

  return { created, skippedExisting, failed, dataWarnings }
}
