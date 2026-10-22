import * as XLSX from "xlsx"

/** Ghi các trang tính thành một tệp `.xlsx`. Trang rỗng vẫn có hàng tiêu đề trống. */
export function writeWorkbook(sheets: Array<{ name: string; rows: Array<Record<string, unknown>> }>): Uint8Array {
  const wb = XLSX.utils.book_new()
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet.rows), sheet.name.slice(0, 31))
  }
  return new Uint8Array(XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer)
}

/**
 * Dựng tệp ZIP bằng bộ ghi CFB/ZIP có sẵn trong `xlsx` (đã là dependency) —
 * không thêm thư viện nén mới. Toàn bộ tệp nằm trong bộ nhớ, nên nơi gọi phải
 * tự giới hạn tổng dung lượng (`STORE_EXPORT_IMAGE_BUDGET_BYTES`).
 */
export class ZipArchive {
  private readonly container = XLSX.CFB.utils.cfb_new()
  private count = 0

  add(path: string, content: Uint8Array | string): void {
    const body = typeof content === "string" ? Buffer.from(content, "utf8") : Buffer.from(content)
    XLSX.CFB.utils.cfb_add(this.container, `/${path.replace(/^\/+/, "")}`, body)
    this.count += 1
  }

  get fileCount(): number {
    return this.count
  }

  toBytes(): Uint8Array {
    const out = XLSX.CFB.write(this.container, { fileType: "zip", type: "buffer", compression: true })
    return new Uint8Array(out as Buffer)
  }
}
