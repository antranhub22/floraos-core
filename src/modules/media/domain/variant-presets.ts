import type { StudioVariantItem } from "@/components/templates/creative-studio/studio-variant-card"

/**
 * Danh mục bối cảnh không gian chuẩn cho Biến thể Marketing M04b (SSOT)
 */
export const M04B_VARIANT_PRESETS: StudioVariantItem[] = [
  {
    id: "transparent",
    name: "Tách nền trong suốt (PNG)",
    thumbnailUrl:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='c' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Crect width='10' height='10' fill='%23eee'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23eee'/%3E%3Crect x='10' width='10' height='10' fill='%23fff'/%3E%3Crect y='10' width='10' height='10' fill='%23fff'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23c)'/%3E%3Ccircle cx='50' cy='50' r='24' fill='%23e11d48' opacity='0.2'/%3E%3Ctext x='50' y='55' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle' fill='%23be123c'%3EPNG%3C/text%3E%3C/svg%3E",
    description: "Khử nền U2-Net, giữ trọn chi tiết cành hoa, xuất định dạng PNG trong suốt",
    tag: "AIC-11 Lõi",
  },
  {
    id: "studio_white",
    name: "Studio trắng tinh khôi",
    thumbnailUrl:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f8fafc'/%3E%3Cellipse cx='50' cy='85' rx='35' ry='8' fill='%23e2e8f0'/%3E%3Ctext x='50' y='50' font-family='sans-serif' font-size='11' font-weight='bold' text-anchor='middle' fill='%2364748b'%3EStudio Trắng%3C/text%3E%3C/svg%3E",
    description: "Nền vô cực trắng studio chuẩn e-commerce, đổ bóng mềm tự nhiên",
    tag: "Bán chạy",
  },
  {
    id: "wedding",
    name: "Bàn tiệc cưới lãng mạn",
    thumbnailUrl:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23fdf2f8'/%3E%3Cstop offset='100%25' stop-color='%23fce7f3'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23g)'/%3E%3Ccircle cx='30' cy='30' r='10' fill='%23f472b6' opacity='0.3'/%3E%3Ccircle cx='70' cy='40' r='14' fill='%23fb7185' opacity='0.25'/%3E%3Ctext x='50' y='65' font-family='sans-serif' font-size='11' font-weight='bold' text-anchor='middle' fill='%239d174d'%3ETiệc Cưới%3C/text%3E%3C/svg%3E",
    description: "Khăn trải bàn voan lụa hồng phấn, ánh nến bokeh ấm áp sang trọng",
    tag: "Lễ hội",
  },
  {
    id: "living_room",
    name: "Phòng khách thanh lịch",
    thumbnailUrl:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23fef3c7' opacity='0.6'/%3E%3Crect x='10' y='65' width='80' height='25' rx='3' fill='%23d97706' opacity='0.3'/%3E%3Ctext x='50' y='45' font-family='sans-serif' font-size='11' font-weight='bold' text-anchor='middle' fill='%23b45309'%3EPhòng Khách%3C/text%3E%3C/svg%3E",
    description: "Kệ đá cẩm thạch đón nắng ban mai nhẹ nhàng qua rèm cửa",
    tag: "Đời sống",
  },
  {
    id: "wood_minimal",
    name: "Gỗ tối giản Bắc Âu",
    thumbnailUrl:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f5ebe0'/%3E%3Crect x='0' y='70' width='100' height='30' fill='%23d5bdaf'/%3E%3Ctext x='50' y='45' font-family='sans-serif' font-size='11' font-weight='bold' text-anchor='middle' fill='%238d7b68'%3EBắc Âu%3C/text%3E%3C/svg%3E",
    description: "Bàn gỗ mộc tự nhiên, tường xi măng vi xi mang phong cách mộc",
    tag: "Tối giản",
  },
  {
    id: "luxury_hotel",
    name: "Sảnh khách sạn 5 sao",
    thumbnailUrl:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231e293b'/%3E%3Ccircle cx='50' cy='40' r='20' fill='%23f59e0b' opacity='0.25'/%3E%3Ctext x='50' y='65' font-family='sans-serif' font-size='11' font-weight='bold' text-anchor='middle' fill='%23fef08a'%3ELuxury%3C/text%3E%3C/svg%3E",
    description: "Sảnh đá hoa cương phản chiếu ánh đèn chùm lộng lẫy cao cấp",
    tag: "Cao cấp",
  },
]

export function getVariantPreset(id: string): StudioVariantItem {
  return (
    M04B_VARIANT_PRESETS.find((p) => p.id === id) ??
    M04B_VARIANT_PRESETS[0]!
  )
}

export function isValidVariantPreset(id: string): boolean {
  return M04B_VARIANT_PRESETS.some((p) => p.id === id)
}

