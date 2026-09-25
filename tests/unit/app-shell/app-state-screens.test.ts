// Khoá nội dung ba màn hình trạng thái toàn ứng dụng (GĐ2 kế hoạch đồng bộ
// wireframe 25/09): 404, lỗi trong khung app, lỗi layout gốc. Dựng ra HTML
// tĩnh bằng react-dom/server — môi trường test là "node", không cần DOM.

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import NotFound from "@/app/not-found"
import AppError from "@/app/(app)/error"
import AppLoading from "@/app/(app)/loading"
import GlobalError from "@/app/global-error"

const loi = Object.assign(new Error("boom"), { digest: "abc123" })

describe("màn hình trạng thái toàn ứng dụng", () => {
  it("404 nói tiếng Việt và dẫn về Trang chủ", () => {
    const html = renderToStaticMarkup(createElement(NotFound))
    expect(html).toContain("Không tìm thấy trang")
    expect(html).toContain('href="/"')
    expect(html).toContain("Về Trang chủ")
  })

  it("lỗi trong khung app có Thử lại, Về Trang chủ và mã lỗi", () => {
    const html = renderToStaticMarkup(createElement(AppError, { error: loi, reset: () => {} }))
    expect(html).toContain("Trang này gặp sự cố")
    expect(html).toContain("Thử lại")
    expect(html).toContain('href="/"')
    expect(html).toContain("Mã lỗi: abc123")
  })

  it("không có digest thì không hiện dòng mã lỗi", () => {
    const html = renderToStaticMarkup(createElement(AppError, { error: new Error("x"), reset: () => {} }))
    expect(html).not.toContain("Mã lỗi")
  })

  it("đang tải có vai trò status cho trình đọc màn hình", () => {
    const html = renderToStaticMarkup(createElement(AppLoading))
    expect(html).toContain('role="status"')
    expect(html).toContain("Đang tải…")
  })

  it("lỗi layout gốc tự dựng html lang=vi và có Thử lại", () => {
    const html = renderToStaticMarkup(createElement(GlobalError, { error: loi, reset: () => {} }))
    expect(html).toContain('<html lang="vi">')
    expect(html).toContain("Thử lại")
  })
})
