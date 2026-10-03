import { describe, expect, it } from "vitest"
import { transformContent } from "./codemod-ux-tokens"

describe("codemod-ux-tokens (Chuyển đổi token an toàn)", () => {
  it("1. Thay thế text-[11px] thành text-caption", () => {
    const input = `<span className="px-2 text-[11px] font-bold">Tag</span>`
    const res = transformContent(input)
    expect(res.modified).toBe(true)
    expect(res.content).toBe(`<span className="px-2 text-caption font-bold">Tag</span>`)
  })

  it("2. Thay thế text-[13px] thành text-body-sm", () => {
    const input = `<p className="text-[13px] text-text">Mô tả</p>`
    const res = transformContent(input)
    expect(res.modified).toBe(true)
    expect(res.content).toBe(`<p className="text-body-sm text-text">Mô tả</p>`)
  })

  it("3. Thay thế text-[17px] thành text-title", () => {
    const input = `<h1 className="text-[17px] font-extrabold">Tiêu đề</h1>`
    const res = transformContent(input)
    expect(res.modified).toBe(true)
    expect(res.content).toBe(`<h1 className="text-title font-extrabold">Tiêu đề</h1>`)
  })

  it("4. Thay thế màu xám thô sang token ngữ nghĩa", () => {
    const input = `<div className="bg-slate-50 border-gray-200 text-zinc-500">Nội dung</div>`
    const res = transformContent(input)
    expect(res.modified).toBe(true)
    expect(res.content).toBe(`<div className="bg-surface-alt border-border text-text-muted">Nội dung</div>`)
  })

  it("5. Thay màu đỏ trong ngữ cảnh lỗi (role='alert') thành text-danger và bg-danger-bg", () => {
    const input = `<div role="alert" className="bg-red-50 text-red-600">Lỗi kết nối</div>`
    const res = transformContent(input)
    expect(res.modified).toBe(true)
    expect(res.content).toContain("text-danger")
    expect(res.content).toContain("bg-danger-bg")
  })

  it("6. Không thay màu đỏ thương hiệu trong nút bấm không có ngữ cảnh lỗi", () => {
    const input = `<button className="bg-red-600 text-white">Nút chính</button>`
    const res = transformContent(input)
    expect(res.content).toBe(input)
    expect(res.modified).toBe(false)
  })

  it("7. Thay màu xanh lá trong ngữ cảnh thành công (CheckCircle2)", () => {
    const input = `<div><CheckCircle2 className="text-emerald-600" /></div>`
    const res = transformContent(input)
    expect(res.modified).toBe(true)
    expect(res.content).toContain("text-success")
  })

  it("8. Cỡ chữ không nằm trong bảng token (vd: text-[26px]) không bị thay đổi", () => {
    const input = `<div className="text-[26px]">Hero</div>`
    const res = transformContent(input)
    expect(res.modified).toBe(false)
    expect(res.content).toBe(input)
  })
})
