/**
 * Use-case: Delete Customer (Xoá khách hàng - Gác bằng Hard Cap Q4 điều hành).
 * "Xoá" = bỏ vào Thùng rác 30 ngày, khôi phục được; dọn hẳn do bộ quét nền.
 */

import type { TenantContext } from "@/core/tenancy/tenant-context"
import { trashItem } from "@/modules/storage/use-cases/manage-trash"

export async function deleteCustomer(ctx: TenantContext, id: string): Promise<void> {
  await trashItem(ctx, { type: "CUSTOMER", id })
}
