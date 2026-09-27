/**
 * Mô hình điều hướng một nguồn (Single Source of Truth) — đặc tả 03-UX §3, 03b §5.
 *
 * Luật thuần — không import React, không import icon. Icon gắn ở tầng hiển thị
 * qua `iconKey`.
 */

import type { RoleUxDefinition } from "@/modules/organization/domain/role-ux-catalog"

export type NavGroupKey =
  | "viec-chinh"
  | "ban-hang"
  | "san-pham"
  | "noi-dung"
  | "van-hanh"
  | "thiet-lap"

export interface NavEntry {
  href: string
  label: string
  group: Exclude<NavGroupKey, "viec-chinh">
  iconKey: string
  capability?: string
  status?: "READY" | "COMING_SOON"
  mobileLabel?: string
}

export interface NavGroup {
  key: NavGroupKey
  label: string
  entries: NavEntry[]
}

export interface NavView {
  groups: NavGroup[]
}

export const HOME_ENTRY: NavEntry = {
  href: "/",
  label: "Trang chủ",
  group: "ban-hang",
  iconKey: "Home",
  mobileLabel: "Trang chủ",
}

export const NAV_GROUP_CONFIG: readonly {
  key: Exclude<NavGroupKey, "viec-chinh">
  label: string
}[] = [
  { key: "ban-hang", label: "Bán hàng & Khách" },
  { key: "san-pham", label: "Sản phẩm" },
  { key: "noi-dung", label: "Nội dung & Tiếp thị" },
  { key: "van-hanh", label: "Vận hành" },
  { key: "thiet-lap", label: "Thiết lập" },
] as const

export const NAV_ENTRIES: readonly NavEntry[] = [
  // 1. Nhóm Bán hàng & Khách
  {
    href: "/khach-hang",
    label: "Khách hàng",
    group: "ban-hang",
    iconKey: "Users",
    capability: "Q1",
    mobileLabel: "Khách hàng",
  },
  {
    href: "/don-hang",
    label: "Đơn hàng",
    group: "ban-hang",
    iconKey: "ShoppingBag",
    capability: "R1",
    mobileLabel: "Đơn hàng",
  },
  {
    href: "/hoi-thoai",
    label: "Hội thoại",
    group: "ban-hang",
    iconKey: "Bot",
    capability: "T1",
    mobileLabel: "Hội thoại",
  },
  {
    href: "/catalog",
    label: "Catalog & QR",
    group: "ban-hang",
    iconKey: "Globe",
    capability: "J1",
    mobileLabel: "Catalog",
  },

  // 2. Nhóm Sản phẩm
  {
    href: "/san-pham",
    label: "Sản phẩm & Giá",
    group: "san-pham",
    iconKey: "Tag",
    capability: "L1",
    mobileLabel: "Sản phẩm",
  },
  {
    href: "/tai-anh",
    label: "Quét ảnh hoa",
    group: "san-pham",
    iconKey: "Camera",
    capability: "H1",
    mobileLabel: "Tải ảnh",
  },
  {
    href: "/kho-du-lieu",
    label: "Kho dữ liệu",
    group: "san-pham",
    iconKey: "Folder",
    capability: "G1",
    mobileLabel: "Kho dữ liệu",
  },
  {
    href: "/gia",
    label: "Tính giá",
    group: "san-pham",
    iconKey: "WalletCards",
    capability: "L6",
    mobileLabel: "Tính giá",
  },

  // 3. Nhóm Nội dung & Tiếp thị
  {
    href: "/market-intelligence",
    label: "Nghiên cứu thị trường",
    group: "noi-dung",
    iconKey: "TrendingUp",
    capability: "V2",
    mobileLabel: "Thị trường",
  },
  {
    href: "/creative-studio",
    label: "Creative Studio",
    group: "noi-dung",
    iconKey: "Sparkles",
    capability: "I1",
    mobileLabel: "Studio",
  },
  {
    href: "/creative-studio?tab=area-d",
    label: "Ảnh marketing",
    group: "noi-dung",
    iconKey: "Wand2",
    capability: "I4",
    mobileLabel: "Ảnh mẫu",
  },
  {
    href: "/video",
    label: "Video",
    group: "noi-dung",
    iconKey: "Video",
    capability: "I1",
    mobileLabel: "Video",
  },
  {
    href: "/noi-dung",
    label: "Viết nội dung",
    group: "noi-dung",
    iconKey: "FileText",
    capability: "I1",
    mobileLabel: "Nội dung",
  },
  {
    href: "/lich-dang",
    label: "Lịch đăng",
    group: "noi-dung",
    iconKey: "Share2",
    mobileLabel: "Lịch đăng",
  },
  {
    href: "/kho-templates",
    label: "Kho mẫu",
    group: "noi-dung",
    iconKey: "LayoutTemplate",
    mobileLabel: "Kho mẫu",
  },

  // 4. Nhóm Vận hành
  {
    href: "/dieu-phoi",
    label: "Điều phối",
    group: "van-hanh",
    iconKey: "Radio",
    capability: "C23",
    mobileLabel: "Điều phối",
  },
  {
    href: "/job",
    label: "Job",
    group: "van-hanh",
    iconKey: "Clock",
    capability: "G4",
    mobileLabel: "Job",
  },
  {
    href: "/duyet",
    label: "Hàng chờ duyệt",
    group: "van-hanh",
    iconKey: "CheckCircle2",
    capability: "H3",
    mobileLabel: "Duyệt",
  },
  {
    href: "/so-lieu",
    label: "Số liệu",
    group: "van-hanh",
    iconKey: "BarChart3",
    capability: "U3",
    mobileLabel: "Số liệu",
  },
  {
    href: "/muc-dung",
    label: "Mức dùng",
    group: "van-hanh",
    iconKey: "WalletCards",
    capability: "G8",
    mobileLabel: "Mức dùng",
  },
  {
    href: "/audit",
    label: "Nhật ký kiểm toán",
    group: "van-hanh",
    iconKey: "ShieldCheck",
    capability: "G9",
    mobileLabel: "Kiểm toán",
  },

  // 5. Nhóm Thiết lập
  {
    href: "/ho-so",
    label: "Hồ sơ cửa hàng",
    group: "thiet-lap",
    iconKey: "Settings2",
    capability: "F1",
    mobileLabel: "Hồ sơ",
  },
  {
    href: "/tri-thuc",
    label: "Tri thức",
    group: "thiet-lap",
    iconKey: "BookOpen",
    mobileLabel: "Tri thức",
  },
  {
    href: "/cai-dat-ai",
    label: "Chính sách AI",
    group: "thiet-lap",
    iconKey: "Cpu",
    capability: "U1",
    mobileLabel: "Chính sách AI",
  },
  {
    href: "/ket-noi",
    label: "Kết nối kênh",
    group: "thiet-lap",
    iconKey: "Share2",
    mobileLabel: "Kết nối",
  },
  {
    href: "/bo-may",
    label: "Bộ máy phân tích ảnh",
    group: "thiet-lap",
    iconKey: "Cpu",
    capability: "H4",
    mobileLabel: "Bộ máy",
  },
  {
    href: "/cai-dat",
    label: "Cài đặt",
    group: "thiet-lap",
    iconKey: "Settings2",
    status: "COMING_SOON",
    mobileLabel: "Cài đặt",
  },
] as const

const RESERVED_MOBILE_HREFS = new Set(["/", "/duyet", "/job", "/tai-anh", "/them"])

/**
 * Lọc theo năng lực → gom "Việc chính" theo vai (03b §5) → trả nhóm, không trùng mục.
 */
export function buildNav(
  can: (code: string) => boolean,
  role: RoleUxDefinition | null
): NavView {
  const isAccessible = (item: NavEntry) => !item.capability || can(item.capability)

  // Gom các mục Việc chính nếu vai có cấu hình navPriority
  const pinnedHrefs = new Set<string>()
  const viecChinhEntries: NavEntry[] = []

  if (role && role.navPriority.length > 0) {
    // Luôn bắt đầu bằng Trang chủ
    viecChinhEntries.push(HOME_ENTRY)
    pinnedHrefs.add(HOME_ENTRY.href)

    for (const href of role.navPriority) {
      if (pinnedHrefs.has(href)) continue
      const found = NAV_ENTRIES.find((entry) => entry.href === href)
      // Mục COMING_SOON không bao giờ vào "Việc chính" (tiêu chí T3.1)
      if (found && found.status !== "COMING_SOON" && isAccessible(found)) {
        viecChinhEntries.push(found)
        pinnedHrefs.add(found.href)
      }
    }
  }

  const groups: NavGroup[] = []

  if (viecChinhEntries.length > 0 && role) {
    groups.push({
      key: "viec-chinh",
      label: `Việc chính · ${role.label}`,
      entries: viecChinhEntries,
    })
  }

  for (const config of NAV_GROUP_CONFIG) {
    const groupEntries = NAV_ENTRIES.filter(
      (entry) =>
        entry.group === config.key &&
        !pinnedHrefs.has(entry.href) &&
        isAccessible(entry)
    )
    if (groupEntries.length > 0) {
      groups.push({
        key: config.key,
        label: config.label,
        entries: groupEntries,
      })
    }
  }

  return { groups }
}

/**
 * Ô thứ hai của thanh dưới (thay logic cũ trong bottom-nav.tsx).
 */
export function mobileSecondSlot(
  can: (code: string) => boolean,
  role: RoleUxDefinition | null
): NavEntry {
  const defaultEntry =
    NAV_ENTRIES.find((e) => e.href === "/san-pham") ?? NAV_ENTRIES[0]!

  if (!role || !role.navPriority) return defaultEntry

  for (const href of role.navPriority) {
    if (RESERVED_MOBILE_HREFS.has(href)) continue
    const found = NAV_ENTRIES.find((entry) => entry.href === href)
    if (
      found &&
      found.status !== "COMING_SOON" &&
      (!found.capability || can(found.capability))
    ) {
      return found
    }
  }

  return defaultEntry
}
