import type { TenantContext } from "@/core/tenancy"
import {
  mapCatalogRowToProduct,
  validateCatalogRow,
  type CatalogSourceRow,
  type ProductImportRow,
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

  // Map TOÀN BỘ trước khi chạm cơ sở dữ liệu: một dòng hỏng thì biết ngay ở
  // đây, không phải sau khi đã ghi vài trăm dòng.
  const mappedRows: ProductImportRow[] = []
  for (const row of rows) {
    dataWarnings.push(...validateCatalogRow(row))
    try {
      mappedRows.push(mapCatalogRowToProduct(row, importedAt))
    } catch (error) {
      failed.push({ code: row.code || "(rỗng)", error: (error as Error).message })
    }
  }

  // Một lượt đọc cho cả danh mục thay vì một lượt mỗi dòng — xem
  // `ProductRepository.listExistingCodes`. Vẫn giữ nguyên tính idempotent:
  // mã đã có thì bỏ qua, không ghi đè.
  const existingCodes = await repo.listExistingCodes(
    ctx,
    mappedRows.map((row) => row.code)
  )

  // Hai dòng cùng mã trong CÙNG tệp nguồn: dòng đầu tạo, dòng sau tính là
  // bỏ qua — nếu chỉ dựa vào `existingCodes` đọc lúc đầu thì dòng sau sẽ
  // chạy `create` và vỡ ở `@@unique([organization_id, code])`.
  const writtenInThisRun = new Set<string>()

  for (const mapped of mappedRows) {
    if (existingCodes.has(mapped.code) || writtenInThisRun.has(mapped.code)) {
      skippedExisting += 1
      continue
    }

    await repo.create(ctx, {
      code: mapped.code,
      name: mapped.name,
      status: mapped.status,
      attributes: mapped.attributes as unknown as Record<string, unknown>,
    })
    writtenInThisRun.add(mapped.code)
    created += 1
  }

  return { created, skippedExisting, failed, dataWarnings }
}
