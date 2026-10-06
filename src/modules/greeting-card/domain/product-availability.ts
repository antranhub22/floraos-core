/**
 * Mẫu còn bán được không, theo tồn kho `product_inventory`. Cùng quy tắc với Product Master Index
 * (`product-master-index-repository.ts`): chỉ xét dòng tồn kho của ĐÚNG chi nhánh sản phẩm đang gắn;
 * sản phẩm chưa gắn chi nhánh hoặc chưa khai tồn kho → coi là còn bán (không suy diễn gộp nhiều
 * chi nhánh). `PRE_ORDER_ONLY` vẫn đặt được. Pure TypeScript.
 */

export interface InventoryRow {
  branch_id: string
  status: string
  quantity_available: number | null
}

export function isProductAvailable(product: { branch_id?: string | null | undefined; inventory?: readonly InventoryRow[] | null | undefined }): boolean {
  if (!product.branch_id) return true
  const row = product.inventory?.find((r) => r.branch_id === product.branch_id)
  if (!row) return true
  if (row.status === "OUT_OF_STOCK") return false
  return row.quantity_available === null || row.quantity_available > 0 || row.status === "PRE_ORDER_ONLY"
}

export const SOLD_OUT_MESSAGE = "Mẫu này vừa tạm hết hàng — vui lòng chọn mẫu khác hoặc liên hệ cửa hàng"
