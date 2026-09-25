// Nợ #135 — menu đầy đủ trên điện thoại. Khoá ba điều:
// 1. Menu mobile dùng đúng danh sách của thanh bên desktop (không tự chép tay).
// 2. Mục có mã năng lực chỉ hiện khi phiên có năng lực đó; nhóm rỗng thì ẩn.
// 3. Mọi đường dẫn trong menu trỏ tới một trang có thật — trừ danh sách
//    "chưa xây" ghi rõ bên dưới (GĐ4 kế hoạch đồng bộ wireframe 25/09).

import { existsSync } from "node:fs"
import path from "node:path"
import { createElement, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { NAV_GROUPS } from "@/components/layout/desktop-nav"
import { MobileModuleMenu, visibleNavGroups } from "@/components/layout/mobile-module-menu"
import { SessionProvider } from "@/lib/session"

// Menu đang trỏ tới nhưng CHƯA có page.tsx. Xây trang nào thì XOÁ khỏi đây —
// test sẽ báo nếu danh sách này nói sai.
const CHUA_XAY = ["/muc-dung", "/audit", "/cai-dat"]

const tatCaMuc = NAV_GROUPS.flatMap((g) => g.items)
const coTrang = (href: string) => {
  const p = href.split("?")[0] ?? href
  const dir = path.resolve(__dirname, "../../../src/app/(app)", p === "/" ? "" : p.slice(1))
  return existsSync(path.join(dir, "page.tsx"))
}

describe("menu đầy đủ trên mobile (nợ #135)", () => {
  it("có đủ bốn nhóm của thanh bên desktop", () => {
    expect(NAV_GROUPS.map((g) => g.title)).toEqual(["Hành Trình Giá Trị", "Tài Sản & Tri Thức", "Công Cụ Độc Lập", "Vận Hành Tiệm"])
    expect(tatCaMuc.length).toBeGreaterThanOrEqual(20)
  })

  it("ẩn mục có mã năng lực khi phiên không có quyền, bỏ nhóm rỗng", () => {
    const khongQuyen = visibleNavGroups(NAV_GROUPS, () => false)
    const coQuyen = visibleNavGroups(NAV_GROUPS, () => true)
    const soMucCoMa = tatCaMuc.filter((i) => i.code).length
    expect(soMucCoMa).toBeGreaterThan(0)
    expect(coQuyen.flatMap((g) => g.items)).toHaveLength(tatCaMuc.length)
    expect(khongQuyen.flatMap((g) => g.items)).toHaveLength(tatCaMuc.length - soMucCoMa)
    expect(visibleNavGroups([{ title: "X", items: [{ ...tatCaMuc[0]!, code: "ZZ" }] }], () => false)).toEqual([])
  })

  it("mọi mục trỏ tới trang có thật, trừ danh sách chưa xây", () => {
    const thieu = tatCaMuc.map((i) => i.href.split("?")[0] ?? i.href).filter((h) => !coTrang(h))
    expect(thieu.sort()).toEqual([...CHUA_XAY].sort())
  })

  it("dựng ra link cho từng mục được phép", () => {
    const session = { capabilities: [] } as unknown as Parameters<typeof SessionProvider>[0]["session"]
    // Ép kiểu để truyền children theo tham số thứ ba (luật lint react/no-children-prop).
    const Provider = SessionProvider as unknown as (p: { session: typeof session; children?: ReactNode }) => ReactElement
    const html = renderToStaticMarkup(createElement(Provider, { session }, createElement(MobileModuleMenu)))
    expect(html).toContain('aria-label="Tất cả chức năng"')
    expect(html).toContain('href="/creative-studio"')
    expect(html).toContain('href="/don-hang"')
    expect(html).not.toContain('href="/audit"') // A4 — không có quyền thì ẩn
  })
})
