import { describe, expect, it } from "vitest"
import {
  buildNav,
  mobileSecondSlot,
  NAV_ENTRIES,
  HOME_ENTRY,
} from "./nav-model"
import { stripVietnamese } from "@/lib/utils"
import { defaultCodesForSystemRole } from "@/core/rbac/capability-catalog"
import { ROLE_UX_CATALOG } from "@/modules/organization/domain/role-ux-catalog"

describe("nav-model (Kiến trúc điều hướng SSOT)", () => {
  const roleSales = ROLE_UX_CATALOG.find((r) => r.key === "sales")!
  const roleCoordinator = ROLE_UX_CATALOG.find((r) => r.key === "coordinator")!

  it("1. can = () => true + role = null → đủ 5 nhóm (trừ viec-chinh), không mục trùng", () => {
    const nav = buildNav(() => true, null)
    expect(nav.groups.map((g) => g.key)).toEqual([
      "ban-hang",
      "san-pham",
      "noi-dung",
      "van-hanh",
      "thiet-lap",
    ])

    const allHrefs = nav.groups.flatMap((g) => g.entries.map((e) => e.href))
    const uniqueHrefs = new Set(allHrefs)
    expect(allHrefs.length).toBe(uniqueHrefs.size)
  })

  it("2. Vai sales với năng lực mặc định của sale → không có /dieu-phoi, không có /cai-dat-ai; viec-chinh bắt đầu bằng /, rồi /khach-hang", () => {
    const saleCodes = new Set(defaultCodesForSystemRole("sale"))
    const canSale = (code: string) => saleCodes.has(code)

    const nav = buildNav(canSale, roleSales)
    const allHrefs = nav.groups.flatMap((g) => g.entries.map((e) => e.href))

    expect(allHrefs).not.toContain("/dieu-phoi")
    expect(allHrefs).not.toContain("/cai-dat-ai")

    const viecChinhGroup = nav.groups.find((g) => g.key === "viec-chinh")
    expect(viecChinhGroup).toBeDefined()
    expect(viecChinhGroup!.entries[0]?.href).toBe("/")
    expect(viecChinhGroup!.entries[1]?.href).toBe("/khach-hang")
  })

  it("3. Vai coordinator → ô thứ hai mobile là /dieu-phoi", () => {
    const coordCodes = new Set(defaultCodesForSystemRole("dieu_phoi"))
    const canCoord = (code: string) => coordCodes.has(code)

    const slot2 = mobileSecondSlot(canCoord, roleCoordinator)
    expect(slot2.href).toBe("/dieu-phoi")
  })

  it("4. Mục COMING_SOON luôn có mặt (để hiện vô hiệu) nhưng không bao giờ vào viec-chinh", () => {
    const nav = buildNav(() => true, roleSales)
    const viecChinh = nav.groups.find((g) => g.key === "viec-chinh")!

    expect(viecChinh.entries.some((e) => e.status === "COMING_SOON")).toBe(false)

    const allEntries = nav.groups.flatMap((g) => g.entries)
    const comingSoonEntries = allEntries.filter((e) => e.status === "COMING_SOON")
    expect(comingSoonEntries.length).toBeGreaterThan(0)
    expect(comingSoonEntries.map((e) => e.href)).toContain("/muc-dung")
    expect(comingSoonEntries.map((e) => e.href)).toContain("/cai-dat")
  })

  it("5. Mỗi href có mặt đúng một lần trong toàn bộ kết quả", () => {
    const rolesToTest = [null, roleSales, roleCoordinator]
    for (const role of rolesToTest) {
      const nav = buildNav(() => true, role)
      const allHrefs = nav.groups.flatMap((g) => g.entries.map((e) => e.href))
      const uniqueHrefs = new Set(allHrefs)
      expect(allHrefs.length).toBe(uniqueHrefs.size)
    }
  })

  it("6. Không chứa nhãn mã kỹ thuật (R8) trong toàn bộ NAV_ENTRIES", () => {
    const techPatterns = [
      /\bM0[0-9][a-z]?\b/i,
      /\bSSOT\b/i,
      /Khu vực [A-F]/i,
      /Tháp Vận Hành/i,
    ]

    for (const entry of NAV_ENTRIES) {
      for (const pattern of techPatterns) {
        expect(entry.label).not.toMatch(pattern)
        if (entry.mobileLabel) {
          expect(entry.mobileLabel).not.toMatch(pattern)
        }
      }
    }
  })

  it("7. Tìm kiếm nhanh không phân biệt dấu tiếng Việt", () => {
    const filterByQuery = (q: string) => {
      const normalizedQuery = stripVietnamese(q.trim())
      return NAV_ENTRIES.filter((e) =>
        stripVietnamese(e.label).includes(normalizedQuery)
      )
    }

    const donResults = filterByQuery("don")
    expect(donResults.map((r) => r.href)).toContain("/don-hang")

    const khachResults = filterByQuery("khach")
    expect(khachResults.map((r) => r.href)).toContain("/khach-hang")

    const sanPhamResults = filterByQuery("san pham")
    expect(sanPhamResults.map((r) => r.href)).toContain("/san-pham")
  })
})
