/**
 * ĐP-3 §6.2 mục 3.11 — Cửa duy nhất lọc một view/bản copy theo đối tượng
 * xem (`INTERNAL` · `PARTNER` · `SHIPPER` · `CUSTOMER`). Dùng cho T07 (đối
 * tác), T18 (shipper), và nội dung copy Zalo/PNG — không route/component
 * nào khác được tự quyết định ẩn/hiện trường theo đối tượng xem, để rò rỉ
 * giá bán/PII không xảy ra ở một nơi thứ hai ngoài đây (rủi ro "Critical"
 * của kế hoạch mục 12).
 *
 * Hàm thuần — nhận một object phẳng (view đã dựng xong) và trả bản đã lọc
 * khoá theo `EffectiveFieldConfig.visibility[audience]`. Khoá không có cấu
 * hình (không nằm trong `configs`) giữ nguyên — nền quản trị trường ĐP-3
 * mới phủ một phần trường (xem field-registry.ts), phần còn lại vẫn theo
 * luật ẩn/hiện viết tay hiện có cho tới khi được khai đủ.
 */
import type { EffectiveFieldConfig } from "./field-rules"
import type { FieldAudience } from "./core-field-registry"

export function projectForAudience<T extends Record<string, unknown>>(
  view: T,
  configs: readonly EffectiveFieldConfig[],
  audience: FieldAudience
): Partial<T> {
  if (audience === "INTERNAL") return { ...view }
  const hiddenKeys = new Set(
    configs.filter((c) => !c.visibility[audience]).map((c) => c.key)
  )
  const result: Partial<T> = { ...view }
  for (const key of hiddenKeys) {
    if (key in result) delete result[key as keyof T]
  }
  return result
}
