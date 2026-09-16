import type { DbClient } from "../infra/db-client"
import { BusinessProfileRepository } from "../infra/business-profile-repository"
import { BrandProfileRepository } from "../infra/brand-profile-repository"
import type { TenantContext } from "@/core/tenancy"

export const MOC_LAN_BUSINESS_PROFILE = {
  display_name: "Tiệm Hoa Mộc Lan",
  legal_name: "Hộ Kinh Doanh Hoa Tươi Mộc Lan",
  phone: "0900 123 456",
  email: "contact@tiemhoamoclan.vn",
  address: "Số 88 Đường Hoa Mộc Lan, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  website: "https://tiemhoamoclan.vn",
  tax_code: "0318999888",
  description: "Tiệm hoa nghệ thuật Mộc Lan — Chuyên hoa thiết kế, hoa sinh nhật, hoa sự kiện và hoa cưới cao cấp",
  operating_hours: {
    open: "07:30",
    close: "21:30",
  },
  social_links: {
    facebook: "https://facebook.com/tiemhoamoclan",
    zalo: "https://zalo.me/0900123456",
    instagram: "https://instagram.com/tiemhoamoclan",
  },
}

export const MOC_LAN_BRAND_PROFILE = {
  primary_color: "#e11d48",
  secondary_color: "#fda4af",
  accent_color: "#f59e0b",
  background_color: "#ffffff",
  text_color: "#111827",
  font_heading: "Playfair Display",
  font_body: "Inter",
  logo_asset_id: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=300&auto=format&fit=crop&q=80",
  tone_of_voice: "romantic",
  hashtags: {
    default: ["#tiemhoamoclan", "#hoatuoisaigon", "#hoathietke", "#hoasinhnhat", "#hoatinhyeu"],
  },
  cta_templates: {
    default: "Nhắn tin Zalo hoặc gọi ngay Hotline để nghệ nhân Mộc Lan tư vấn mẫu hoa độc bản dành riêng cho bạn!",
    free_gifts: [
      "Tặng thiệp chúc mừng thiết kế riêng theo thông điệp",
      "Tặng gói nước dưỡng hoa Chrysal giúp hoa tươi lâu 5 - 7 ngày",
      "Ruy băng lụa cao cấp in nhũ sang trọng",
    ],
    guarantees: [
      "100% hoa tươi mới tuyển chọn nhập trong ngày",
      "Chụp hình hoa thực tế gửi quý khách duyệt trước khi giao",
      "Giao hoa hỏa tốc đúng giờ (60 - 90 phút nội thành)",
      "Bảo hành đổi mới nếu hoa bị dập héo khi vận chuyển",
    ],
  },
  forbidden_styles: {
    banned_words: ["hoa rẻ", "phá giá", "xả hàng tồn", "thanh lý hoa héo"],
  },
}

/**
 * Nạp 100% dữ liệu mẫu chuẩn cho workspace trải nghiệm (EXPERIENCE).
 * Đảm bảo người dùng mới mở màn hình /ho-so, Thẻ chào hàng M01c, E-Catalog
 * đều có dữ liệu hoàn chỉnh, không bị rỗng.
 */
export async function seedExperienceMasterProfile(
  db: DbClient,
  organizationId: string
): Promise<void> {
  const dummyCtx: TenantContext = {
    organizationId,
    userId: "system",
    workspaceId: "system",
    branchId: null,
    capabilities: new Set<string>(),
  }

  const bizRepo = new BusinessProfileRepository(db)
  const brandRepo = new BrandProfileRepository(db)

  await Promise.all([
    bizRepo.upsert(dummyCtx, MOC_LAN_BUSINESS_PROFILE),
    brandRepo.upsert(dummyCtx, MOC_LAN_BRAND_PROFILE),
  ])
}
