import * as XLSX from "xlsx"
import { describe, expect, it } from "vitest"

import { ZipArchive, writeWorkbook } from "@/modules/storage/adapters/zip-archive"
import {
  isStoreExportExpired,
  pickImagesWithinBudget,
  readStoreExportOutput,
  safeFileName,
  storeExportExpiresAt,
  toPlain,
} from "@/modules/storage/domain/store-export"
import { buildStoreSheets } from "@/modules/storage/domain/store-export-sheets"

describe("store-export domain", () => {
  it("link sống đúng 24 giờ kể từ lúc xong", () => {
    const done = new Date("2026-10-21T08:00:00.000Z")
    expect(storeExportExpiresAt(done).toISOString()).toBe("2026-10-22T08:00:00.000Z")
    expect(isStoreExportExpired(done, new Date("2026-10-22T07:59:00.000Z"))).toBe(false)
    expect(isStoreExportExpired(done, new Date("2026-10-22T08:00:00.000Z"))).toBe(true)
    expect(isStoreExportExpired(null, new Date())).toBe(false)
  })

  it("chọn ảnh trong trần dung lượng, giữ thứ tự, ảnh vượt trần vào danh sách bỏ qua", () => {
    const images = [{ fileSize: 40 }, { fileSize: 50 }, { fileSize: 30 }, { fileSize: 10 }]
    const { picked, skipped } = pickImagesWithinBudget(images, 100)
    expect(picked.map((i) => i.fileSize)).toEqual([40, 50, 10])
    expect(skipped.map((i) => i.fileSize)).toEqual([30])
  })

  it("chuyển Decimal và Date thành JSON thuần", () => {
    class Decimal {
      constructor(private readonly v: number) {}
      toNumber() {
        return this.v
      }
    }
    expect(toPlain({ total: new Decimal(150000), at: new Date("2026-10-21T00:00:00.000Z"), tags: ["a"], x: undefined })).toEqual({
      total: 150000,
      at: "2026-10-21T00:00:00.000Z",
      tags: ["a"],
      x: null,
    })
  })

  it("tên tệp trong ZIP không chứa đường dẫn hay ký tự cấm", () => {
    expect(safeFileName("../../etc/passwd")).toBe("..-..-etc-passwd")
    expect(safeFileName("  Bó hồng: đỏ?  ")).toBe("Bó hồng- đỏ-")
    expect(safeFileName("")).toBe("tep")
  })

  it("đọc output job; output sai hình dạng trả null", () => {
    expect(readStoreExportOutput({ storageKey: "k", sizeBytes: 10 })?.sizeBytes).toBe(10)
    expect(readStoreExportOutput({ sizeBytes: 10 })).toBeNull()
    expect(readStoreExportOutput(null)).toBeNull()
  })

  it("trang tính bỏ mục trong Thùng rác và ghi cột tiếng Việt", () => {
    const sheets = buildStoreSheets({
      products: [
        { code: "SP-1", name: "Bó hồng", status: "ACTIVE", attributes: { price: 350000 }, deleted_at: null },
        { code: "SP-2", name: "Đã xoá", status: "ARCHIVED", attributes: {}, deleted_at: new Date() },
      ],
      customers: [{ id: "c1", code: "KH-0001", name: "Chị Lan", phone: "0901234567", deleted_at: null }],
      orders: [{ id: "o1", code: "DH-1", customer_id: "c1", status: "COMPLETED", total_vnd: 350000 }],
      order_items: [{ order_id: "o1", quantity: 2 }],
      vouchers: [],
    })
    expect(sheets.map((s) => s.name)).toEqual(["Sản phẩm", "Khách hàng", "Đơn hàng", "Mã giảm giá"])
    expect(sheets[0]?.rows).toEqual([expect.objectContaining({ "Mã": "SP-1", "Trạng thái": "Đang bán", "Giá (VNĐ)": 350000 })])
    expect(sheets[2]?.rows[0]).toMatchObject({ "Khách hàng": "Chị Lan", "Số lượng": 2, "Trạng thái": "Hoàn tất" })
  })
})

describe("ZipArchive", () => {
  it("dựng ZIP đọc lại được, gồm Excel mở được", () => {
    const zip = new ZipArchive()
    zip.add("doc-truoc.txt", "xin chào")
    zip.add("du-lieu.xlsx", writeWorkbook([{ name: "Khách hàng", rows: [{ "Tên": "Chị Lan" }] }]))
    zip.add("anh-goc/a.jpg", new Uint8Array([1, 2, 3]))

    const read = XLSX.CFB.read(Buffer.from(zip.toBytes()), { type: "buffer" })
    const names = read.FullPaths.filter((p) => !p.endsWith("/"))
    expect(names.some((p) => p.endsWith("doc-truoc.txt"))).toBe(true)
    expect(names.some((p) => p.endsWith("anh-goc/a.jpg"))).toBe(true)

    const xlsxEntry = XLSX.CFB.find(read, "du-lieu.xlsx")
    const wb = XLSX.read(xlsxEntry?.content as Uint8Array, { type: "array" })
    expect(XLSX.utils.sheet_to_json(wb.Sheets["Khách hàng"] as XLSX.WorkSheet)).toEqual([{ "Tên": "Chị Lan" }])
  })
})
