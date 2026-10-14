/** Lựa chọn nhanh của "Tạo nhanh bộ sưu tập": dịp tặng, dáng hoa, loại hoa, tone màu, khung giá. */

export const COMMON_OCCASIONS = [
  "Sinh nhật",
  "Khai trương",
  "Kỷ niệm",
  "Chúc mừng",
  "Cảm ơn",
  "Chia buồn",
]

export const COMMON_CATEGORIES = [
  "Bó hoa",
  "Giỏ hoa",
  "Kệ hoa",
  "Lẵng hoa",
  "Hộp hoa",
  "Bình hoa",
]

export const COMMON_FLOWERS = [
  "Hoa hồng",
  "Lan hồ điệp",
  "Hướng dương",
  "Cẩm tú cầu",
  "Baby",
  "Cúc tana",
]

export const COMMON_COLORS = [
  "Pastel",
  "Đỏ",
  "Vàng / Cam",
  "Hồng",
  "Trắng",
  "Xanh / Tím",
]

export interface QuickBudgetOption {
  id: string
  label: string
  min: number
  max: number
}

export const QUICK_BUDGETS: QuickBudgetOption[] = [
  { id: "b1", label: "Dưới 500k", min: 0, max: 500_000 },
  { id: "b2", label: "500k - 800k", min: 500_000, max: 800_000 },
  { id: "b3", label: "800k - 1.5tr", min: 800_000, max: 1_500_000 },
  { id: "b4", label: "Trên 1.5tr", min: 1_500_000, max: 10_000_000 },
]
