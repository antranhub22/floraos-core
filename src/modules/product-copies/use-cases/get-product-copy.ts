import { AppError } from "@/core/http/errors";
import { ProductCopyRepository } from "../infra/product-copy-repository";
import type { TenantContext } from "@/core/tenancy";

export async function getProductCopy(ctx: TenantContext, id: string) {
  const repo = new ProductCopyRepository();
  const copy = await repo.findById(ctx, id);
  if (!copy) throw new AppError("NOT_FOUND", "Không tìm thấy dữ liệu bán hàng");
  return copy;
}

export async function listProductCopies(ctx: TenantContext, productId?: string) {
  const repo = new ProductCopyRepository();
  if (productId) {
    return repo.listByProduct(ctx, productId);
  }
  return repo.listPendingApproval(ctx);
}