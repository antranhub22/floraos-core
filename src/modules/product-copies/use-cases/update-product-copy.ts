import { AppError } from "@/core/http/errors";
import { ProductCopyRepository } from "../infra/product-copy-repository";
import { validateProductCopyEdited } from "../domain/product-copy-rules";
import type { TenantContext } from "@/core/tenancy";

/**
 * Cập nhật edited (người sửa trước khi duyệt) — H5
 * Chỉ cho phép khi approval_state = PENDING
 */
export async function updateProductCopy(
  ctx: TenantContext,
  id: string,
  edited: unknown
): Promise<void> {
  if (!validateProductCopyEdited(edited)) {
    throw new AppError("VALIDATION_FAILED", "Dữ liệu sửa không hợp lệ");
  }

  const repo = new ProductCopyRepository();
  await repo.updateEdited(ctx, id, edited);
}