/**
 * Giá theo `feature`, tính bằng credit — đặc tả 07 mục 7, ví dụ ở đặc tả 06
 * mục 8 (`"usage": { "cost_credit": 1, "balance_after": 479 }`).
 *
 * Không tài liệu nào của bộ đặc tả 13 tệp cho một bảng giá theo tính năng —
 * đây là một giả định đơn giản hoá, ghi ở
 * `docs/dac-ta/TECHNICAL_DEBT.md`. Hằng số, không phải cấu hình theo tổ
 * chức: D2 chốt nền tảng giữ khoá và tính credit, chưa nói giá khác nhau
 * giữa các tổ chức.
 *
 * Thuần: không import hạ tầng, test không cần cơ sở dữ liệu.
 */
const FEATURE_COST_CREDIT: Readonly<Record<string, number>> = {
  "vision.analyze": 1,
  "media.optimize": 2,
  "catalog.generate": 1,
  "landing.generate": 1,
  "video.render": 5,
}

const DEFAULT_COST_CREDIT = 1

export function costCreditForFeature(feature: string): number {
  return FEATURE_COST_CREDIT[feature] ?? DEFAULT_COST_CREDIT
}
