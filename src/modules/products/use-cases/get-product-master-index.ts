/**
 * Use-case: Get Product Master Index (Trích xuất đầy đủ hồ sơ sản phẩm ngành hoa).
 * Clean Architecture: Domain/Use-case KHÔNG import Prisma trực tiếp.
 */

import type { TenantContext } from "@/core/tenancy/tenant-context"
import type { ProductMasterIndex } from "../domain/product-master-index"
import { ProductMasterIndexRepository } from "../infra/product-master-index-repository"

export async function getProductMasterIndex(
  ctx: TenantContext,
  productId: string,
  repo: ProductMasterIndexRepository = new ProductMasterIndexRepository()
): Promise<ProductMasterIndex | null> {
  return repo.getById(ctx, productId)
}

export async function listProductMasterIndex(
  ctx: TenantContext,
  limit = 50,
  repo: ProductMasterIndexRepository = new ProductMasterIndexRepository()
): Promise<ProductMasterIndex[]> {
  return repo.list(ctx, limit)
}
