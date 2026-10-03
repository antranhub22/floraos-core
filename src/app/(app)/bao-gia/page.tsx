"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Camera,
  Check,
  Copy,
  Download,
  Filter,
  Layers,
  Receipt,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SkeletonBlock } from "@/components/ui/skeleton"

type ProductItem = {
  id: string
  title: string
  price: number
  category?: string
  image_url?: string
  description?: string
  composition?: string[]
}

const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: "p1",
    title: "Bó Hoa Hồng Đỏ Lãng Mạn",
    price: 599000,
    category: "Bó hoa",
    image_url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80",
    description: "Hồng đỏ Đà Lạt tuyển chọn kết hợp lá bạc nhập khẩu",
    composition: ["15 cành hồng đỏ", "Lá bạc nhập", "Giấy gói cao cấp"],
  },
  {
    id: "p2",
    title: "Giỏ Hoa Khai Trương Hồng Phát",
    price: 850000,
    category: "Giỏ hoa",
    image_url: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=600&q=80",
    description: "Tone vàng cam rực rỡ mang tài lộc và may mắn",
    composition: ["Hoa đồng tiền vàng", "Lan vũ nữ", "Hồng cam spirit", "Giỏ mây"],
  },
  {
    id: "p3",
    title: "Bó Hoa Cẩm Tú Cầu Xanh Lam",
    price: 649000,
    category: "Bó hoa",
    image_url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80",
    description: "Cẩm tú cầu Đà Lạt nở rộ phối cùng baby trắng tinh khôi",
    composition: ["3 bông cẩm tú cầu", "Hoa baby trắng", "Lá khuynh diệp"],
  },
  {
    id: "p4",
    title: "Hộp Hoa Sinh Nhật Ngọt Ngào",
    price: 699000,
    category: "Hộp hoa",
    image_url: "https://images.unsplash.com/photo-1533616688419-b7a585564566?auto=format&fit=crop&w=600&q=80",
    description: "Hộp hoa tròn tone hồng pastel thanh lịch và nữ tính",
    composition: ["Hồng kem dâu", "Cát tường trắng", "Cúc tana", "Hộp quà"],
  },
  {
    id: "p5",
    title: "Bình Hoa Sen Trắng Thanh Nhã",
    price: 1200000,
    category: "Bình hoa",
    image_url: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=600&q=80",
    description: "Hoa sen quan âm trắng thuần khiết phối gương sen",
    composition: ["10 bông sen quan âm", "Gương sen", "Lá sen non", "Bình gốm"],
  },
]

export default function BaoGiaPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"CUSTOMER" | "PARTNER">("CUSTOMER")
  const [dangTai, setDangTai] = useState(true)
  const [products, setProducts] = useState<ProductItem[]>([])
  const [budgetFilter, setBudgetFilter] = useState<string>("ALL")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [selectedIds, setSelectedIds] = useState<string[]>(["p1", "p3", "p4"])
  const [copied, setCopied] = useState(false)

  // Source Mode per Tab: "LIBRARY" vs "UPLOAD"
  const [customerSourceMode, setCustomerSourceMode] = useState<"LIBRARY" | "UPLOAD">("LIBRARY")
  const [partnerSourceMode, setPartnerSourceMode] = useState<"LIBRARY" | "UPLOAD">("LIBRARY")

  // Upload & AI Analysis State
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzedSuccess, setAnalyzedSuccess] = useState(false)
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)
  const [analyzedTitle, setAnalyzedTitle] = useState("Bó hoa hướng dương rực rỡ")
  const [analyzedPrice, setAnalyzedPrice] = useState("680000")
  const [analyzedComposition, setAnalyzedComposition] = useState("7 cành hướng dương, hoa mõm sói trắng, lá bạc")

  // Partner form state
  const [partnerItemName, setPartnerItemName] = useState("Bó hoa hồng đỏ 15 cành")
  const [partnerPrice, setPartnerPrice] = useState("450000")
  const [deliveryFee, setDeliveryFee] = useState("30000")
  const [deadlineTime, setDeadlineTime] = useState("14:30 hôm nay")

  const napDuLieu = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/products")
      if (res.ok) {
        const data = await res.json()
        const rawList = Array.isArray(data) ? data : data.products || []
        if (rawList.length > 0) {
          const mapped: ProductItem[] = rawList.map((item: Record<string, unknown>, idx: number) => ({
            id: String(item.id || `prod-${idx}`),
            title: String(item.title || item.name || "Mẫu hoa tươi"),
            price: Number(item.price || 500000),
            category: String(item.category || "Bó hoa"),
            image_url: String(item.thumbnail_url || item.image_url || (SAMPLE_PRODUCTS[idx % SAMPLE_PRODUCTS.length]?.image_url ?? "")),
            description: String(item.description || "Hoa tươi tuyển chọn"),
            composition: Array.isArray(item.composition) ? (item.composition as string[]) : ["Hoa chính", "Lá phụ", "Phụ liệu"],
          }))
          setProducts(mapped)
          return
        }
      }
    } catch {
      // Fallback
    }
    setProducts(SAMPLE_PRODUCTS)
  }, [])

  useEffect(() => {
    let cancelled = false
    napDuLieu().finally(() => {
      if (!cancelled) setDangTai(false)
    })
    return () => {
      cancelled = true
    }
  }, [napDuLieu])

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "ALL" && p.category !== categoryFilter) return false
    if (budgetFilter === "UNDER_500" && p.price >= 500000) return false
    if (budgetFilter === "500_700" && (p.price < 500000 || p.price > 700000)) return false
    if (budgetFilter === "700_1000" && (p.price < 700000 || p.price > 1000000)) return false
    if (budgetFilter === "ABOVE_1000" && p.price <= 1000000) return false
    return true
  })

  const toggleProductSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      setUploadedPreview(url)
      setAnalyzing(true)
      setAnalyzedSuccess(false)

      // Simulate vision AI analysis
      setTimeout(() => {
        setAnalyzing(false)
        setAnalyzedSuccess(true)
        setAnalyzedTitle("Bó hoa tươi nghệ thuật mới")
        setAnalyzedPrice("720000")
        setAnalyzedComposition("Hoa hồng Ohara nhập, baby trắng, lá bạc cao cấp")
      }, 1200)
    }
    reader.readAsDataURL(file)
  }

  const handleAddAnalyzedToCustomerQuote = () => {
    const newId = `upload-${Date.now()}`
    const newItem: ProductItem = {
      id: newId,
      title: analyzedTitle,
      price: Number(analyzedPrice) || 700000,
      category: "Bó hoa",
      image_url: uploadedPreview || (SAMPLE_PRODUCTS[0]?.image_url ?? ""),
      description: "Mẫu hoa tươi vừa phân tích từ ảnh",
      composition: analyzedComposition.split(",").map((s) => s.trim()),
    }
    setProducts((prev) => [newItem, ...prev])
    setSelectedIds((prev) => [newId, ...prev])
    setCustomerSourceMode("LIBRARY")
  }

  const handleApplyAnalyzedToPartner = () => {
    setPartnerItemName(analyzedTitle)
    setPartnerPrice(String(Math.round((Number(analyzedPrice) || 600000) * 0.75)))
    setPartnerSourceMode("LIBRARY")
  }

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id))

  const handleCopyQuote = () => {
    const text = selectedProducts
      .map(
        (p, idx) =>
          `Mẫu ${idx + 1}: ${p.title} - ${p.price.toLocaleString("vi-VN")} đ\nThành phần: ${p.composition?.join(", ")}`
      )
      .join("\n\n")

    navigator.clipboard.writeText(`BẢNG BÁO GIÁ HOA TƯƠI\n\n${text}\n\nLiên hệ đặt hoa: Hotline của Tiệm`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Top Header */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-selected text-primary">
            <Receipt className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-title font-extrabold text-primary">Tạo Thẻ báo giá sản phẩm</h1>
            <p className="text-caption text-text-muted">
              Tạo bộ lựa chọn sản phẩm gửi khách mua hoa hoặc xuất thẻ báo giá cho đối tác shop
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/gia")}
            className="flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-4 h-4 text-text-muted" aria-hidden="true" />
            <span>Cấu hình quy tắc giá</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Trang chủ</span>
          </Button>
        </div>
      </header>

      {/* Mode Selector Tabs (Hiển thị đầy đủ trên cả Cửa hàng hoa và Điện hoa) */}
      <div className="border-b border-border bg-surface px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("CUSTOMER")}
            className={`px-3.5 py-1.5 rounded-lg text-body-sm font-medium transition-colors cursor-pointer ${
              activeTab === "CUSTOMER"
                ? "bg-primary text-surface font-semibold"
                : "bg-surface border border-border text-text hover:bg-surface-alt"
            }`}
          >
            Gửi khách mua hoa (Store Admin)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PARTNER")}
            className={`px-3.5 py-1.5 rounded-lg text-body-sm font-medium transition-colors cursor-pointer ${
              activeTab === "PARTNER"
                ? "bg-primary text-surface font-semibold"
                : "bg-surface border border-border text-text hover:bg-surface-alt"
            }`}
          >
            Báo giá đối tác Shop (Điện Hoa)
          </button>
        </div>

        <span className="text-caption text-text-muted hidden sm:inline-block">
          {activeTab === "CUSTOMER"
            ? "Đã chọn " + selectedProducts.length + " mẫu hoa vào bảng giá"
            : "Chế độ giao việc cho Shop gia công điện hoa"}
        </span>
      </div>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto w-full">
        {dangTai ? (
          <div className="space-y-4">
            <SkeletonBlock lines={4} label="Đang tải dữ liệu sản phẩm" />
          </div>
        ) : activeTab === "CUSTOMER" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Source Selection + Filter & Products (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Dual Source Selector */}
              <div className="flex items-center gap-2 p-1.5 rounded-xl border border-border bg-surface">
                <button
                  type="button"
                  onClick={() => setCustomerSourceMode("LIBRARY")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-body-sm font-medium transition-colors cursor-pointer ${
                    customerSourceMode === "LIBRARY"
                      ? "bg-primary text-surface font-semibold shadow-xs"
                      : "text-text hover:bg-surface-alt"
                  }`}
                >
                  <Layers className="w-4 h-4" aria-hidden="true" />
                  <span>Ảnh từ kho Sản phẩm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerSourceMode("UPLOAD")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-body-sm font-medium transition-colors cursor-pointer ${
                    customerSourceMode === "UPLOAD"
                      ? "bg-primary text-surface font-semibold shadow-xs"
                      : "text-text hover:bg-surface-alt"
                  }`}
                >
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  <span>Ảnh sản phẩm mới (Tải ảnh & phân tích)</span>
                </button>
              </div>

              {/* Source View 1: UPLOAD NEW PHOTO */}
              {customerSourceMode === "UPLOAD" && (
                <Card className="p-4 bg-surface border-border space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="flex items-center gap-2 text-body-sm font-semibold text-text">
                      <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span>Tải ảnh hoa mới để hệ thống nhận diện & tạo thẻ báo giá</span>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors bg-surface-alt">
                    <input
                      id="customer-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleSimulateUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="customer-photo-upload"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <UploadCloud className="w-8 h-8 text-primary" aria-hidden="true" />
                      <div className="text-body-sm font-bold text-text">
                        Bấm để tải ảnh mẫu hoa hoặc kéo thả vào đây
                      </div>
                      <div className="text-caption text-text-muted">
                        Hỗ trợ ảnh chụp điện thoại (JPG, PNG, WebP)
                      </div>
                    </label>
                  </div>

                  {analyzing && (
                    <div className="p-4 rounded-xl border border-border bg-selected/30 flex items-center justify-center gap-3">
                      <RefreshCw className="w-4 h-4 text-primary animate-spin" aria-hidden="true" />
                      <span className="text-body-sm font-medium text-primary">
                        Hệ thống đang phân tích loài hoa, đếm số cành và ước tính giá...
                      </span>
                    </div>
                  )}

                  {analyzedSuccess && (
                    <div className="p-4 rounded-xl border border-primary/40 bg-selected/20 space-y-3">
                      <div className="flex items-center gap-3">
                        {uploadedPreview && (
                          <img
                            src={uploadedPreview}
                            alt="Ảnh vừa tải"
                            className="w-16 h-16 rounded-lg object-cover border border-border"
                          />
                        )}
                        <div className="flex-1 space-y-1">
                          <label htmlFor="analyzed-title-input" className="text-caption text-text-muted block">Tên sản phẩm nhận diện:</label>
                          <input
                            id="analyzed-title-input"
                            type="text"
                            value={analyzedTitle}
                            onChange={(e) => setAnalyzedTitle(e.target.value)}
                            className="w-full px-2.5 py-1 rounded-md border border-border bg-surface text-body-sm font-bold text-text"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="analyzed-price-input" className="text-caption text-text-muted block mb-1">Giá báo đề xuất (đ):</label>
                          <input
                            id="analyzed-price-input"
                            type="number"
                            value={analyzedPrice}
                            onChange={(e) => setAnalyzedPrice(e.target.value)}
                            className="w-full px-2.5 py-1 rounded-md border border-border bg-surface text-body-sm font-bold text-primary"
                          />
                        </div>
                        <div>
                          <label htmlFor="analyzed-comp-input" className="text-caption text-text-muted block mb-1">Thành phần hoa nhận diện:</label>
                          <input
                            id="analyzed-comp-input"
                            type="text"
                            value={analyzedComposition}
                            onChange={(e) => setAnalyzedComposition(e.target.value)}
                            className="w-full px-2.5 py-1 rounded-md border border-border bg-surface text-caption text-text"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddAnalyzedToCustomerQuote}
                          className="bg-primary text-surface font-semibold hover:bg-primary-hover"
                        >
                          <Check className="w-4 h-4 mr-1.5" aria-hidden="true" />
                          Thêm vào bảng báo giá khách hàng
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Source View 2: PRODUCT LIBRARY & FILTER */}
              {customerSourceMode === "LIBRARY" && (
                <>
                  <Card className="p-4 bg-surface border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-body-sm font-semibold text-text">
                        <Filter className="w-4 h-4 text-primary" aria-hidden="true" />
                        <span>Lọc mẫu hoa theo nhu cầu của khách</span>
                      </div>
                      <span className="text-caption text-text-muted">
                        {filteredProducts.length} mẫu phù hợp
                      </span>
                    </div>

                    {/* Budget filter buttons */}
                    <div>
                      <span className="text-caption text-text-muted block mb-1.5">Ngân sách mong muốn:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: "ALL", label: "Tất cả mức giá" },
                          { id: "UNDER_500", label: "Dưới 500K" },
                          { id: "500_700", label: "500K – 700K" },
                          { id: "700_1000", label: "700K – 1 Triệu" },
                          { id: "ABOVE_1000", label: "Trên 1 Triệu" },
                        ].map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setBudgetFilter(b.id)}
                            className={`px-2.5 py-1 rounded-md text-caption font-medium transition-colors cursor-pointer ${
                              budgetFilter === b.id
                                ? "bg-primary text-surface font-semibold"
                                : "bg-surface border border-border text-text hover:bg-surface-alt"
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category filter buttons */}
                    <div>
                      <span className="text-caption text-text-muted block mb-1.5">Loại sản phẩm:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: "ALL", label: "Tất cả loại hoa" },
                          { id: "Bó hoa", label: "Bó hoa" },
                          { id: "Giỏ hoa", label: "Giỏ hoa" },
                          { id: "Hộp hoa", label: "Hộp hoa" },
                          { id: "Bình hoa", label: "Bình hoa" },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCategoryFilter(c.id)}
                            className={`px-2.5 py-1 rounded-md text-caption font-medium transition-colors cursor-pointer ${
                              categoryFilter === c.id
                                ? "bg-primary text-surface font-semibold"
                                : "bg-surface border border-border text-text hover:bg-surface-alt"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Product list */}
                  <div className="space-y-2.5">
                    {filteredProducts.map((p) => {
                      const isSelected = selectedIds.includes(p.id)
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isSelected
                              ? "border-primary bg-selected/40 shadow-xs"
                              : "border-border bg-surface hover:border-text-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image_url}
                              alt={p.title}
                              className="w-14 h-14 rounded-lg object-cover border border-border"
                            />
                            <div>
                              <div className="text-body-sm font-bold text-text">{p.title}</div>
                              <div className="text-caption text-text-muted mt-0.5">
                                {p.composition?.join(" • ") || p.description}
                              </div>
                              <div className="text-body-sm font-extrabold text-primary mt-1">
                                {p.price.toLocaleString("vi-VN")} đ
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleProductSelection(p.id)}
                            className={`px-3 py-1.5 rounded-lg text-caption font-semibold transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-primary text-surface"
                                : "border border-border bg-surface text-text hover:bg-surface-alt"
                            }`}
                          >
                            {isSelected ? "Đã chọn ✓" : "Chọn vào bộ"}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Live Quote Card Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-4 bg-surface border-border space-y-4 sticky top-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span className="text-body-sm font-bold text-text">Bản xem trước Thẻ báo giá</span>
                  </div>
                  <Badge tone="neutral" className="text-caption">
                    Chuẩn A6 gửi Zalo
                  </Badge>
                </div>

                {/* Printable / Shareable Card Container */}
                <div className="rounded-xl border-2 border-dashed border-border p-4 bg-surface-alt space-y-4">
                  <div className="text-center pb-2 border-b border-border">
                    <div className="text-title-sm font-extrabold text-primary tracking-wide uppercase">
                      BỘ MẪU HOA GỢI Ý
                    </div>
                    <div className="text-caption text-text-muted mt-0.5">
                      Gợi ý theo ngân sách và dịp tặng của quý khách
                    </div>
                  </div>

                  {selectedProducts.length === 0 ? (
                    <div className="py-8 text-center text-text-muted text-caption">
                      Chưa có mẫu hoa nào được chọn. Hãy bấm chọn mẫu hoa bên trái hoặc tải ảnh mới để đưa vào bảng giá.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {selectedProducts.map((p, idx) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-surface border border-border"
                        >
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="w-12 h-12 rounded-md object-cover border border-border"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-caption font-bold text-primary">Mẫu {idx + 1}</span>
                              <span className="text-body-sm font-extrabold text-text">
                                {p.price.toLocaleString("vi-VN")} đ
                              </span>
                            </div>
                            <div className="text-caption font-semibold text-text truncate">{p.title}</div>
                            <div className="text-caption text-text-muted truncate">
                              {p.composition?.join(", ")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-border flex items-center justify-between text-caption text-text-muted">
                    <span>* Giá đã bao gồm thiệp chúc mừng</span>
                    <span className="font-semibold text-primary">Hotline cửa hàng</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCopyQuote}
                    disabled={selectedProducts.length === 0}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" aria-hidden="true" />
                        <span>Đã sao chép nội dung báo giá!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" aria-hidden="true" />
                        <span>Sao chép bảng giá gửi Zalo</span>
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert("Đã lưu thẻ báo giá vào kho tài nguyên cửa hàng!")}
                      disabled={selectedProducts.length === 0}
                      className="flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4 text-text-muted" aria-hidden="true" />
                      <span>Tải ảnh thẻ</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/don-hang")}
                      className="flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-4 h-4 text-text-muted" aria-hidden="true" />
                      <span>Tạo đơn từ mẫu</span>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Partner Quote Form (Tab 2) */
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Dual Source Selector for Partner */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-border bg-surface">
              <button
                type="button"
                onClick={() => setPartnerSourceMode("LIBRARY")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-body-sm font-medium transition-colors cursor-pointer ${
                  partnerSourceMode === "LIBRARY"
                    ? "bg-primary text-surface font-semibold shadow-xs"
                    : "text-text hover:bg-surface-alt"
                }`}
              >
                <Layers className="w-4 h-4" aria-hidden="true" />
                <span>Chọn mẫu từ kho hoa tiệm</span>
              </button>
              <button
                type="button"
                onClick={() => setPartnerSourceMode("UPLOAD")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-body-sm font-medium transition-colors cursor-pointer ${
                  partnerSourceMode === "UPLOAD"
                    ? "bg-primary text-surface font-semibold shadow-xs"
                    : "text-text hover:bg-surface-alt"
                }`}
              >
                <Camera className="w-4 h-4" aria-hidden="true" />
                <span>Tải ảnh mẫu gia công mới</span>
              </button>
            </div>

            {/* Partner Upload Section */}
            {partnerSourceMode === "UPLOAD" && (
              <Card className="p-4 bg-surface border-border space-y-3">
                <div className="border-2 border-dashed border-border rounded-xl p-5 text-center bg-surface-alt">
                  <input
                    id="partner-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleSimulateUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="partner-photo-upload"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                  >
                    <UploadCloud className="w-6 h-6 text-primary" aria-hidden="true" />
                    <span className="text-body-sm font-bold text-text">
                      Tải ảnh mẫu hoa khách yêu cầu để phân tích thành phần cành
                    </span>
                    <span className="text-caption text-text-muted">
                      Hệ thống tự động trích xuất loại hoa và gợi ý giá gia công
                    </span>
                  </label>
                </div>

                {analyzedSuccess && (
                  <div className="p-3 rounded-lg border border-primary/40 bg-selected/20 flex items-center justify-between">
                    <div>
                      <div className="text-body-sm font-bold text-text">{analyzedTitle}</div>
                      <div className="text-caption text-text-muted">{analyzedComposition}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyAnalyzedToPartner}
                      className="bg-primary text-surface font-semibold"
                    >
                      Áp dụng vào phiếu giao việc
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Partner Quick Select from Library */}
            {partnerSourceMode === "LIBRARY" && (
              <Card className="p-4 bg-surface border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-semibold text-text">
                    Chọn nhanh mẫu hoa từ kho để điền thông số:
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {products.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPartnerItemName(p.title)
                        setPartnerPrice(String(Math.round(p.price * 0.75)))
                      }}
                      className="flex-shrink-0 flex items-center gap-2 p-2 rounded-lg border border-border bg-surface hover:border-primary text-left cursor-pointer transition-colors"
                    >
                      <img src={p.image_url} alt={p.title} className="w-8 h-8 rounded-md object-cover" />
                      <div className="max-w-[130px]">
                        <div className="text-caption font-bold text-text truncate">{p.title}</div>
                        <div className="text-caption text-primary">{Math.round(p.price * 0.75).toLocaleString("vi-VN")} đ</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6 bg-surface border-border space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="p-2 rounded-lg bg-selected text-primary">
                  <Layers className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-title-sm font-bold text-text">
                    Thông tin Thẻ báo giá cho Shop đối tác (Gia công cắm hoa)
                  </h2>
                  <p className="text-caption text-text-muted">
                    Áp dụng cho các đơn giao việc trong mạng lưới điều phối điện hoa
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="partner-item-name" className="text-caption font-semibold text-text">
                    Tên mẫu hoa cần gia công
                  </label>
                  <input
                    id="partner-item-name"
                    type="text"
                    value={partnerItemName}
                    onChange={(e) => setPartnerItemName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-body-sm text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="partner-price" className="text-caption font-semibold text-text">
                    Giá trả cho đối tác (VNĐ)
                  </label>
                  <input
                    id="partner-price"
                    type="number"
                    value={partnerPrice}
                    onChange={(e) => setPartnerPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-body-sm text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="delivery-fee" className="text-caption font-semibold text-text">
                    Phí giao hoa hỗ trợ (VNĐ)
                  </label>
                  <input
                    id="delivery-fee"
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-body-sm text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="deadline-time" className="text-caption font-semibold text-text">
                    Hạn chót cắm xong
                  </label>
                  <input
                    id="deadline-time"
                    type="text"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-body-sm text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Preview Partner Ticket */}
              <div className="p-4 rounded-xl border border-dashed border-border bg-surface-alt space-y-2">
                <div className="flex items-center justify-between text-body-sm font-bold text-primary">
                  <span>PHIẾU GIAO VIỆC ĐIỆN HOA — MÃ GIA CÔNG #DH-982</span>
                  <Badge tone="neutral">Chờ đối tác nhận</Badge>
                </div>
                <div className="text-caption text-text">
                  <strong>Yêu cầu sản xuất:</strong> {partnerItemName}
                </div>
                <div className="text-caption text-text">
                  <strong>Thực nhận của Shop:</strong>{" "}
                  {(Number(partnerPrice) + Number(deliveryFee)).toLocaleString("vi-VN")} đ (bao gồm cả phí ship)
                </div>
                <div className="text-caption text-text-muted">
                  <strong>Hạn chót hoàn thành:</strong> {deadlineTime}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => alert("Đã lưu nháp phiếu báo giá gia công!")}
                >
                  Lưu nháp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => alert("Đã xuất thẻ báo giá gửi Shop đối tác qua Zalo/Portal!")}
                  className="bg-primary text-surface hover:bg-primary-hover font-semibold border-transparent"
                >
                  Xuất phiếu báo giá gửi Shop
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
