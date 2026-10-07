import { describe, expect, it } from "vitest"
import { BoundedCache, extractFirstFileId, isValidDriveId } from "../google-drive-thumbnail"

describe("google-drive-thumbnail adapter", () => {
  it("chỉ nhận Drive id an toàn — chặn chèn tham số/URL", () => {
    expect(isValidDriveId("1AbC_def-GHIjklmnopQR")).toBe(true)
    expect(isValidDriveId("short")).toBe(false)
    expect(isValidDriveId("1AbCdefGHIjk&foo=bar")).toBe(false)
    expect(isValidDriveId("../../etc/passwd1234")).toBe(false)
    expect(isValidDriveId(null)).toBe(false)
  })

  it("lấy file id đầu tiên trong HTML folder", () => {
    const html = `<div id="entry-${"a".repeat(30)}"></div><div id="entry-${"b".repeat(30)}"></div>`
    expect(extractFirstFileId(html)).toEqual({ fileId: "a".repeat(30), total: 2 })
    expect(extractFirstFileId("<html></html>")).toEqual({ fileId: null, total: 0 })
  })

  it("cache có trần kích thước và hết hạn theo TTL", () => {
    const cache = new BoundedCache<number>(2, 1000)
    cache.set("a", 1, 0)
    cache.set("b", 2, 0)
    cache.get("a", 10)
    cache.set("c", 3, 10)
    expect(cache.size).toBe(2)
    expect(cache.get("b", 10)).toBeUndefined()
    expect(cache.get("a", 10)).toBe(1)
    expect(cache.get("a", 5000)).toBeUndefined()
  })
})
