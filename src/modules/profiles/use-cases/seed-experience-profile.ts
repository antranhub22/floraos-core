import type { DbClient } from "../infra/db-client"
import { BusinessProfileRepository } from "../infra/business-profile-repository"
import { BrandProfileRepository } from "../infra/brand-profile-repository"
import type { TenantContext } from "@/core/tenancy"

export const MOC_LAN_BUSINESS_PROFILE = {
  display_name: "Siin Store",
  legal_name: "Công ty TNHH Siin Store",
  phone: "0900 123 456",
  email: "hello@siinstore.vn",
  address: "42 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  website: "https://siinstore.vn",
  tax_code: "0318999888",
  description: "Siin Store — Cửa hàng hoa tươi cao cấp, chuyên hoa thiết kế, hoa sinh nhật, hoa sự kiện và hoa cưới",
  operating_hours: {
    open: "07:30",
    close: "21:30",
  },
  social_links: {
    facebook: "https://facebook.com/siinstore",
    zalo: "https://zalo.me/0900123456",
    instagram: "https://instagram.com/siinstore",
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
  logo_asset_id: "/brand/siin-store-logo.jpg",
  tone_of_voice: "romantic",
  hashtags: {
    default: ["#siinstore", "#hoatuoisaigon", "#hoathietke", "#hoasinhnhat", "#hoatinhyeu"],
  },
  cta_templates: {
    default: "Nhắn tin Zalo hoặc gọi ngay Hotline để đội ngũ Siin Store tư vấn mẫu hoa độc bản dành riêng cho bạn!",
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
 * CHỈ tạo nếu chưa có hồ sơ — không ghi đè dữ liệu thật đã cập nhật qua UI.
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

  const [existingBiz, existingBrand] = await Promise.all([
    bizRepo.current(dummyCtx),
    brandRepo.current(dummyCtx),
  ])

  const tasks: Promise<unknown>[] = []
  if (!existingBiz) {
    tasks.push(bizRepo.upsert(dummyCtx, MOC_LAN_BUSINESS_PROFILE))
  }
  if (!existingBrand) {
    tasks.push(brandRepo.upsert(dummyCtx, MOC_LAN_BRAND_PROFILE))
  }

  if (tasks.length > 0) {
    await Promise.all(tasks)
  }
}

