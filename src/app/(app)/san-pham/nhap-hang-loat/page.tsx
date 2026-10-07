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
  loviCode?: string | undefined
  siinCode?: string | undefined
  name: string
  price: number | null
  category: string
  shape: string
  facing: string
  container: string
  color: string
  description: string
  flowersText: string
  driveLink?: string | undefined
  imageFileName: string
  matchedFile: File | null
  previewUrl: string | null
  uploadedAssetId?: string | null | undefined
  status: "MATCHED" | "DRIVE_SYNC" | "NO_IMAGE" | "ERROR"
  errorMsg?: string | undefined
}

const SESSION_KEY = "floraos_bulk_import_rows_v1"
const SESSION_META_KEY = "floraos_bulk_import_meta_v1"

// Serializable subset of ParsedProductRow (excludes File object)
type PersistedRow = Omit<ParsedProductRow, "matchedFile"> & { matchedFile: null }

function saveRowsToSession(rows: ParsedProductRow[], excelFileName: string) {
  try {
    const serializable: PersistedRow[] = rows.map((r) => ({
      ...r,
      matchedFile: null,
      // blob URLs không hợp lệ sau reload — chỉ giữ Drive thumbnails
      previewUrl: r.previewUrl?.startsWith("blob:") ? null : r.previewUrl,
    }))
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(serializable))
    sessionStorage.setItem(SESSION_META_KEY, JSON.stringify({ excelFileName }))
  } catch {
    // sessionStorage có thể đầy — silent fail
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_META_KEY)
}

export default function BulkImportProductsPage() {
  const router = useRouter()
  const excelInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  // Data states
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [excelFileName, setExcelFileName] = useState<string>("")
  const [imageFiles, setImageFiles] = useState<Map<string, File>>(new Map())
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([])
  const [driveThumbs, setDriveThumbs] = useState<Map<string, string>>(new Map())
  const [parsingError, setParsingError] = useState<string | null>(null)
  const [restoredFromSession, setRestoredFromSession] = useState(false)

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

  // Khôi phục state từ sessionStorage khi mount lại trang
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      const meta = sessionStorage.getItem(SESSION_META_KEY)
      if (raw) {
        const restored = JSON.parse(raw) as PersistedRow[]
        if (restored.length > 0) {
          setParsedRows(restored as ParsedProductRow[])
          setRestoredFromSession(true)
        }
      }
      if (meta) {
        const { excelFileName: fn } = JSON.parse(meta) as { excelFileName: string }
        if (fn) setExcelFileName(fn)
      }
    } catch {
      // Dữ liệu session bị hỏng — bỏ qua
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Lưu vào sessionStorage mỗi khi parsedRows thay đổi
  useEffect(() => {
    if (parsedRows.length > 0) {
      saveRowsToSession(parsedRows, excelFileName)
    }
  }, [parsedRows, excelFileName])

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

  // Tự động phân giải Google Drive Folder thành ảnh Thumbnail trực tiếp để hiển thị lên UI
  useEffect(() => {
    if (parsedRows.length === 0) return

    const rowsWithDrive = parsedRows.filter((r) => r.driveLink && !r.previewUrl)
    if (rowsWithDrive.length === 0) return

    let isMounted = true

    // Quét song song từng cụm 20 ảnh để tối ưu tốc độ và không nghẽn mạng
    const resolveThumbnails = async () => {
      const BATCH_SIZE = 20
      for (let i = 0; i < rowsWithDrive.length; i += BATCH_SIZE) {
        if (!isMounted) break
        const batch = rowsWithDrive.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.allSettled(
          batch.map(async (row) => {
            const match = row.driveLink?.match(/folders\/([a-zA-Z0-9_-]{20,})/)
            const folderId = match?.[1]
            if (!folderId) return null

            try {
              const res = await fetch(`/api/v1/public/drive-thumbnail?folder_id=${folderId}`)
              if (!res.ok) return null
              const data = await res.json()
              if (data.thumbnail_url) {
                return { folderId, url: data.thumbnail_url }
              }
            } catch {
              // Ignore individual Drive fetch failures
            }
            return null
          })
        )

        if (isMounted) {
          const newEntries: [string, string][] = []
          for (const item of batchResults) {
            if (item.status === "fulfilled" && item.value) {
              newEntries.push([item.value.folderId, item.value.url])
            }
          }
          if (newEntries.length > 0) {
            setDriveThumbs((prev) => {
              const next = new Map(prev)
              for (const [fId, url] of newEntries) {
                next.set(fId, url)
              }
              return next
            })
          }
        }
      }
    }

    resolveThumbnails()

    return () => {
      isMounted = false
    }
  }, [parsedRows])

  // Download template Excel file (Enterprise-grade Template Master)
  const handleDownloadTemplate = () => {
    // Tải trực tiếp file template chuẩn Enterprise Grade đã định dạng màu sắc, group, validation và layout chuyên nghiệp
    const link = document.createElement("a")
    link.href = "/templates/FloraOS_Template_Master_Kho_San_Pham.xlsx"
    link.download = "FloraOS_Template_Master_Kho_San_Pham.xlsx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Parse Excel file
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setExcelFile(file)
    setExcelFileName(file.name)
    setRestoredFromSession(false)
    setParsingError(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer
        const isCsv = file.name.toLowerCase().endsWith(".csv")
        let wb: XLSX.WorkBook
        if (isCsv) {
          const text = new TextDecoder("utf-8").decode(buffer)
          wb = XLSX.read(text, { type: "string" })
        } else {
          wb = XLSX.read(buffer, { type: "array" })
        }
        const wsname = wb.SheetNames[0]
        if (!wsname) throw new Error("File Excel/CSV không có sheet nào.")
        const ws = wb.Sheets[wsname]
        
        // Trích xuất dạng ma trận để định vị chính xác dòng tiêu đề thực tế (hỗ trợ cả header 1 tầng, header 2 tầng Enterprise và CSV)
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws!, { header: 1 })
        if (!matrix || matrix.length === 0) {
          throw new Error("File không chứa dữ liệu sản phẩm.")
        }

        // Tự động tìm dòng chứa tiêu đề cột (dòng có chứa SKU, Mã, Tên mẫu hoặc Tên sản phẩm)
        let headerRowIndex = 0
        for (let r = 0; r < Math.min(10, matrix.length); r++) {
          const row = matrix[r] || []
          const rowText = row.map((c) => String(c || "").toLowerCase()).join(" ")
          if (
            rowText.includes("sku") ||
            rowText.includes("mã sku") ||
            rowText.includes("tên mẫu") ||
            rowText.includes("tên sản phẩm") ||
            rowText.includes("mã lovi") ||
            rowText.includes("mã siin")
          ) {
            headerRowIndex = r
            break
          }
        }

        const rawHeaders = (matrix[headerRowIndex] || []) as string[]
        const headers = rawHeaders.map((h) => String(h || "").trim())

        const data: Record<string, unknown>[] = []
        for (let r = headerRowIndex + 1; r < matrix.length; r++) {
          const rowVals = (matrix[r] || []) as unknown[]
          const firstCell = String(rowVals[0] || "").trim()
          // Bỏ qua dòng hướng dẫn phụ (bắt đầu bằng VD: hoặc vd:)
          if (firstCell.startsWith("VD:") || firstCell.startsWith("vd:")) continue

          const rowObj: Record<string, unknown> = {}
          let hasData = false
          for (let c = 0; c < headers.length; c++) {
            const h = headers[c]
            if (h) {
              const val = rowVals[c]
              rowObj[h] = val
              if (val !== undefined && val !== null && String(val).trim() !== "") {
                hasData = true
              }
            }
          }
          if (hasData) {
            data.push(rowObj)
          }
        }

        if (data.length === 0) {
          throw new Error("File không chứa bản ghi dữ liệu sản phẩm hợp lệ.")
        }

        const rows: ParsedProductRow[] = data.map((d, index) => {
          // Trích xuất linh hoạt theo các tên cột tiếng Việt hoặc tiếng Anh của Template Master (hỗ trợ cả chuẩn mới và cũ)
          const rawCode = String(
            d["Mã SKU Chuẩn (FloraOS) *"] ??
            d["Mã SKU Chuẩn (FloraOS)"] ??
            d["Mã SKU *"] ??
            d["Mã sản phẩm (SKU) *"] ??
            d["Mã Lovi (Loviinet)"] ??
            d["Mã Siin (Siin Store)"] ??
            d["Mã Lovi"] ??
            d["Mã Siin"] ??
            d["Mã sản phẩm"] ??
            d["SKU"] ??
            d["code"] ??
            ""
          ).trim()
          const rawName = String(
            d["Tên mẫu hoa *"] ??
            d["Tên mẫu hoa"] ??
            d["Tên sản phẩm *"] ??
            d["Tên sản phẩm"] ??
            d["name"] ??
            ""
          ).trim()
          const rawPrice =
            d["Giá niêm yết B2C (VNĐ) *"] ??
            d["Giá niêm yết B2C (VNĐ)"] ??
            d["Giá niêm yết B2C"] ??
            d["Giá bán (VNĐ)"] ??
            d["Giá bán"] ??
            d["price"] ??
            null
          const category = String(
            d["Danh mục chuẩn *"] ??
            d["Danh mục chuẩn"] ??
            d["Danh mục"] ??
            d["Kiểu cách"] ??
            d["category"] ??
            "Bó hoa"
          ).trim()
          const shape = String(
            d["Kiểu dáng / Dáng cắm"] ??
            d["Kiểu dáng"] ??
            d["Kiểu cách"] ??
            d["shape"] ??
            "Dáng tròn"
          ).trim()
          const facing = String(d["Hướng nhìn"] ?? d["facing"] ?? "Một mặt").trim()
          const container = String(
            d["Quy cách đóng gói & Bảo quản"] ??
            d["Quy cách đóng gói"] ??
            d["Vật chứa / Giá đỡ"] ??
            d["Vật chứa"] ??
            d["container"] ??
            ""
          ).trim()
          const color = String(
            d["Tone màu chủ đạo"] ??
            d["Màu sắc / Tone màu"] ??
            d["Màu sắc"] ??
            d["color"] ??
            ""
          ).trim()
          const description = String(
            d["Câu chuyện hoa (Copywriting bán hàng)"] ??
            d["Câu chuyện hoa (copy bán hàng)"] ??
            d["Mô tả / Ý nghĩa hoa"] ??
            d["Mô tả / Ghi chú"] ??
            d["Mô tả"] ??
            d["description"] ??
            ""
          ).trim()
          const flowersText = String(
            d["Hoa chính (BOM)"] ??
            d["Hoa chính (nguyên liệu quyết định)"] ??
            d["Công thức cắm hoa (BOM)"] ??
            d["Công thức hoa (BOM)"] ??
            d["BOM"] ??
            ""
          ).trim()
          const imageFileName = String(
            d["Tên file ảnh (hoặc URL ảnh) *"] ??
            d["Tên file ảnh chuẩn hóa ( FloraOS Media )"] ??
            d["Tên file ảnh chuẩn hóa"] ??
            d["Ảnh thành phẩm chuẩn"] ??
            d["Tên file ảnh (tuỳ chọn)"] ??
            d["Tên file ảnh"] ??
            d["Tên ảnh"] ??
            d["image"] ??
            ""
          ).trim()

          const loviCode = String(d["Mã Lovi (Loviinet)"] ?? d["Mã Lovi"] ?? "").trim()
          const siinCode = String(d["Mã Siin (Siin Store)"] ?? d["Mã Siin"] ?? "").trim()
          const driveLink = String(
            d["Link ảnh thành phẩm chuẩn (Drive)"] ??
            d["Link ảnh Drive"] ??
            d["Google Drive"] ??
            ""
          ).trim()

          const price = typeof rawPrice === "number" ? rawPrice : Number(String(rawPrice).replace(/\D/g, "")) || null

          let status: ParsedProductRow["status"] = driveLink ? "DRIVE_SYNC" : "NO_IMAGE"
          let errorMsg: string | undefined

          if (!rawCode || !rawName) {
            status = "ERROR"
            errorMsg = "Thiếu mã hoặc tên sản phẩm"
          }

          return {
            index: index + 1,
            code: rawCode,
            loviCode: loviCode || undefined,
            siinCode: siinCode || undefined,
            name: rawName,
            price,
            category,
            shape,
            facing,
            container,
            color,
            description,
            flowersText,
            driveLink: driveLink || undefined,
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
    reader.readAsArrayBuffer(file)
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
        status: row.driveLink ? ("DRIVE_SYNC" as const) : ("NO_IMAGE" as const),
      }
    })

    setParsedRows(updated)
  }

  // Statistics
  const stats = useMemo(() => {
    const total = parsedRows.length
    const matched = parsedRows.filter((r) => r.status === "MATCHED").length
    const driveSynced = parsedRows.filter((r) => r.status === "DRIVE_SYNC").length
    const noImage = parsedRows.filter((r) => r.status === "NO_IMAGE").length
    const errors = parsedRows.filter((r) => r.status === "ERROR").length
    return { total, matched, driveSynced, noImage, errors }
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
          drive_link: row.driveLink || null,
          lovi_code: row.loviCode || null,
          siin_code: row.siinCode || null,
          bom: {
            flowers: parseFlowersText(row.flowersText),
          },
        },
        image_asset_id: row.uploadedAssetId ?? null,
      }))

      // Gửi theo từng batch 250 sản phẩm để không vượt trần schema max 500 và chống timeout
      const BATCH_CHUNK = 250
      let totalCreated = 0
      let totalSkipped = 0
      let totalFailed = 0
      const allFailedItems: Array<{ code: string; error: string }> = []

      for (let i = 0; i < payloadItems.length; i += BATCH_CHUNK) {
        const chunk = payloadItems.slice(i, i + BATCH_CHUNK)
        setImportProgress({
          current: Math.min(i + chunk.length, payloadItems.length),
          total: payloadItems.length,
          phase: `Đang lưu sản phẩm (${Math.min(i + chunk.length, payloadItems.length)}/${payloadItems.length})...`,
        })

        const batchRes = await fetch("/api/v1/products/batch-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: chunk,
            skip_duplicates: true,
          }),
        })

        if (!batchRes.ok) {
          throw new Error("Không thể thực hiện nạp dữ liệu hàng loạt.")
        }

        const chunkResult = await batchRes.json()
        totalCreated += chunkResult.created_count || 0
        totalSkipped += chunkResult.skipped_count || 0
        totalFailed += chunkResult.failed_count || 0
        if (chunkResult.failed && Array.isArray(chunkResult.failed)) {
          allFailedItems.push(...chunkResult.failed)
        }
      }

      setImportResult({
        success: true,
        createdCount: totalCreated,
        skippedCount: totalSkipped,
        failedCount: totalFailed,
        failedItems: allFailedItems,
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
            {restoredFromSession && parsedRows.length > 0 && (
              <div className="mt-0.5 flex items-center gap-1.5 text-caption font-semibold text-success">
                <CheckCircle2 size={12} />
                <span>Đã khôi phục {parsedRows.length} sản phẩm từ phiên trước</span>
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([])
                    setExcelFile(null)
                    setExcelFileName("")
                    setRestoredFromSession(false)
                    clearSession()
                  }}
                  className="ml-1 text-danger hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label="Xóa dữ liệu đã khôi phục"
                >
                  (Xóa)
                </button>
              </div>
            )}
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
                  setExcelFileName("")
                  setRestoredFromSession(false)
                  clearSession()
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
                {excelFile ? excelFile.name : excelFileName ? `${excelFileName} (đã lưu)` : "Chưa chọn file"}
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
              {stats.matched > 0 && (
                <span className="text-success">🟢 Khớp ảnh máy tính: <b>{stats.matched}</b></span>
              )}
              {stats.driveSynced > 0 && (
                <span className="text-primary font-bold">☁️ Đã gắn Google Drive: <b>{stats.driveSynced}</b></span>
              )}
              {stats.noImage > 0 && (
                <span className="text-warning">🟡 Chưa có ảnh: <b>{stats.noImage}</b></span>
              )}
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
                        ) : row.driveLink ? (() => {
                          const folderId = row.driveLink.match(/folders\/([a-zA-Z0-9_-]{20,})/)?.[1]
                          const thumbUrl = folderId ? driveThumbs.get(folderId) : undefined

                          if (thumbUrl) {
                            return (
                              <a
                                href={row.driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block h-12 w-12 rounded-lg border border-border overflow-hidden bg-surface-alt shadow-xs hover:border-primary transition-all"
                                title="Ảnh từ Google Drive (Nhấp để mở thư mục gốc)"
                              >
                                <img
                                  src={thumbUrl}
                                  alt={row.name}
                                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-200"
                                  loading="lazy"
                                />
                                <span className="absolute bottom-0 right-0 bg-black/60 px-1 py-0.2 text-caption font-bold text-white backdrop-blur-xs rounded-tl">
                                  Drive
                                </span>
                              </a>
                            )
                          }

                          return (
                            <a
                              href={row.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                              title="Đang tải ảnh Google Drive (Nhấp để mở thư mục gốc)"
                            >
                              <ImageIcon size={16} className="animate-pulse" />
                              <span className="text-caption font-semibold">Drive ↗</span>
                            </a>
                          )
                        })() : (
                          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-alt/40 text-text-muted">
                            <ImageIcon size={16} />
                            <span className="text-caption">Chưa ảnh</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-primary">
                        <div>{row.code || "—"}</div>
                        {(row.loviCode || row.siinCode) && (
                          <div className="text-caption text-text-muted font-normal">
                            {row.loviCode && <span>LV: {row.loviCode} </span>}
                            {row.siinCode && <span>SIIN: {row.siinCode}</span>}
                          </div>
                        )}
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
                        {row.status === "DRIVE_SYNC" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-caption font-bold text-primary" title={row.driveLink}>
                            ☁️ Đã gắn Drive
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
