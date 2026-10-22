import type { TenantContext } from "@/core/tenancy"
import { trashItem } from "@/modules/storage/use-cases/manage-trash"

/** `DELETE /assets/:id` (`G3`, trần cứng Điều hành) — bỏ ảnh vào Thùng rác 30 ngày, khôi phục được. */
export async function deleteAsset(ctx: TenantContext, id: string): Promise<void> {
  await trashItem(ctx, { type: "RAW_ASSET", id })
}
