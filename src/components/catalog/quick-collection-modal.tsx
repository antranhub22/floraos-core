"use client"

import React, { useState, useMemo } from "react"
import {
  Sparkles,
  Zap,
  Check,
  Copy,
  User,
  Phone,
  Filter,
  DollarSign,
  Heart,
  ExternalLink,
  RefreshCw,
  Share2,
} from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  generateQuickCollection,
  type QuickCollectionCandidate,
  type QuickCollectionCriteria,
  type QuickCollectionResult,
} from "@/modules/catalog-links/domain/quick-collection-engine"

export interface QuickCollectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: QuickCollectionCandidate[]
  onCreatedLink?: () => void
  onCreatedGreetingCatalog?: (catalogId: string) => void
}

const COMMON_OCCASIONS = [
  "Sinh nhật",
  "Khai trương",
  "Kỷ niệm",
  "Chúc mừng",
  "Cảm ơn",
  "Chia buồn",
]

const COMMON_CATEGORIES = [
  "Bó hoa",
  "Giỏ hoa",
  "Kệ hoa",
  "Lẵng hoa",
  "Hộp hoa",
  "Bình hoa",
]

const COMMON_FLOWERS = [
  "Hoa hồng",
  "Lan hồ điệp",
  "Hướng dương",
  "Cẩm tú cầu",
  "Baby",
  "Cúc tana",
]

const COMMON_COLORS = [
  "Pastel",
  "Đỏ",
  "Vàng / Cam",
  "Hồng",
  "Trắng",
  "Xanh / Tím",
]

interface QuickBudgetOption {
  id: string
  label: string
  min: number
  max: number
}

const QUICK_BUDGETS: QuickBudgetOption[] = [
  { id: "b1", label: "Dưới 500k", min: 0, max: 500_000 },
  { id: "b2", label: "500k - 800k", min: 500_000, max: 800_000 },
  { id: "b3", label: "800k - 1.5tr", min: 800_000, max: 1_500_000 },
  { id: "b4", label: "Trên 1.5tr", min: 1_500_000, max: 10_000_000 },
]

import {
  GREETING_TEMPLATE_LIST,
  type GreetingTemplateId,
} from "@/modules/greeting-card/domain/greeting-template-registry"

export function QuickCollectionModal({
  open,
  onOpenChange,
  products,
  onCreatedLink,
  onCreatedGreetingCatalog,
}: QuickCollectionModalProps) {
  // Step: "criteria" -> "result"
  const [step, setStep] = useState<"criteria" | "result">("criteria")

  // Criteria States
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [occasion, setOccasion] = useState("")
  const [category, setCategory] = useState("")
  const [flowerType, setFlowerType] = useState("")
  const [colorTone, setColorTone] = useState("")
  const [selectedBudgetIds, setSelectedBudgetIds] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined)
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined)
  const [productLimit, setProductLimit] = useState<number>(6)
  const [templateId, setTemplateId] = useState<string>("editorial-luxury")

  // Creation State
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Toggle budget selection (hỗ trợ chọn nhiều khung giá)
  const handleToggleBudget = (id: string) => {
    setSelectedBudgetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Compute live match
  const liveResult = useMemo<QuickCollectionResult>(() => {
    const selectedRanges = QUICK_BUDGETS
      .filter((b) => selectedBudgetIds.includes(b.id))
      .map((b) => ({ min: b.min, max: b.max, label: b.label }))

    const criteria: QuickCollectionCriteria = {
      occasion: occasion || undefined,
      category: category || undefined,
      flowerType: flowerType || undefined,
      colorTone: colorTone || undefined,
      priceMin,
      priceMax,
      priceRanges: selectedRanges.length > 0 ? selectedRanges : undefined,
      productLimit,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
    }
    return generateQuickCollection(products, criteria)
  }, [
    products,
    occasion,
    category,
    flowerType,
    colorTone,
    selectedBudgetIds,
    priceMin,
    priceMax,
    productLimit,
    customerName,
    customerPhone,
  ])

  // Handle Publish Link (< 2s)
  const handlePublish = async () => {
    setIsPublishing(true)
    setErrorMessage(null)

    try {
      const selectedIds = liveResult.selectedProducts.map((p) => p.id)
      const origin = typeof window !== "undefined" ? window.location.origin : ""

      // 1. Gọi trực tiếp API createSendLink với customCatalog và templateId đã chọn
      const sendLinkRes = await fetch("/api/v1/greeting-card/send-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          customCatalog: {
            name: liveResult.generatedName,
            description: liveResult.personalizedGreeting || "Bộ sưu tập hoa tươi tuyển chọn theo yêu cầu.",
            filters: {
              templateId,
              occasion: occasion || undefined,
              category: category || undefined,
            },
            productIds: selectedIds,
          },
        }),
      })

      if (!sendLinkRes.ok) {
        const errJson = await sendLinkRes.json().catch(() => ({}))
        const errMsg = errJson?.error?.message || errJson?.message || "Không thể tạo link Thẻ Chào gửi khách."
        throw new Error(errMsg)
      }

      const sendLinkJson = await sendLinkRes.json().catch(() => ({}))
      const sendData = sendLinkJson.data
      if (!sendData?.shareUrl) {
        throw new Error("Hệ thống không sinh được link Thẻ Chào gửi khách.")
      }

      const fullSendUrl = `${origin}${sendData.shareUrl}`
      setPublishedUrl(fullSendUrl)
      setStep("result")
      if (onCreatedLink) onCreatedLink()
      if (sendData.catalogId && onCreatedGreetingCatalog) {
        onCreatedGreetingCatalog(sendData.catalogId)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tạo link")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleCopyLinkOnly = async () => {
    if (!publishedUrl) return
    await navigator.clipboard.writeText(publishedUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCustomerMessage = async () => {
    if (!publishedUrl) return
    const finalMsg = liveResult.customerMessage.replace("{URL}", publishedUrl)
    await navigator.clipboard.writeText(finalMsg)
    setCopiedMessage(true)
    setTimeout(() => setCopiedMessage(false), 2000)
  }

  const handleOpenZaloWeb = () => {
    if (!publishedUrl) return
    const finalMsg = liveResult.customerMessage.replace("{URL}", publishedUrl)
    const phone = customerPhone.replace(/[^0-9]/g, "")
    const url = phone
      ? `https://zalo.me/${phone}?text=${encodeURIComponent(finalMsg)}`
      : `https://zalo.me/?text=${encodeURIComponent(finalMsg)}`
    window.open(url, "_blank")
  }

  const resetAll = () => {
    setStep("criteria")
    setPublishedUrl(null)
    setErrorMessage(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetAll()
        onOpenChange(val)
      }}
      size="lg"
      title={
        <div className="flex items-center justify-between gap-3 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-title font-extrabold text-primary flex items-center gap-1.5">
              <Zap size={18} className="text-accent" />
              Tạo nhanh bộ sưu tập
            </span>
            <Badge tone="accent" className="text-caption">&lt; 10s</Badge>
          </div>
          <span className="text-caption text-text-muted">Xuất link gửi khách</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          {step === "criteria" ? (
            <>
              <div className="text-caption text-text-muted">
                Đã chọn{" "}
                <span className="font-bold text-primary">
                  {liveResult.selectedProducts.length}
                </span>{" "}
                mẫu phù hợp
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Đóng
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePublish}
                  disabled={isPublishing || liveResult.selectedProducts.length === 0}
                  className="gap-1.5"
                >
                  <Sparkles size={14} />
                  {isPublishing ? "Đang tạo..." : "Tạo link gửi khách"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={resetAll} className="gap-1.5 text-xs">
                <RefreshCw size={14} /> Tạo thêm bộ khác
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Xong
              </Button>
            </>
          )}
        </div>
      }
    >
      {step === "criteria" ? (
        <div className="space-y-4 py-1">
          {errorMessage && (
            <div className="rounded-xl bg-destructive-bg px-4 py-2.5 text-caption text-destructive flex items-center gap-2">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* 1. KHỐI THÔNG TIN KHÁCH (TÙY CHỌN) */}
          <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-caption font-bold text-primary flex items-center gap-1.5 uppercase tracking-wide">
                <User size={13} />
                Khách hàng (tùy chọn)
              </div>
              <span className="text-caption text-text-muted">Lời chào gắn tên riêng</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Tên khách (vd: Chị Lan)"
                  className="h-9 text-body-sm"
                />
              </div>
              <div>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Số điện thoại"
                  className="h-9 text-body-sm"
                />
              </div>
            </div>
          </div>

          {/* 2. BẢNG TIÊU CHÍ */}
          <div className="p-3.5 rounded-2xl border border-border bg-surface space-y-3.5">
            {/* Khoảng giá */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-caption font-bold text-text flex items-center gap-1.5">
                  <DollarSign size={14} className="text-primary" />
                  Khoảng giá (chọn nhiều khung)
                </label>
                <div className="flex items-center gap-1">
                  {QUICK_BUDGETS.map((qb) => {
                    const isSelected = selectedBudgetIds.includes(qb.id)
                    return (
                      <button
                        type="button"
                        key={qb.id}
                        onClick={() => handleToggleBudget(qb.id)}
                        className={`px-2 py-0.5 rounded-full text-caption font-medium transition border ${
                          isSelected
                            ? "border-primary bg-primary text-white font-bold"
                            : "border-border bg-surface text-text-muted hover:border-primary/40"
                        }`}
                      >
                        {qb.label}
                      </button>
                    )
                  })}
                  {(selectedBudgetIds.length > 0 || priceMin !== undefined || priceMax !== undefined) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBudgetIds([])
                        setPriceMin(undefined)
                        setPriceMax(undefined)
                      }}
                      className="px-1.5 py-0.5 text-caption text-text-muted hover:text-text underline"
                    >
                      Bỏ chọn
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Giá từ"
                  value={priceMin ?? ""}
                  onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
                  className="h-9 text-body-sm"
                />
                <Input
                  type="number"
                  placeholder="Đến"
                  value={priceMax ?? ""}
                  onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
                  className="h-9 text-body-sm"
                />
              </div>
            </div>

            {/* Dịp tặng */}
            <div>
              <label className="block text-caption font-bold text-text mb-1.5">
                Dịp tặng
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_OCCASIONS.map((occ) => (
                  <button
                    type="button"
                    key={occ}
                    onClick={() => setOccasion(occasion === occ ? "" : occ)}
                    className={`px-2.5 py-1 rounded-xl text-caption font-medium transition border ${
                      occasion === occ
                        ? "border-primary bg-primary text-white font-bold shadow-xs"
                        : "border-border bg-surface text-text hover:border-primary/40"
                    }`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>

            {/* Dáng hoa & Loại hoa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-caption font-bold text-text mb-1.5">
                  Dáng hoa
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(category === cat ? "" : cat)}
                      className={`px-2 py-0.5 rounded-lg text-caption font-medium transition border ${
                        category === cat
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border bg-surface text-text hover:border-primary/40"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-caption font-bold text-text mb-1.5">
                  Loại hoa
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_FLOWERS.map((fl) => (
                    <button
                      type="button"
                      key={fl}
                      onClick={() => setFlowerType(flowerType === fl ? "" : fl)}
                      className={`px-2 py-0.5 rounded-lg text-caption font-medium transition border ${
                        flowerType === fl
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border bg-surface text-text hover:border-primary/40"
                      }`}
                    >
                      {fl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tone màu & Số lượng mẫu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border">
              <div>
                <label className="block text-caption font-bold text-text mb-1.5">
                  Tone màu
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_COLORS.map((col) => (
                    <button
                      type="button"
                      key={col}
                      onClick={() => setColorTone(colorTone === col ? "" : col)}
                      className={`px-2 py-0.5 rounded-lg text-caption font-medium transition border ${
                        colorTone === col
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border bg-surface text-text hover:border-primary/40"
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-caption font-bold text-text">
                    Số mẫu gửi khách
                  </label>
                  <span className="text-caption font-bold text-primary">{productLimit} mẫu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[4, 6, 8, 10, 12].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setProductLimit(num)}
                      className={`flex-1 py-1 rounded-lg text-caption font-medium transition border text-center ${
                        productLimit === num
                          ? "border-primary bg-primary text-white font-bold"
                          : "border-border bg-surface text-text hover:border-primary/40"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Giao diện Thẻ Chào Mẫu Hoa (Dropdown) */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-caption font-bold text-text flex items-center gap-1.5">
                  <Sparkles size={13} className="text-primary" />
                  Mẫu giao diện
                </label>
                <span className="text-caption text-text-muted">
                  Vuốt 3D · {GREETING_TEMPLATE_LIST.length} mẫu
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="w-full h-9 rounded-xl border border-border bg-surface px-3 text-body-sm text-text font-medium focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                  >
                    {GREETING_TEMPLATE_LIST.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.styleNumber ? `#${tmpl.styleNumber} · ` : ""}{tmpl.name} ({tmpl.subtitle || tmpl.tag})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center px-3 py-1.5 rounded-xl bg-surface-alt border border-border text-caption text-text-muted truncate">
                  <span className="font-semibold text-text mr-1">Phong cách:</span>
                  <span className="truncate">
                    {GREETING_TEMPLATE_LIST.find((t) => t.id === templateId)?.tag || "Sang trọng"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. PREVIEW MẪU HOA */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-caption font-bold text-text flex items-center gap-1.5">
                <Sparkles size={13} className="text-accent" />
                Mẫu hoa đề xuất ({liveResult.selectedProducts.length} mẫu)
              </span>
              <span className="text-caption text-text-muted">
                {liveResult.generatedName}
              </span>
            </div>
            {liveResult.selectedProducts.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border bg-surface-alt text-center space-y-1">
                <div className="text-caption font-bold text-text-muted">
                  {category || occasion || flowerType
                    ? "🔍 Kho chưa có sản phẩm loại này"
                    : "🔍 Chưa có mẫu phù hợp"}
                </div>
                <div className="text-caption text-text-muted">
                  {category || occasion || flowerType
                    ? "Hãy bỏ chọn bộ lọc hoặc thêm sản phẩm loại này vào kho."
                    : "Hãy thử đổi khoảng giá hoặc bớt bộ lọc."}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {liveResult.selectedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl border border-border bg-surface flex items-center gap-2 hover:border-primary/40 transition-colors"
                  >
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-surface-alt border border-border flex items-center justify-center shrink-0 text-text-muted text-caption">
                        🌸
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-caption font-bold text-text truncate">{p.name}</div>
                      <div className="text-caption font-extrabold text-primary">
                        {p.price ? `${p.price.toLocaleString("vi-VN")} ₫` : "Liên hệ"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* KẾT QUẢ: XUẤT LINK & CHIA SẺ */
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl bg-success-bg border border-success/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success text-white flex items-center justify-center shrink-0">
              <Check size={20} />
            </div>
            <div>
              <div className="text-body-sm font-extrabold text-success">
                Đã tạo xong link bộ sưu tập!
              </div>
              <div className="text-caption text-text-muted">
                Sẵn sàng gửi cho khách hàng.
              </div>
            </div>
          </div>

          {/* Ô Copy Link */}
          <div className="space-y-1.5">
            <label className="block text-caption font-bold text-text">
              1. Link xem bộ sưu tập
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={publishedUrl || ""}
                className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-body-sm text-text focus:outline-none select-all font-mono"
              />
              <Button
                variant={copiedLink ? "outline" : "primary"}
                onClick={handleCopyLinkOnly}
                className={`gap-1.5 text-caption font-bold px-3.5 h-9 shrink-0 shadow-xs transition-all ${
                  copiedLink
                    ? "border-success text-success bg-success-bg"
                    : "ring-2 ring-primary/25 hover:ring-primary/40"
                }`}
              >
                {copiedLink ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                {copiedLink ? "Đã chép link!" : "Sao chép link"}
              </Button>
              {publishedUrl && (
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-border hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
                  title="Mở xem thử"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Soạn sẵn tin nhắn mẫu gửi khách */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-caption font-bold text-text">
                2. Tin nhắn mẫu gửi khách
              </label>
              <button
                type="button"
                onClick={handleCopyCustomerMessage}
                className={`text-caption font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
                  copiedMessage
                    ? "border-success text-success bg-success-bg"
                    : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 shadow-2xs"
                }`}
              >
                {copiedMessage ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                {copiedMessage ? "Đã chép tin!" : "Sao chép tin nhắn"}
              </button>
            </div>
            <textarea
              readOnly
              rows={3}
              value={publishedUrl ? liveResult.customerMessage.replace("{URL}", publishedUrl) : ""}
              className="w-full p-2.5 rounded-xl bg-surface border border-border text-body-sm text-text focus:outline-none leading-relaxed"
            />
          </div>

          {/* Nút gửi trực tiếp qua Zalo */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenZaloWeb}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-surface font-bold text-body-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors"
            >
              <Share2 size={16} />
              <span>Gửi qua Zalo</span>
            </button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
