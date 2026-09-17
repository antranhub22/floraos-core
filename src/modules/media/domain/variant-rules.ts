/**
 * Luật thuần của M04b — biến thể marketing dựng trên Master Image đã duyệt.
 *
 * M04b KHÔNG sinh pixel mới trên chính bó hoa. Nó lấy chủ thể đã có trong
 * Master Image, tách khỏi nền, rồi đặt vào một bối cảnh khác. Mọi đường sinh
 * lại bó hoa đều thuộc M04a và phải đi qua Identity Guard — luật này ghi ở
 * `BO_TINH_NANG_HIEN_TRANG.md` mục 2.2 và M04 mục A.
 *
 * Hệ quả trực tiếp tới thiết kế ở đây, và là lý do tệp này tồn tại:
 *
 * **Cổng Subject Integrity.** Vì lõi chủ thể phải giữ nguyên từng điểm ảnh,
 * "có giữ nguyên không" là một phép ĐO được, không phải một con số trang trí.
 * Worker đo tỷ lệ điểm ảnh trong lõi chủ thể (đã co biên, nên không tính phần
 * viền được làm mềm) trùng khít với Master Image, rồi gửi về khối
 * `variant_integrity`. Ba ngưỡng dưới đây dịch phép đo đó thành phán quyết,
 * cùng bộ từ vựng `SAFE`/`WARNING`/`REJECTED` với Identity Guard của M04a để
 * giao diện và người vận hành không phải học hai thang.
 *
 * Bản trước của M04b hiển thị 100 / 99 / 98 là ba hằng số gõ thẳng vào mã
 * giao diện. Con số đó nói với người bán một điều không ai đo — đó là lý do
 * `variantIntegrityResult` nhận số đo và ngưỡng, chứ không nhận sẵn một
 * phán quyết từ nơi khác.
 *
 * Tệp này không import hạ tầng.
 */

import { GUARD_RESULTS, type GuardResult } from "./optimization-rules"

export { GUARD_RESULTS }
export type { GuardResult }

export const MEDIA_VARIANT_FEATURE = "media.variant"

/** Bối cảnh không gian — SSOT của mã preset. Nhãn hiển thị ở `variant-presets.ts`. */
export const VARIANT_PRESET_IDS = [
  "transparent",
  "studio_white",
  "wedding",
  "living_room",
  "wood_minimal",
  "luxury_hotel",
] as const
export type VariantPresetId = (typeof VARIANT_PRESET_IDS)[number]

export const VARIANT_RATIOS = ["1:1", "4:5", "9:16", "16:9"] as const
export type VariantRatio = (typeof VARIANT_RATIOS)[number]

export function isVariantPresetId(value: unknown): value is VariantPresetId {
  return typeof value === "string" && (VARIANT_PRESET_IDS as readonly string[]).includes(value)
}

export function isVariantRatio(value: unknown): value is VariantRatio {
  return typeof value === "string" && (VARIANT_RATIOS as readonly string[]).includes(value)
}

/**
 * Ảnh nguồn của một lượt M04b phải là Master Image **đã duyệt**.
 *
 * Không phải để cho chặt chẽ hình thức: biến thể là thứ đem đi đăng bán, và
 * cổng 2 (`media.approve`/`I2`) là chỗ DUY NHẤT một con người xác nhận tấm
 * ảnh đại diện đúng sản phẩm thật. Dựng biến thể từ một Master còn chờ duyệt
 * là mở một đường vòng qua chính cổng đó.
 */
export function isEligibleMasterForVariants(asset: {
  kind: string
  approval_state: string
}): boolean {
  return asset.kind === "MASTER" && asset.approval_state === "APPROVED"
}

/** Ngưỡng của cổng Subject Integrity. Hằng trong mã, không trong cơ sở dữ liệu. */
export const SUBJECT_IDENTITY_SAFE = 0.999
export const SUBJECT_IDENTITY_WARNING = 0.99

/**
 * Dịch số đo thành phán quyết.
 *
 * Lõi chủ thể được sao chép nguyên khối nên giá trị ĐÚNG là `1`. Bất kỳ mức
 * sụt nào cũng nghĩa là có một bước trong dây chuyền đã vẽ đè lên bó hoa —
 * đó là một lỗi lập trình, không phải một biến động tự nhiên. Vì vậy ngưỡng
 * `SAFE` đặt sát 1 chứ không đặt "đủ tốt".
 */
export function variantIntegrityResult(subjectPixelIdentity: number): GuardResult {
  if (!Number.isFinite(subjectPixelIdentity)) return "REJECTED"
  if (subjectPixelIdentity >= SUBJECT_IDENTITY_SAFE) return "SAFE"
  if (subjectPixelIdentity >= SUBJECT_IDENTITY_WARNING) return "WARNING"
  return "REJECTED"
}

/** `REJECTED` không vào luồng duyệt — cùng luật với `YC-R5` của M04a. */
export function canApproveVariant(result: GuardResult): boolean {
  return result !== "REJECTED"
}

/** `WARNING` duyệt được, nhưng máy chủ phải NÓI ra cờ này (cùng `YC-R6`). */
export function variantRequiresWarning(result: GuardResult): boolean {
  return result === "WARNING"
}

export type VariantIntegrityBlock = {
  subject_pixel_identity: number
  generative_fill_used: boolean
  source_master_asset_id: string
  result: GuardResult
  ly_do: string[]
}

/**
 * Đọc khối đo từ payload sự kiện `variant_integrity`. Trả `null` khi thiếu
 * hoặc sai hình dạng — job chưa chạy tới bước đo là chuyện bình thường.
 *
 * `result` được TÍNH LẠI từ `subject_pixel_identity` tại đây thay vì tin giá
 * trị worker gửi kèm. Ngưỡng là luật nghiệp vụ; để worker vừa đo vừa tự
 * phán quyết là đặt luật ở hai nơi, rồi một ngày hai nơi lệch nhau mà không
 * ca thử nào thấy.
 */
export function parseVariantIntegrityBlock(payload: unknown): VariantIntegrityBlock | null {
  if (typeof payload !== "object" || payload === null) return null
  const p = payload as Record<string, unknown>

  const identity = p.subject_pixel_identity
  if (typeof identity !== "number" || !Number.isFinite(identity)) return null
  const masterId = p.source_master_asset_id
  if (typeof masterId !== "string" || masterId.length === 0) return null

  return {
    subject_pixel_identity: identity,
    generative_fill_used: p.generative_fill_used === true,
    source_master_asset_id: masterId,
    result: variantIntegrityResult(identity),
    ly_do: Array.isArray(p.ly_do) ? p.ly_do.filter((x): x is string => typeof x === "string") : [],
  }
}
