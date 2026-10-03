"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import {
  ArrowLeft,
  FileSpreadsheet,
  FolderUp,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Image as ImageIcon,
  Check,
  RefreshCw,
  HelpCircle,
  FileCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export interface ParsedProductRow {
  index: number
  code: string
  name: string
  price: number | null
  category: string
  shape: string
  facing: string
  container: string
  color: string
  description: string
  flowersText: string
  imageFileName: string
  matchedFile: File | null
  previewUrl: string | null
  uploadedAssetId?: string | null | undefined
  status: "MATCHED" | "NO_IMAGE" | "ERROR"
  errorMsg?: string | undefined
}

export default function BulkImportProductsPage() {
  const router = useRouter()
  const excelInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  // Data states
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<Map<string, File>>(new Map())
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([])
  const [parsingError, setParsingError] = useState<string | null>(null)

  // Progress & Execution states
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, phase: "" })
  const [importResult, setImportResult] = useState<{
    success: boolean
    createdCount: number
    skippedCount: number
    failedCount: number
    failedItems: Array<{ code: string; error: string }>
  } | null>(null)

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      parsedRows.forEach((r) => {
        if (r.previewUrl && r.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(r.previewUrl)
        }
      })
    }
  }, [parsedRows])

  // Download template Excel file (Template Master đa sheet)
  const handleDownloadTemplate = () => {
    // Sheet 1: Danh sách sản phẩm mẫu chi tiết
    const templateData = [
      {
        "Mã SKU *": "FL-1001",
        "Tên mẫu hoa *": "Bó hoa Nắng Hạ Rạng Rỡ",
        "Giá bán (VNĐ)": 450000,
        "Giá vốn (VNĐ)": 220000,
        "Danh mục": "Bó hoa",
        "Kiểu dáng": "Dáng tròn",
        "Hướng nhìn": "Một mặt",
        "Vật chứa / Giá đỡ": "Giấy gói kraft nâu",
        "Phong cách": "Hiện đại",
        "Tone màu chủ đạo": "Vàng ấm",
        "Dịp phù hợp": "Sinh nhật, Chúc mừng",
        "Tên file ảnh (tuỳ chọn)": "FL-1001.jpg",
        "Công thức cắm hoa (BOM)": "Hồng vàng: 10 cành, Baby trắng: 5 cành, Lá bạc: 3 cành",
        "Nơ & Ruy băng": "Nơ lụa kem sang trọng",
        "Trạng thái": "Đang bán",
        "Mô tả / Ý nghĩa hoa": "Mẫu hoa tươi hướng dương kết hợp hồng vàng mang lại may mắn, khởi đầu hanh thông.",
      },
      {
        "Mã SKU *": "FL-1002",
        "Tên mẫu hoa *": "Giỏ hoa Tình Yêu Ngọt Ngào",
        "Giá bán (VNĐ)": 680000,
        "Giá vốn (VNĐ)": 310000,
        "Danh mục": "Giỏ hoa",
        "Kiểu dáng": "Hàn Quốc tự nhiên",
        "Hướng nhìn": "Đa hướng (360 độ)",
        "Vật chứa / Giá đỡ": "Giỏ mây mộc đan tay",
        "Phong cách": "Tự nhiên mộc mạc",
        "Tone màu chủ đạo": "Hồng pastel",
        "Dịp phù hợp": "Kỷ niệm, Tình yêu, Lễ tình nhân",
        "Tên file ảnh (tuỳ chọn)": "FL-1002.png",
        "Công thức cắm hoa (BOM)": "Hồng Ohara: 12 cành, Cát tường hồng: 6 cành, Lá chanh: 4 cành",
        "Nơ & Ruy băng": "Nơ voan hồng pastel",
        "Trạng thái": "Đang bán",
        "Mô tả / Ý nghĩa hoa": "Tone màu pastel nhẹ nhàng, ngọt ngào gửi gắm lời yêu thương chân thành nhất.",
      },
      {
        "Mã SKU *": "FL-1003",
        "Tên mẫu hoa *": "Kệ hoa Khai Trương Hồng Phát",
        "Giá bán (VNĐ)": 1500000,
        "Giá vốn (VNĐ)": 750000,
        "Danh mục": "Kệ hoa khai trương",
        "Kiểu dáng": "Dáng tam giác",
        "Hướng nhìn": "Một mặt",
        "Vật chứa / Giá đỡ": "Kệ sắt mỹ thuật 1.6m",
        "Phong cách": "Sang trọng Châu Âu",
        "Tone màu chủ đạo": "Đỏ rực rỡ",
        "Dịp phù hợp": "Khai trương, Khánh thành",
        "Tên file ảnh (tuỳ chọn)": "FL-1003.jpg",
        "Công thức cắm hoa (BOM)": "Đồng tiền đỏ: 20 bông, Lan mokara đỏ: 10 cành, Hồng môn đỏ: 8 búp",
        "Nơ & Ruy băng": "Băng rôn chữ vàng + Nơ đỏ lớn",
        "Trạng thái": "Đang bán",
        "Mô tả / Ý nghĩa hoa": "Chúc công việc kinh doanh khởi sắc, hồng phát và thành công vượt bậc.",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    worksheet["!cols"] = [
      { wch: 16 }, // Mã SKU
      { wch: 30 }, // Tên mẫu hoa
      { wch: 16 }, // Giá bán
      { wch: 16 }, // Giá vốn
      { wch: 18 }, // Danh mục
      { wch: 22 }, // Kiểu dáng
      { wch: 18 }, // Hướng nhìn
      { wch: 24 }, // Vật chứa
      { wch: 20 }, // Phong cách
      { wch: 20 }, // Tone màu
      { wch: 24 }, // Dịp phù hợp
      { wch: 24 }, // Tên file ảnh
      { wch: 45 }, // Công thức BOM
      { wch: 25 }, // Nơ ruy băng
      { wch: 14 }, // Trạng thái
      { wch: 55 }, // Mô tả ý nghĩa
    ]

    // Sheet 2: Từ điển quy ước giá trị chuẩn (Lookups Dictionary)
    const lookupData = [
      {
        "Nhóm dữ liệu": "Danh mục sản phẩm",
        "Giá trị chuẩn khuyến nghị": "Bó hoa, Giỏ hoa, Hộp hoa, Kệ hoa khai trương, Bình hoa, Hoa chia buồn, Cây cảnh / Quà tặng",
        "Ghi chú hướng dẫn": "Chọn đúng danh mục để hiển thị lọc chính xác trên web và catalog.",
      },
      {
        "Nhóm dữ liệu": "Kiểu dáng thiết kế (Shape)",
        "Giá trị chuẩn khuyến nghị": "Dáng tròn, Dáng tam giác, Hàn Quốc tự nhiên, Dáng dài, Dáng thác nước, Dáng quạt, Tự do",
        "Ghi chú hướng dẫn": "Định hình dáng cắm phục vụ tra cứu và thợ cắm hoa.",
      },
      {
        "Nhóm dữ liệu": "Hướng nhìn (Facing)",
        "Giá trị chuẩn khuyến nghị": "Một mặt, Đa hướng (360 độ), Hai mặt",
        "Ghi chú hướng dẫn": "Mặt chính trưng bày của sản phẩm.",
      },
      {
        "Nhóm dữ liệu": "Tone màu chủ đạo",
        "Giá trị chuẩn khuyến nghị": "Đỏ rực rỡ, Hồng pastel, Vàng ấm, Trắng kem, Cam tươi, Tím mộng mơ, Xanh hy vọng, Đa sắc",
        "Ghi chú hướng dẫn": "Giúp bộ lọc tìm kiếm theo màu hoạt động chuẩn xác.",
      },
      {
        "Nhóm dữ liệu": "Dịp tặng phù hợp",
        "Giá trị chuẩn khuyến nghị": "Sinh nhật, Khai trương, Kỷ niệm, Tình yêu, Chúc mừng, Chia buồn, Ngày lễ (8/3, 20/10)",
        "Ghi chú hướng dẫn": "Các dịp cách nhau bằng dấu phẩy.",
      },
      {
        "Nhóm dữ liệu": "Quy ước file ảnh",
        "Giá trị chuẩn khuyến nghị": "Khớp với Mã SKU (vd: FL-1001.jpg) hoặc điền chính xác tên file vào cột 'Tên file ảnh'",
        "Ghi chú hướng dẫn": "Hệ thống tự động tìm ảnh tương ứng trong folder đã chọn.",
      },
      {
        "Nhóm dữ liệu": "Quy ước công thức hoa (BOM)",
        "Giá trị chuẩn khuyến nghị": "Tên hoa: Số lượng [đơn vị], phân tách bằng dấu phẩy. Vd: 'Hồng đỏ: 10 cành, Baby: 5 cành'",
        "Ghi chú hướng dẫn": "Tự động phân rã số lượng và loài hoa vào cơ sở dữ liệu xưởng.",
      },
    ]

    const lookupWorksheet = XLSX.utils.json_to_sheet(lookupData)
    lookupWorksheet["!cols"] = [
      { wch: 25 },
      { wch: 50 },
      { wch: 45 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh_Sach_San_Pham")
    XLSX.utils.book_append_sheet(workbook, lookupWorksheet, "Tu_Dien_Quy_Uoc_Chuan")

    XLSX.writeFile(workbook, "FloraOS_Template_Master_Kho_San_Pham.xlsx")
  }

  // Parse Excel file
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setExcelFile(file)
    setParsingError(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: "binary" })
        const wsname = wb.SheetNames[0]
        if (!wsname) throw new Error("File Excel không có sheet nào.")
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws!)

        if (!data || data.length === 0) {
          throw new Error("File Excel không chứa dữ liệu sản phẩm.")
        }

        const rows: ParsedProductRow[] = data.map((d, index) => {
          // Trích xuất linh hoạt theo các tên cột tiếng Việt hoặc tiếng Anh của Template Master
          const rawCode = String(
            d["Mã SKU *"] ?? d["Mã sản phẩm (SKU) *"] ?? d["Mã sản phẩm"] ?? d["SKU"] ?? d["code"] ?? ""
          ).trim()
          const rawName = String(
            d["Tên mẫu hoa *"] ?? d["Tên sản phẩm"] ?? d["name"] ?? ""
          ).trim()
          const rawPrice = d["Giá bán (VNĐ)"] ?? d["Giá bán"] ?? d["price"] ?? null
          const category = String(d["Danh mục"] ?? d["category"] ?? "Bó hoa").trim()
          const shape = String(d["Kiểu dáng"] ?? d["shape"] ?? "Dáng tròn").trim()
          const facing = String(d["Hướng nhìn"] ?? d["facing"] ?? "Một mặt").trim()
          const container = String(d["Vật chứa / Giá đỡ"] ?? d["Vật chứa"] ?? d["container"] ?? "").trim()
          const color = String(d["Tone màu chủ đạo"] ?? d["Màu sắc"] ?? d["color"] ?? "").trim()
          const description = String(d["Mô tả / Ý nghĩa hoa"] ?? d["Mô tả / Ghi chú"] ?? d["Mô tả"] ?? d["description"] ?? "").trim()
          const flowersText = String(d["Công thức cắm hoa (BOM)"] ?? d["Công thức hoa (BOM)"] ?? d["BOM"] ?? "").trim()
          const imageFileName = String(d["Tên file ảnh (tuỳ chọn)"] ?? d["Tên ảnh"] ?? d["image"] ?? "").trim()

          const price = typeof rawPrice === "number" ? rawPrice : Number(String(rawPrice).replace(/\D/g, "")) || null

          let status: ParsedProductRow["status"] = "NO_IMAGE"
          let errorMsg: string | undefined

          if (!rawCode || !rawName) {
            status = "ERROR"
            errorMsg = "Thiếu mã hoặc tên sản phẩm"
          }

          return {
            index: index + 1,
            code: rawCode,
            name: rawName,
            price,
            category,
            shape,
            facing,
            container,
            color,
            description,
            flowersText,
            imageFileName,
            matchedFile: null,
            previewUrl: null,
            status,
            errorMsg,
          }
        })

        // Tự động đối chiếu với danh sách ảnh nếu ảnh đã được chọn trước
        rematchRowsWithImages(rows, imageFiles)
      } catch (err) {
        setParsingError(err instanceof Error ? err.message : "Lỗi đọc file Excel")
        setParsedRows([])
      }
    }
    reader.readAsBinaryString(file)
  }

  // Parse Image files / folder
  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newMap = new Map<string, File>()
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file || !file.type.startsWith("image/")) continue

      // Lưu theo tên file gốc (không dấu / chữ thường để match linh hoạt)
      const cleanName = file.name.trim().toLowerCase()
      newMap.set(cleanName, file)

      // Lưu thêm tên bỏ đuôi mở rộng (ví dụ: "FL-1001" thay vì "FL-1001.jpg")
      const baseName = cleanName.substring(0, cleanName.lastIndexOf(".")) || cleanName
      newMap.set(baseName, file)
    }

    setImageFiles(newMap)
    if (parsedRows.length > 0) {
      rematchRowsWithImages(parsedRows, newMap)
    }
  }

  // Matcher logic
  const rematchRowsWithImages = (rows: ParsedProductRow[], images: Map<string, File>) => {
    const updated = rows.map((row) => {
      if (row.status === "ERROR") return row

      const codeKey = row.code.trim().toLowerCase()
      const specifiedImgKey = row.imageFileName.trim().toLowerCase()
      const specifiedImgBase = specifiedImgKey.substring(0, specifiedImgKey.lastIndexOf(".")) || specifiedImgKey

      // Ưu tiên:
      // 1. Tên file ảnh chỉ định cụ thể trong cột Excel
      // 2. Mã sản phẩm (SKU) khớp với tên file ảnh
      const matched =
        images.get(specifiedImgKey) ||
        images.get(specifiedImgBase) ||
        images.get(codeKey)

      if (matched) {
        const previewUrl = URL.createObjectURL(matched)
        return {
          ...row,
          matchedFile: matched,
          previewUrl,
          status: "MATCHED" as const,
        }
      }

      return {
        ...row,
        matchedFile: null,
        previewUrl: null,
        status: "NO_IMAGE" as const,
      }
    })

    setParsedRows(updated)
  }

  // Statistics
  const stats = useMemo(() => {
    const total = parsedRows.length
    const matched = parsedRows.filter((r) => r.status === "MATCHED").length
    const noImage = parsedRows.filter((r) => r.status === "NO_IMAGE").length
    const errors = parsedRows.filter((r) => r.status === "ERROR").length
    return { total, matched, noImage, errors }
  }, [parsedRows])

  // Upload single asset helper
  const uploadAssetFile = async (file: File): Promise<string> => {
    const urlRes = await fetch("/api/v1/assets/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: null, mime_type: file.type }),
    })
    if (!urlRes.ok) throw new Error(`Không lấy được URL tải lên cho ${file.name}`)
    const { asset_id, storage_key, upload_url } = await urlRes.json()

    const putRes = await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    })
    if (!putRes.ok) throw new Error(`Tải ảnh ${file.name} thất bại`)

    const registerRes = await fetch("/api/v1/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asset_id,
        product_id: null,
        kind: "ORIGINAL",
        storage_key,
        mime_type: file.type,
        file_size: file.size,
      }),
    })
    if (!registerRes.ok) throw new Error(`Đăng ký asset ${file.name} thất bại`)

    return asset_id
  }

  // Parse BOM text to structured JSON
  const parseFlowersText = (text: string) => {
    if (!text.trim()) return []
    // Tách bằng dấu phẩy hoặc chấm phẩy
    const items = text.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
    return items.map((item) => {
      // Tìm số lượng (vd: "Hồng đỏ 10 cành" -> 10)
      const match = item.match(/(\d+)\s*(cành|bông|nhánh|gói|bó|cây)?/i)
      const quantity = match ? Number(match[1]) : 1
      const unit = match?.[2] || "cành"
      const name = item.replace(/\d+\s*(cành|bông|nhánh|gói|bó|cây)?/i, "").trim() || item
      return {
        name,
        quantity,
        unit,
        color: "Tiêu chuẩn",
        role: "Chủ đạo",
      }
    })
  }

  // Execute bulk import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.status !== "ERROR")
    if (validRows.length === 0) return

    setIsImporting(true)
    setImportResult(null)

    try {
      // Bước 1: Upload các file ảnh đã khớp
      const rowsWithUploadedAssets = [...validRows]
      const totalImagesToUpload = validRows.filter((r) => r.matchedFile).length
      let uploadedCount = 0

      for (let i = 0; i < rowsWithUploadedAssets.length; i++) {
        const row = rowsWithUploadedAssets[i]!
        if (row.matchedFile) {
          setImportProgress({
            current: uploadedCount + 1,
            total: totalImagesToUpload,
            phase: `Đang tải ảnh: ${row.matchedFile.name}...`,
          })
          try {
            const assetId = await uploadAssetFile(row.matchedFile)
            row.uploadedAssetId = assetId
            uploadedCount++
          } catch {
            // Không chặn, nếu lỗi ảnh thì vẫn tạo sản phẩm
            row.uploadedAssetId = null
          }
        }
      }

      // Bước 2: Tạo batch sản phẩm lên Core
      setImportProgress({
        current: 0,
        total: validRows.length,
        phase: "Đang lưu sản phẩm vào kho...",
      })

      const payloadItems = rowsWithUploadedAssets.map((row) => ({
        code: row.code,
        name: row.name,
        category: row.category,
        shape: row.shape,
        facing: row.facing,
        container: row.container || null,
        status: "ACTIVE" as const,
        attributes: {
          price: row.price,
          price_vnd: row.price,
          color: row.color || null,
          description: row.description || null,
          bom: {
            flowers: parseFlowersText(row.flowersText),
          },
        },
        image_asset_id: row.uploadedAssetId ?? null,
      }))

      const batchRes = await fetch("/api/v1/products/batch-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: payloadItems,
          skip_duplicates: true,
        }),
      })

      if (!batchRes.ok) {
        throw new Error("Không thể thực hiện nạp dữ liệu hàng loạt.")
      }

      const result = await batchRes.json()
      setImportResult({
        success: true,
        createdCount: result.created_count,
        skippedCount: result.skipped_count,
        failedCount: result.failed_count,
        failedItems: result.failed ?? [],
      })
    } catch (err) {
      setImportResult({
        success: false,
        createdCount: 0,
        skippedCount: 0,
        failedCount: validRows.length,
        failedItems: [{ code: "SYSTEM", error: err instanceof Error ? err.message : "Lỗi hệ thống" }],
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/san-pham" as never)}
            aria-label="Quay lại kho sản phẩm"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="text-caption text-text-muted">Kho sản phẩm cửa hàng</div>
            <h1 className="text-title font-extrabold text-primary">Nhập sản phẩm hàng loạt (Excel + Ảnh)</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Tải file Excel mẫu</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleExecuteImport}
            disabled={parsedRows.length === 0 || isImporting || stats.total === stats.errors}
            className="flex items-center gap-1.5"
          >
            <CheckCircle2 size={15} strokeWidth={2.2} />
            <span>{isImporting ? "Đang xử lý..." : `Bắt đầu nạp (${stats.total - stats.errors} mẫu)`}</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Kết quả import nếu đã xong */}
        {importResult && (
          <div
            className={`rounded-2xl border p-5 ${
              importResult.success
                ? "border-success/30 bg-success-bg/40 text-success-dark"
                : "border-danger/30 bg-danger-bg/40 text-danger"
            }`}
          >
            <div className="flex items-center gap-2 text-title-sm font-bold">
              <CheckCircle2 size={20} className="text-success" />
              <span>Nạp sản phẩm hoàn tất!</span>
            </div>
            <div className="mt-2 text-body-sm flex flex-wrap gap-4 font-medium">
              <div>✅ Đã tạo mới: <b>{importResult.createdCount}</b> sản phẩm</div>
              <div>⏩ Bỏ qua (trùng mã): <b>{importResult.skippedCount}</b></div>
              {importResult.failedCount > 0 && (
                <div className="text-danger">❌ Lỗi: <b>{importResult.failedCount}</b></div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                size="sm"
                onClick={() => router.push("/san-pham" as never)}
              >
                Về danh sách kho sản phẩm
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImportResult(null)
                  setParsedRows([])
                  setExcelFile(null)
                }}
              >
                Nhập đợt khác
              </Button>
            </div>
          </div>
        )}

        {/* 2 Vùng Dropzone: File Excel + Folder Ảnh */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vùng 1: Upload Excel */}
          <Card className="p-5 flex flex-col justify-between border-dashed border-2 hover:border-primary/50 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-title-sm font-bold text-text">
                  <FileSpreadsheet size={20} className="text-success" />
                  <span>1. File Excel sản phẩm</span>
                </div>
                {excelFile && (
                  <span className="text-caption font-semibold text-success flex items-center gap-1 bg-success-bg px-2 py-0.5 rounded-full">
                    <Check size={12} /> Đã chọn
                  </span>
                )}
              </div>
              <p className="mt-1 text-body-sm text-text-muted">
                Hỗ trợ định dạng .xlsx, .xls, .csv chứa mã SKU, tên hoa, giá, công thức...
              </p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Download size={12} />
                Tải file Excel mẫu về
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-caption font-medium text-text truncate max-w-[200px]">
                {excelFile ? excelFile.name : "Chưa chọn file"}
              </span>
              <Button
                size="sm"
                variant={excelFile ? "secondary" : "primary"}
                onClick={() => excelInputRef.current?.click()}
                disabled={isImporting}
              >
                {excelFile ? "Đổi file Excel" : "Chọn file Excel"}
              </Button>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </div>
          </Card>

          {/* Vùng 2: Upload Folder Ảnh */}
          <Card className="p-5 flex flex-col justify-between border-dashed border-2 hover:border-primary/50 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-title-sm font-bold text-text">
                  <FolderUp size={20} className="text-primary" />
                  <span>2. Thư mục ảnh sản phẩm</span>
                </div>
                {imageFiles.size > 0 && (
                  <span className="text-caption font-semibold text-primary flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                    <FileCheck size={12} /> {imageFiles.size} ảnh sẵn sàng
                  </span>
                )}
              </div>
              <p className="mt-1 text-body-sm text-text-muted">
                Chọn cả folder hoặc nhiều ảnh cùng lúc. Tên ảnh đặt trùng mã sản phẩm (vd: <code>FL-1001.jpg</code>).
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-caption font-medium text-text">
                {imageFiles.size > 0 ? `Đã nạp ${imageFiles.size} ảnh` : "Chưa chọn thư mục"}
              </span>
              <Button
                size="sm"
                variant={imageFiles.size > 0 ? "secondary" : "outline"}
                onClick={() => folderInputRef.current?.click()}
                disabled={isImporting}
              >
                {imageFiles.size > 0 ? "Chọn lại ảnh" : "Chọn thư mục ảnh"}
              </Button>
              <input
                ref={folderInputRef}
                type="file"
                multiple
                // @ts-expect-error webkitdirectory is standard for folder picker
                webkitdirectory=""
                directory=""
                accept="image/*"
                onChange={handleImagesUpload}
                className="hidden"
              />
            </div>
          </Card>
        </div>

        {/* Thanh trạng thái đối chiếu (Overview Status Bar) */}
        {parsedRows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5">
            <div className="flex items-center gap-4 text-body-sm font-semibold">
              <span className="text-text">Tổng cộng: <b>{stats.total}</b></span>
              <span className="text-success">🟢 Đã khớp ảnh: <b>{stats.matched}</b></span>
              <span className="text-warning">🟡 Chưa có ảnh: <b>{stats.noImage}</b></span>
              {stats.errors > 0 && (
                <span className="text-danger">🔴 Lỗi dữ liệu: <b>{stats.errors}</b></span>
              )}
            </div>
            {isImporting && (
              <div className="flex items-center gap-2 text-caption text-primary font-medium">
                <RefreshCw size={13} className="animate-spin" />
                <span>{importProgress.phase}</span>
              </div>
            )}
          </div>
        )}

        {/* Bảng xem trước dữ liệu (Preview Table) */}
        {parsedRows.length > 0 ? (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead className="border-b border-border bg-surface-alt/60 text-caption font-bold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center">#</th>
                    <th className="px-3 py-2.5 w-20">Ảnh</th>
                    <th className="px-3 py-2.5 w-28">Mã SKU</th>
                    <th className="px-3 py-2.5">Tên sản phẩm</th>
                    <th className="px-3 py-2.5 w-28">Danh mục</th>
                    <th className="px-3 py-2.5 w-28 text-right">Giá bán</th>
                    <th className="px-3 py-2.5">Công thức (BOM)</th>
                    <th className="px-3 py-2.5 w-32 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedRows.map((row) => (
                    <tr key={row.index} className="hover:bg-surface-alt/30 transition-colors">
                      <td className="px-3 py-2.5 text-center text-caption text-text-muted">
                        {row.index}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.previewUrl ? (
                          <div className="relative h-12 w-12 rounded-lg border border-border overflow-hidden bg-surface-alt">
                            <img
                              src={row.previewUrl}
                              alt={row.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-alt/40 text-text-muted">
                            <ImageIcon size={16} />
                            <span className="text-caption">Chưa ảnh</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-primary">
                        {row.code || "—"}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-text">
                        <div>{row.name || "—"}</div>
                        {row.color && (
                          <span className="text-caption text-text-muted font-normal">Màu: {row.color}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-text-muted">
                        {row.category}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-primary">
                        {row.price ? `${row.price.toLocaleString("vi-VN")}đ` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-caption text-text-muted max-w-[220px] truncate" title={row.flowersText}>
                        {row.flowersText || "Chưa có"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {row.status === "MATCHED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-caption font-bold text-success">
                            <Check size={12} /> Đã khớp ảnh
                          </span>
                        )}
                        {row.status === "NO_IMAGE" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-caption font-bold text-warning">
                            Chưa có ảnh
                          </span>
                        )}
                        {row.status === "ERROR" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-caption font-bold text-danger" title={row.errorMsg}>
                            <AlertTriangle size={12} /> Lỗi
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-text-muted">
            <FileSpreadsheet size={36} className="mx-auto text-text-muted/60 mb-3" />
            <div className="text-body-sm font-semibold text-text">Chưa nạp file Excel sản phẩm</div>
            <div className="text-caption mt-1">
              Hãy tải file Excel mẫu và kéo thả vào ô phía trên để bắt đầu đối chiếu dữ liệu.
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
