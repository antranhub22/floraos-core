"use client"

import { useState, useRef } from "react"
import {
  Copy,
  Check,
  Sparkles,
  Gift,
  ShieldCheck,
  Maximize2,
  Tag,
  Clock,
  Heart,
  Pencil,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  Phone,
  Store,
  AlertCircle,
  HelpCircle,
  Eye,
  Download,
  FileDown,
  Image as ImageIcon,
  Share2,
  Loader2,
  Unlock,
  RotateCcw,
  MessageSquareText,
} from "lucide-react"
import { toBlob, toPng, toJpeg } from "html-to-image"
import jsPDF from "jspdf"
import {
  TabActionHeader,
  type TabItem,
  type TabAction,
  type TabOverflowAction,
} from "@/components/ui/tab-header"
import { SalesPitchCardA6, ZaloScriptBox } from "@/components/templates/product-analysis"
import {
  type SalesPitchData,
  type SalesPitchOverrides,
  type SalesPitchItem,
  generateZaloPitchScript,
  formatCurrencyVnd,
  DEFAULT_FREE_GIFTS,
  DEFAULT_GUARANTEES,
} from "@/modules/products/domain/sales-pitch-template"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SalesPitchCardProps {
  pitchData: SalesPitchData
  onOverridesChange?: (overrides: SalesPitchOverrides) => void
  onFinalize?: (finalizedPitch: SalesPitchData) => void
}

export function SalesPitchCard({
  pitchData,
  onOverridesChange,
  onFinalize,
}: SalesPitchCardProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"edit" | "card" | "script">("card")
  const [editTab, setEditTab] = useState<"general" | "bom" | "gifts">("general")
  const [justFinalized, setJustFinalized] = useState(false)

  // Local state initialized from pitchData
  const [productName, setProductName] = useState(pitchData.productName)
  const [sku, setSku] = useState(pitchData.sku ?? "")
  const [style, setStyle] = useState(pitchData.style)
  const [occasions, setOccasions] = useState<string[]>(pitchData.occasions)
  const [newOccasion, setNewOccasion] = useState("")
  const [description, setDescription] = useState(pitchData.description)

  const [mainFlowers, setMainFlowers] = useState<SalesPitchItem[]>(
    pitchData.mainFlowers.length > 0
      ? pitchData.mainFlowers
      : [{ id: "f-0", name: "Hoa tươi", quantity: 10, unit: "cành", color: "Tự nhiên", role: "Chủ đạo" }]
  )
  const [foliageItems, setFoliageItems] = useState<SalesPitchItem[]>(pitchData.foliageItems)
  const [accessoryItems, setAccessoryItems] = useState<SalesPitchItem[]>(pitchData.accessoryItems)

  const [container, setContainer] = useState(pitchData.container)
  const [wrapping, setWrapping] = useState(pitchData.wrapping)
  // Nợ #96 (18/09): `dimensions.heightCm`/`widthCm` nay là `number | null` —
  // không còn mặc định bịa 55×40. `?? ""` giữ đúng khuôn đã dùng cho
  // `price`/`originalPrice` ngay dưới: null -> ô trống, không phải số 0.
  const [heightCm, setHeightCm] = useState<number | string>(pitchData.dimensions.heightCm ?? "")
  const [widthCm, setWidthCm] = useState<number | string>(pitchData.dimensions.widthCm ?? "")

  const [price, setPrice] = useState<number | string>(pitchData.priceVnd ?? "")
  const [originalPrice, setOriginalPrice] = useState<number | string>(pitchData.originalPriceVnd ?? "")
  const [priceSegment, setPriceSegment] = useState(pitchData.priceSegment)

  const [freeGifts, setFreeGifts] = useState<string[]>(pitchData.freeGifts ?? DEFAULT_FREE_GIFTS)
  const [newGift, setNewGift] = useState("")
  const [guarantees, setGuarantees] = useState<string[]>(pitchData.guarantees ?? DEFAULT_GUARANTEES)
  const [newGuarantee, setNewGuarantee] = useState("")

  // Không dùng tên thương hiệu/hotline giả trông như thật làm fallback — nếu
  // pitchData chưa có (hồ sơ tenant trống), phải hiện rõ đây là chỗ cần cập nhật.
  const [shopName, setShopName] = useState(pitchData.shopName ?? "Chưa cập nhật tên tiệm")
  const [shopHotline, setShopHotline] = useState(pitchData.shopHotline ?? "Chưa cập nhật hotline")
  const [customNote, setCustomNote] = useState(pitchData.customNote ?? "")

  const [status, setStatus] = useState<"DRAFT" | "FINALIZED">(pitchData.status ?? "DRAFT")
  const [finalizedAt, setFinalizedAt] = useState<string | null>(pitchData.finalizedAt ?? null)

  // Ref & states for Image / PDF export
  const cardRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const sanitizeFileName = (name: string) => {
    return (
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "the-chao-san-pham"
    )
  }

  const exportOptions = {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    skipFonts: true,
    fontEmbedCSS: "",
  }

  const handleCopyCardImage = async () => {
    if (!cardRef.current) return
    setIsExporting(true)
    setExportError(null)
    try {
      const blob = await toBlob(cardRef.current, exportOptions)
      if (!blob) throw new Error("Không tạo được dữ liệu ảnh")

      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        setCopiedImage(true)
        setTimeout(() => setCopiedImage(false), 2500)
        setExportSuccess("Đã copy ảnh vào Clipboard! Nhấn Ctrl+V (hoặc Cmd+V) để dán vào Zalo/Messenger ngay.")
        setTimeout(() => setExportSuccess(null), 4000)
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${sanitizeFileName(productName)}-the-chao.png`
        link.click()
        URL.revokeObjectURL(url)
        setExportSuccess("Trình duyệt không hỗ trợ dán ảnh trực tiếp, đã tự động tải ảnh PNG về máy!")
        setTimeout(() => setExportSuccess(null), 4000)
      }
    } catch (err) {
      console.error("Lỗi copy ảnh:", err)
      setExportError("Không thể copy trực tiếp vào clipboard. Đang tải file PNG về máy...")
      handleDownloadPng()
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadPng = async () => {
    if (!cardRef.current) return
    setIsExporting(true)
    setExportError(null)
    try {
      const dataUrl = await toPng(cardRef.current, exportOptions)
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `${sanitizeFileName(productName)}-the-chao.png`
      link.click()
      setExportSuccess("Đã tải ảnh Thẻ Chào (PNG 2x Retina)!")
      setTimeout(() => setExportSuccess(null), 3500)
    } catch (err) {
      console.error("Lỗi tải ảnh PNG:", err)
      setExportError("Không thể tạo ảnh PNG. Vui lòng thử lại.")
      setTimeout(() => setExportError(null), 3500)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadJpeg = async () => {
    if (!cardRef.current) return
    setIsExporting(true)
    setExportError(null)
    try {
      const dataUrl = await toJpeg(cardRef.current, {
        ...exportOptions,
        quality: 0.95,
      })
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `${sanitizeFileName(productName)}-the-chao.jpeg`
      link.click()
      setExportSuccess("Đã tải ảnh Thẻ Chào (JPEG)!")
      setTimeout(() => setExportSuccess(null), 3500)
    } catch (err) {
      console.error("Lỗi tải ảnh JPEG:", err)
      setExportError("Không thể tạo ảnh JPEG.")
      setTimeout(() => setExportError(null), 3500)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!cardRef.current) return
    setIsExporting(true)
    setExportError(null)
    try {
      const dataUrl = await toPng(cardRef.current, exportOptions)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a6",
      })
      const imgProps = pdf.getImageProperties(dataUrl)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${sanitizeFileName(productName)}-the-chao.pdf`)
      setExportSuccess("Đã xuất file PDF Thẻ Chào Khách (Khổ A6 chuẩn in ấn) thành công!")
      setTimeout(() => setExportSuccess(null), 3500)
    } catch (err) {
      console.error("Lỗi xuất PDF:", err)
      setExportError("Không thể tạo file PDF.")
      setTimeout(() => setExportError(null), 3500)
    } finally {
      setIsExporting(false)
    }
  }

  // Generate real-time active pitch data for display
  const activePitch: SalesPitchData = {
    ...pitchData,
    productName,
    sku: sku || null,
    style,
    occasions,
    description,
    mainFlowers,
    foliageItems,
    accessoryItems,
    container,
    wrapping,
    // Nợ #96 (18/09): bỏ hẳn "|| 55"/"|| 40" — đó chính là cách con số bịa
    // cũ lọt vào runtime (kể cả khi Sales để trống, `Number("") || 55` vẫn
    // ra 55). Giữ đúng khuôn `priceVnd`/`originalPriceVnd` ngay trên: trống
    // -> `null`, không suy ra số mặc định.
    dimensions: {
      heightCm: heightCm === "" ? null : Number(heightCm),
      widthCm: widthCm === "" ? null : Number(widthCm),
    },
    priceVnd: price === "" ? null : Number(price),
    originalPriceVnd: originalPrice === "" ? null : Number(originalPrice),
    priceSegment,
    freeGifts,
    guarantees,
    shopName,
    shopHotline,
    customNote: customNote || null,
    status,
    finalizedAt,
  }

  const scriptText = generateZaloPitchScript(activePitch)

  const handleCopyZalo = async () => {
    try {
      await navigator.clipboard.writeText(scriptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleFinalize = () => {
    const now = new Date().toISOString()
    setStatus("FINALIZED")
    setFinalizedAt(now)
    setJustFinalized(true)
    setActiveTab("card")

    const finalizedData: SalesPitchData = {
      ...activePitch,
      status: "FINALIZED",
      finalizedAt: now,
    }

    onOverridesChange?.(finalizedData)
    onFinalize?.(finalizedData)

    setTimeout(() => setJustFinalized(false), 5000)
  }

  // Helpers for editing flower items
  const updateFlower = <K extends keyof SalesPitchItem>(index: number, field: K, value: SalesPitchItem[K]) => {
    setMainFlowers((prev) => {
      const copy = [...prev]
      const current = copy[index]
      if (current) {
        copy[index] = { ...current, [field]: value }
      }
      return copy
    })
  }

  const addFlower = () => {
    setMainFlowers((prev) => [
      ...prev,
      { id: `flower-${Date.now()}`, name: "Hoa mới", quantity: 5, unit: "cành", color: "Tươi", role: "Điểm nhấn" },
    ])
  }

  const removeFlower = (index: number) => {
    setMainFlowers((prev) => prev.filter((_, i) => i !== index))
  }

  // Helpers for editing foliage
  const updateFoliage = <K extends keyof SalesPitchItem>(index: number, field: K, value: SalesPitchItem[K]) => {
    setFoliageItems((prev) => {
      const copy = [...prev]
      const current = copy[index]
      if (current) {
        copy[index] = { ...current, [field]: value }
      }
      return copy
    })
  }

  const addFoliage = () => {
    setFoliageItems((prev) => [
      ...prev,
      { id: `foliage-${Date.now()}`, name: "Lá đệm mới", quantity: 3, unit: "cành" },
    ])
  }

  const removeFoliage = (index: number) => {
    setFoliageItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Helpers for editing occasions
  const addOccasion = () => {
    if (newOccasion.trim() && !occasions.includes(newOccasion.trim())) {
      setOccasions((prev) => [...prev, newOccasion.trim()])
      setNewOccasion("")
    }
  }

  const removeOccasion = (index: number) => {
    setOccasions((prev) => prev.filter((_, i) => i !== index))
  }

  // Helpers for gifts & guarantees
  const addGiftItem = () => {
    if (newGift.trim()) {
      setFreeGifts((prev) => [...prev, newGift.trim()])
      setNewGift("")
    }
  }

  const removeGiftItem = (index: number) => {
    setFreeGifts((prev) => prev.filter((_, i) => i !== index))
  }

  const addGuaranteeItem = () => {
    if (newGuarantee.trim()) {
      setGuarantees((prev) => [...prev, newGuarantee.trim()])
      setNewGuarantee("")
    }
  }

  const removeGuaranteeItem = (index: number) => {
    setGuarantees((prev) => prev.filter((_, i) => i !== index))
  }

  // Define dynamic actions for TabActionHeader based on activeTab
  const getTabActions = (): { primary: TabAction[]; overflow: TabOverflowAction[] } => {
    if (activeTab === "edit") {
      const primary: TabAction[] =
        status !== "FINALIZED"
          ? [
              {
                id: "finalize",
                label: "Chốt duyệt Final",
                icon: CheckCircle2,
                variant: "success",
                onClick: handleFinalize,
              },
            ]
          : [
              {
                id: "finalized-badge",
                label: "Đã Chốt Final",
                icon: CheckCircle2,
                variant: "outline",
                disabled: true,
                onClick: () => {},
              },
            ]

      const overflow: TabOverflowAction[] = []
      if (status === "FINALIZED") {
        overflow.push({
          id: "unlock",
          label: "Mở khóa sửa lại",
          icon: Unlock,
          onClick: () => {
            setStatus("DRAFT")
            setActiveTab("edit")
          },
        })
      }
      overflow.push({
        id: "reset",
        label: "Đặt lại dữ liệu gốc",
        icon: RotateCcw,
        onClick: () => {
          setProductName(pitchData.productName)
          setDescription(pitchData.description)
          setPrice(pitchData.priceVnd ?? "")
          setOriginalPrice(pitchData.originalPriceVnd ?? "")
        },
      })

      return { primary, overflow }
    }

    if (activeTab === "card") {
      const primary: TabAction[] = [
        {
          id: "copy-card",
          label: copiedImage ? "Đã copy ảnh!" : "Copy ảnh Zalo",
          icon: copiedImage ? Check : Copy,
          variant: "primary",
          loading: isExporting,
          onClick: handleCopyCardImage,
        },
      ]

      const overflow: TabOverflowAction[] = [
        {
          id: "dl-png",
          label: "Tải ảnh PNG (Retina 2x)",
          icon: Download,
          disabled: isExporting,
          onClick: handleDownloadPng,
        },
        {
          id: "dl-jpeg",
          label: "Tải ảnh JPEG (Nén 95%)",
          icon: ImageIcon,
          disabled: isExporting,
          onClick: handleDownloadJpeg,
        },
        {
          id: "dl-pdf",
          label: "Xuất file PDF (Khổ A6 in ấn)",
          icon: FileDown,
          disabled: isExporting,
          onClick: handleDownloadPdf,
        },
      ]

      if (status === "FINALIZED") {
        overflow.push({
          id: "unlock",
          label: "Mở khóa chỉnh sửa",
          icon: Unlock,
          dividerAbove: true,
          onClick: () => {
            setStatus("DRAFT")
            setActiveTab("edit")
          },
        })
      }

      return { primary, overflow }
    }

    if (activeTab === "script") {
      const primary: TabAction[] = [
        {
          id: "edit-content",
          label: "Chỉnh sửa nội dung",
          icon: Pencil,
          variant: "outline",
          onClick: () => setActiveTab("edit"),
        },
        {
          id: "copy-script",
          label: copied ? "Đã copy kịch bản!" : "Sao chép kịch bản",
          icon: copied ? Check : Copy,
          variant: "primary",
          onClick: handleCopyZalo,
        },
      ]

      const overflow: TabOverflowAction[] = [
        {
          id: "goto-card",
          label: "Xem Thẻ chào khách A6",
          icon: Eye,
          onClick: () => setActiveTab("card"),
        },
      ]

      if (status === "FINALIZED") {
        overflow.push({
          id: "unlock",
          label: "Mở khóa chỉnh sửa",
          icon: Unlock,
          dividerAbove: true,
          onClick: () => {
            setStatus("DRAFT")
            setActiveTab("edit")
          },
        })
      }

      return { primary, overflow }
    }

    return { primary: [], overflow: [] }
  }

  const tabItems: TabItem[] = [
    { id: "edit", label: "Chỉnh sửa thông tin", icon: Pencil },
    { id: "card", label: "Thẻ chào khách", icon: Eye, badge: "A6", badgeTone: "accent" },
    { id: "script", label: "Kịch bản tư vấn Zalo", icon: MessageSquareText, badge: "1-Chạm", badgeTone: "success" },
  ]

  // eslint-disable-next-line react-hooks/refs -- chỉ dựng danh sách nút; cardRef được đọc trong onClick (xuất ảnh), không đọc lúc render
  const currentTabActions = getTabActions()

  return (
    <div className="flex flex-col gap-5 w-full max-w-5xl mx-auto">
      {/* Celebration Banner when finalized */}
      {justFinalized && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 p-4 text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white flex-shrink-0">
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold">Xuất bản Thẻ Chào Sản Phẩm thành công!</h4>
            <p className="text-xs opacity-90">
              Thẻ đã được chốt duyệt Final và lưu vào <strong>Kho lưu trữ &gt; Sale Pitch đã hoàn thành</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface p-4 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-bold text-accent uppercase tracking-wider">M01c — Công cụ Sales Rep</span>
            {status === "FINALIZED" ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[11px] gap-1 py-0.5">
                <CheckCircle2 size={12} strokeWidth={2.5} />
                ĐÃ CHỐT DUYỆT FINAL
              </Badge>
            ) : (
              <Badge tone="neutral" className="font-semibold text-[11px] py-0.5">
                Bản nháp đang biên tập
              </Badge>
            )}
          </div>
          <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold text-text tracking-tight">Thẻ Chào Sản Phẩm & Kịch Bản Bán Hàng</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Cho phép tùy chỉnh 100% các trường thông tin hoa, giá và quà tặng trước khi chốt xuất bản.
          </p>
        </div>
      </div>

      {/* Standardized SaaS Tab Action Header (Tabs on Left + Actions on Top-Right) */}
      <TabActionHeader
        tabs={tabItems}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as "edit" | "card" | "script")}
        primaryActions={currentTabActions.primary}
        overflowActions={currentTabActions.overflow}
      />

      {/* TAB 1: FULL INLINE EDITOR (Hiển thị khi activeTab = 'edit') */}
      {activeTab === "edit" && (
        <Card className="rounded-2xl border-2 border-primary/30 bg-surface p-5 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Pencil size={18} className="text-primary" />
              <h3 className="text-sm font-bold text-text">Trình biên tập toàn diện Thẻ Chào Sản Phẩm (M01c)</h3>
            </div>
            <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setEditTab("general")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  editTab === "general" ? "bg-surface shadow-sm text-primary font-bold" : "text-text-muted hover:text-text"
                }`}
              >
                1. Thông tin chung & Báo giá
              </button>
              <button
                type="button"
                onClick={() => setEditTab("bom")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  editTab === "bom" ? "bg-surface shadow-sm text-primary font-bold" : "text-text-muted hover:text-text"
                }`}
              >
                2. Thành phần hoa & Cấu phần (BOM)
              </button>
              <button
                type="button"
                onClick={() => setEditTab("gifts")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  editTab === "gifts" ? "bg-surface shadow-sm text-primary font-bold" : "text-text-muted hover:text-text"
                }`}
              >
                3. Quà tặng & Cam kết dịch vụ
              </button>
            </div>
          </div>

          {/* Tab 1: Thông tin chung & Báo giá */}
          {editTab === "general" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="text-[11.5px] font-bold text-text-muted block mb-1">Tên sản phẩm chào khách</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] font-bold text-text outline-none focus:border-primary"
                    placeholder="Ví dụ: Bó Tulip Vàng Nắng Hoàng Kim..."
                  />
                </div>

                <div>
                  <label className="text-[11.5px] font-bold text-text-muted block mb-1">Mã SKU / Tham chiếu</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary font-mono"
                    placeholder="TL-001"
                  />
                </div>

                <div>
                  <label className="text-[11.5px] font-bold text-text-muted block mb-1">Phong cách thiết kế</label>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
                    placeholder="Hiện đại, Cổ điển, Hàn Quốc..."
                  />
                </div>
              </div>

              {/* Pricing & Hotline */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-primary/[0.03] p-3.5 rounded-xl border border-primary/20">
                <div>
                  <label className="text-[11.5px] font-bold text-primary block mb-1">Giá chào ưu đãi (VND) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg border-2 border-primary/60 bg-surface px-3 py-2 text-[14px] font-bold text-primary outline-none focus:border-primary"
                    placeholder="850000"
                  />
                </div>

                <div>
                  <label className="text-[11.5px] font-bold text-text-muted block mb-1">Giá gốc niêm yết (nếu có)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
                    placeholder="1000000"
                  />
                </div>

                <div>
                  <label className="text-[11.5px] font-bold text-text-muted block mb-1">Hotline tư vấn</label>
                  <input
                    type="text"
                    value={shopHotline}
                    onChange={(e) => setShopHotline(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
                    placeholder="1900 xxxx hoặc 090..."
                  />
                </div>

                <div>
                  <label className="text-[11.5px] font-bold text-text-muted block mb-1">Tên cửa hàng / Thương hiệu</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
                    placeholder="FloraOS Boutique"
                  />
                </div>
              </div>

              {/* Dịp sử dụng (Tag pills) */}
              <div>
                <label className="text-[11.5px] font-bold text-text-muted block mb-1.5">Dịp phù hợp tặng hoa</label>
                <div className="flex flex-wrap items-center gap-2">
                  {occasions.map((occ, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-surface-alt px-2.5 py-1 text-xs font-semibold text-text border border-border"
                    >
                      {occ}
                      <button
                        type="button"
                        onClick={() => removeOccasion(idx)}
                        className="text-text-muted hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={newOccasion}
                      onChange={(e) => setNewOccasion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addOccasion()
                        }
                      }}
                      placeholder="+ Thêm dịp..."
                      className="h-7 w-28 rounded-lg border border-border bg-surface px-2 text-xs outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={addOccasion}
                      className="h-7 px-2 rounded-lg bg-surface-alt border border-border text-xs hover:bg-surface"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </div>

              {/* Mô tả cảm xúc */}
              <div>
                <label className="text-[11.5px] font-bold text-text-muted block mb-1">Mô tả cảm xúc & thông điệp chào hàng</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary resize-none leading-relaxed"
                  placeholder="Nhập thông điệp ý nghĩa dành cho khách hàng..."
                />
              </div>

              {/* Ghi chú riêng */}
              <div>
                <label className="text-[11.5px] font-bold text-text-muted block mb-1">Ghi chú riêng / Ưu đãi đặc biệt cho đợt chào này</label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
                  placeholder="Ví dụ: Giảm thêm 50k khi đặt trước 12h trưa nay..."
                />
              </div>
            </div>
          )}

          {/* Tab 2: Thành phần hoa & Cấu phần (BOM) */}
          {editTab === "bom" && (
            <div className="flex flex-col gap-5">
              {/* Hoa chính */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text flex items-center gap-1.5">
                    🌺 Hoa chính ({mainFlowers.length} loại)
                  </span>
                  <Button variant="outline" size="sm" onClick={addFlower} className="h-7 text-xs gap-1">
                    <Plus size={13} /> Thêm loại hoa
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {mainFlowers.map((flower, idx) => (
                    <div
                      key={flower.id ?? idx}
                      className="grid grid-cols-12 gap-2 items-center bg-surface-alt p-2.5 rounded-xl border border-border text-xs"
                    >
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={flower.name}
                          onChange={(e) => updateFlower(idx, "name", e.target.value)}
                          placeholder="Tên hoa (VD: Tulip)"
                          className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs font-semibold text-text outline-none focus:border-primary"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={flower.quantity ?? ""}
                          onChange={(e) => updateFlower(idx, "quantity", e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Số lượng"
                          className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text outline-none focus:border-primary font-bold text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={flower.unit}
                          onChange={(e) => updateFlower(idx, "unit", e.target.value)}
                          placeholder="ĐVT (cành/bông)"
                          className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text outline-none focus:border-primary"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={flower.color ?? ""}
                          onChange={(e) => updateFlower(idx, "color", e.target.value)}
                          placeholder="Tone màu (Vàng/Đỏ...)"
                          className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text outline-none focus:border-primary"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeFlower(idx)}
                          className="p-1 text-text-muted hover:text-red-500 transition-colors"
                          title="Xóa dòng hoa này"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lá phụ & đệm */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text flex items-center gap-1.5">
                    🌿 Lá đệm ({foliageItems.length} loại)
                  </span>
                  <Button variant="outline" size="sm" onClick={addFoliage} className="h-7 text-xs gap-1">
                    <Plus size={13} /> Thêm lá đệm
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {foliageItems.map((foliage, idx) => (
                    <div
                      key={foliage.id ?? idx}
                      className="grid grid-cols-12 gap-2 items-center bg-surface-alt p-2 rounded-xl border border-border text-xs"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={foliage.name}
                          onChange={(e) => updateFoliage(idx, "name", e.target.value)}
                          placeholder="Tên lá (Lá chanh, lá bạc...)"
                          className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text outline-none focus:border-primary"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={foliage.quantity ?? ""}
                          onChange={(e) => updateFoliage(idx, "quantity", e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Số lượng"
                          className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-text outline-none focus:border-primary text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={foliage.unit}
                          onChange={(e) => updateFoliage(idx, "unit", e.target.value)}
                          placeholder="Đơn vị"
                          className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-text outline-none focus:border-primary"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeFoliage(idx)}
                          className="p-1 text-text-muted hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vật chứa, Giấy gói & Kích thước */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-3 border-t border-border">
                <div>
                  <label className="text-[11.5px] font-bold text-text-muted block mb-1">Vật chứa (Bình/Giỏ/Bó)</label>
                  <input
                    type="text"
                    value={container}
                    onChange={(e) => setContainer(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
                    placeholder="Bình gốm, Giỏ mây, Bó hoa..."
                  />
                </div>

                <div>
                  <label className="text-[11.5px] font-bold text-text-muted block mb-1">Chất liệu giấy gói / Nơ</label>
                  <input
                    type="text"
                    value={wrapping}
                    onChange={(e) => setWrapping(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
                    placeholder="Giấy lụa, Giấy xi măng..."
                  />
                </div>

                <div>
                  <label className="text-[11.5px] font-bold text-text-muted block mb-1">Chiều cao ước tính (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
                    placeholder="55"
                  />
                </div>

                <div>
                  <label className="text-[11.5px] font-bold text-text-muted block mb-1">Chiều rộng ước tính (cm)</label>
                  <input
                    type="number"
                    value={widthCm}
                    onChange={(e) => setWidthCm(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
                    placeholder="40"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Quà tặng & Cam kết dịch vụ */}
          {editTab === "gifts" && (
            <div className="flex flex-col gap-5">
              {/* Quà tặng */}
              <div>
                <span className="text-xs font-bold text-text block mb-2">🎁 Quà tặng kèm theo cho khách</span>
                <div className="flex flex-col gap-2 mb-2">
                  {freeGifts.map((gift, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-surface-alt px-3 py-2 rounded-xl border border-border text-xs">
                      <Gift size={14} className="text-primary flex-shrink-0" />
                      <input
                        type="text"
                        value={gift}
                        onChange={(e) => {
                          const val = e.target.value
                          setFreeGifts((prev) => prev.map((g, i) => (i === idx ? val : g)))
                        }}
                        className="flex-1 bg-transparent border-none outline-none font-medium text-text text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeGiftItem(idx)}
                        className="text-text-muted hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newGift}
                    onChange={(e) => setNewGift(e.target.value)}
                    placeholder="+ Thêm quà tặng (VD: Tặng thiệp viết tay...)"
                    className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none focus:border-primary"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addGiftItem()
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={addGiftItem} className="text-xs">
                    Thêm
                  </Button>
                </div>
              </div>

              {/* Cam kết */}
              <div>
                <span className="text-xs font-bold text-text block mb-2">🛡️ Cam kết dịch vụ từ Shop</span>
                <div className="flex flex-col gap-2 mb-2">
                  {guarantees.map((gua, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-surface-alt px-3 py-2 rounded-xl border border-border text-xs">
                      <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={gua}
                        onChange={(e) => {
                          const val = e.target.value
                          setGuarantees((prev) => prev.map((g, i) => (i === idx ? val : g)))
                        }}
                        className="flex-1 bg-transparent border-none outline-none font-medium text-text text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeGuaranteeItem(idx)}
                        className="text-text-muted hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newGuarantee}
                    onChange={(e) => setNewGuarantee(e.target.value)}
                    placeholder="+ Thêm cam kết (VD: Chụp hình trước khi giao...)"
                    className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none focus:border-primary"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addGuaranteeItem()
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={addGuaranteeItem} className="text-xs">
                    Thêm
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom actions of the editor */}
          <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-text-muted">
              Chỉnh sửa hoàn tất? Chuyển sang xem Thẻ Chào Khách hoặc xuất bản.
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("card")}
                className="text-xs font-semibold gap-1 text-primary hover:bg-primary/5 border-primary/30"
              >
                <Eye size={13} />
                Xem Thẻ chào khách →
              </Button>
              {status !== "FINALIZED" && (
                <Button
                  size="sm"
                  onClick={handleFinalize}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <CheckCircle2 size={14} className="mr-1" />
                  Chốt duyệt & Xuất bản Final
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* TAB 2: THẺ CHÀO KHÁCH (VISUAL CARD KHỔ A6 & XUẤT ẢNH / PDF) */}
      {activeTab === "card" && (
        <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={14} className="text-primary" />
              Bản xem trước Thẻ Chào Khách (Khổ A6 / Share Card)
            </span>
            {status === "FINALIZED" && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Đã chốt duyệt Final
              </span>
            )}
          </div>

          {/* Notification messages */}
          {exportSuccess && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}
          {exportError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-3 text-xs font-medium text-red-800 dark:text-red-300 flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <span>{exportError}</span>
            </div>
          )}

          <SalesPitchCardA6
            ref={cardRef}
            activePitch={activePitch}
            status={status}
          />

          {/* Quick navigation at bottom of card */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("edit")}
              className="text-xs font-semibold gap-1 text-text hover:text-primary"
            >
              <Pencil size={13} />
              Chỉnh sửa thông tin thẻ này
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("script")}
              className="text-xs font-semibold gap-1 text-text hover:text-primary"
            >
              <FileText size={13} />
              Xem Kịch bản Zalo →
            </Button>
          </div>
        </div>
      )}

      {/* TAB 3: KỊCH BẢN ZALO (HIỂN THỊ KHI activeTab = 'script') */}
      {activeTab === "script" && (
        <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
          <ZaloScriptBox
            script={scriptText}
            onCopySuccess={() => setCopied(true)}
          />

          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("card")}
              className="text-xs font-semibold gap-1 text-text hover:text-primary"
            >
              <Eye size={13} />
              ← Xem Thẻ chào khách A6
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
