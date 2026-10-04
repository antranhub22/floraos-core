"use client"

import React, { useState, useEffect } from "react"
import {
  BookOpen, Plus, Send, CheckCircle2, Copy, Check,
  ExternalLink, ArrowRight, ArrowLeft, Sparkles, Loader2,
  Eye, CopyPlus, Link as LinkIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CatalogProductPicker } from "@/components/greeting-card/catalog/catalog-product-picker"
import { BrochurePreviewModal } from "@/components/greeting-card/customer/brochure-preview-modal"
import { TemplateSelectorCard } from "@/components/greeting-card/customer/templates/template-selector-card"
import {
  GreetingTemplateId,
  resolveGreetingTemplateId,
} from "@/modules/greeting-card/domain/greeting-template-registry"

interface CatalogOption {
  id: string
  name: string
  code: string
  itemCount: number
  filters?: Record<string, unknown> | null
}

interface JourneyWizardProps {
  onFinish?: () => void
  onGoToManager?: () => void
}

export function JourneyWizard({ onFinish, onGoToManager }: JourneyWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [catalogs, setCatalogs] = useState<CatalogOption[]>([])
  const [loadingCatalogs, setLoadingCatalogs] = useState(true)
  const [orgSlug, setOrgSlug] = useState<string>("siinstore")

  // Live preview modal state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string>("")

  // Quick clone modal state (Tạo thêm link dùng chung khác cùng mẫu hoa)
  const [isCloning, setIsCloning] = useState(false)
  const [cloneCode, setCloneCode] = useState("")
  const [cloneName, setCloneName] = useState("")
  const [cloningLoading, setCloningLoading] = useState(false)

  // Step 1: Chọn hoặc tạo catalog
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("")
  const [isCreatingCatalog, setIsCreatingCatalog] = useState(false)
  const [newCatalogName, setNewCatalogName] = useState("")
  const [newCatalogCode, setNewCatalogCode] = useState("")
  const [savingCatalog, setSavingCatalog] = useState(false)
  // Số sản phẩm đã thêm vào catalog được chọn — cần > 0 để tiếp tục sang Bước 2
  const [catalogItemCount, setCatalogItemCount] = useState(0)
  // Mẫu Template trải nghiệm khách hàng
  const [selectedTemplateId, setSelectedTemplateId] = useState<GreetingTemplateId>("enterprise-luxury")

  async function handleSelectTemplate(newTemplateId: GreetingTemplateId) {
    setSelectedTemplateId(newTemplateId)
    if (selectedCatalogId) {
      const currentCat = catalogs.find((c) => c.id === selectedCatalogId)
      const existingFilters = (currentCat?.filters as Record<string, unknown> | null) || {}
      const updatedFilters = { ...existingFilters, templateId: newTemplateId }
      try {
        await fetch(`/api/v1/greeting-card/catalogs/${selectedCatalogId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters: updatedFilters }),
        })
        setCatalogs((prev) =>
          prev.map((c) => (c.id === selectedCatalogId ? { ...c, filters: updatedFilters } : c))
        )
      } catch {}
    }
  }

  // Step 2: Tạo link gửi khách
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [creatingLink, setCreatingLink] = useState(false)

  // Step 3: Kết quả link gửi
  const [createdSendCode, setCreatedSendCode] = useState<string>("")
  const [createdShareUrl, setCreatedShareUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [copiedPublicLink, setCopiedPublicLink] = useState(false)

  function getDisplayPath(cat?: CatalogOption | null) {
    const target = cat ?? catalogs.find((c) => c.id === selectedCatalogId)
    if (!target) return ""
    if (orgSlug && target.code) {
      return `bst/${orgSlug}/${target.code}`
    }
    return `g/${target.id}`
  }

  function getPublicUrl(cat?: CatalogOption | null) {
    const target = cat ?? catalogs.find((c) => c.id === selectedCatalogId)
    if (!target) return ""
    const path = getDisplayPath(target)
    return `${typeof window !== "undefined" ? window.location.origin : ""}/${path}`
  }

  function handleCopyPublicLink(cat?: CatalogOption) {
    const target = cat ?? catalogs.find((c) => c.id === selectedCatalogId)
    if (!target) return
    const publicUrl = getPublicUrl(target)
    void navigator.clipboard.writeText(publicUrl)
    setCopiedPublicLink(true)
    setTimeout(() => setCopiedPublicLink(false), 2500)
  }

  function handleOpenPreview(cat?: CatalogOption) {
    const target = cat ?? catalogs.find((c) => c.id === selectedCatalogId)
    if (!target) return
    const url = getPublicUrl(target)
    setPreviewUrl(url)
    setPreviewTitle(`Xem trước: ${target.name} (${orgSlug}/${target.code})`)
  }

  async function handleCloneCatalog(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCatalogId || !cloneCode.trim()) return
    setCloningLoading(true)
    try {
      // 1. Lấy thông tin các sản phẩm hiện tại của catalog được chọn
      const detailRes = await fetch(`/api/v1/greeting-card/catalogs/${selectedCatalogId}`)
      const detailJson = await detailRes.json() as { data?: { items?: Array<{ product: { id: string } }> } }
      const productIds = detailJson.data?.items?.map((item) => item.product.id) || []

      // 2. Tạo catalog mới với code mới và các sản phẩm đã có
      const createRes = await fetch("/api/v1/greeting-card/catalogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cloneName.trim() || `${selectedCatalog?.name} (Link mới)`,
          code: cloneCode.toLowerCase().trim(),
          type: "STANDARD",
          productIds,
        }),
      })

      if (createRes.ok) {
        const createJson = await createRes.json() as { data?: { id: string } }
        setIsCloning(false)
        setCloneCode("")
        setCloneName("")
        await loadCatalogs()
        if (createJson.data?.id) {
          setSelectedCatalogId(createJson.data.id)
          setCatalogItemCount(productIds.length)
        }
      }
    } finally {
      setCloningLoading(false)
    }
  }

  async function loadOrgSlug() {
    try {
      const res = await fetch("/api/v1/organizations/current")
      if (res.ok) {
        const data = await res.json() as { slug?: string }
        if (data.slug) setOrgSlug(data.slug)
      }
    } catch {
      // Ignore fallback to default
    }
  }

  async function loadCatalogs() {
    setLoadingCatalogs(true)
    try {
      const res = await fetch("/api/v1/greeting-card/catalogs")
      const json = await res.json() as { data: Array<{ id: string; name: string; code: string; _count?: { items: number } }> }
      if (Array.isArray(json.data)) {
        const list = json.data.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          itemCount: c._count?.items ?? 0,
          filters: (c as { filters?: Record<string, unknown> | null }).filters ?? null,
        }))
        setCatalogs(list)
        if (list.length > 0 && !selectedCatalogId) {
          const first = list[0]
          if (first) {
            setSelectedCatalogId(first.id)
            setCatalogItemCount(first.itemCount)
            if (first.filters && typeof first.filters === "object") {
              setSelectedTemplateId(
                resolveGreetingTemplateId((first.filters as Record<string, unknown>).templateId as string | undefined)
              )
            }
          }
        }
      }
    } finally {
      setLoadingCatalogs(false)
    }
  }

  useEffect(() => {
    void loadCatalogs()
    void loadOrgSlug()
  }, [])

  async function handleCreateCatalogSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatalogName.trim()) return
    setSavingCatalog(true)
    try {
      const code = newCatalogCode.trim() || `cat-${Date.now().toString(36)}`
      const res = await fetch("/api/v1/greeting-card/catalogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatalogName.trim(),
          code,
          type: "STANDARD",
          filters: { templateId: selectedTemplateId },
        }),
      })
      const json = await res.json() as { data?: { id: string } }
      if (json.data?.id) {
        await loadCatalogs()
        setSelectedCatalogId(json.data.id)
        setCatalogItemCount(0) // catalog mới tạo luôn trống
        setIsCreatingCatalog(false)
        setNewCatalogName("")
        setNewCatalogCode("")
      }
    } finally {
      setSavingCatalog(false)
    }
  }

  async function handleCreateLinkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCatalogId) return
    setCreatingLink(true)
    try {
      const res = await fetch("/api/v1/greeting-card/send-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogId: selectedCatalogId,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
        }),
      })
      const json = await res.json() as { data?: { sendCode: string; shareUrl: string } }
      if (json.data) {
        setCreatedSendCode(json.data.sendCode)
        setCreatedShareUrl(json.data.shareUrl)
        setStep(3)
      }
    } finally {
      setCreatingLink(false)
    }
  }

  function handleCopy() {
    const full = `${window.location.origin}${createdShareUrl}`
    void navigator.clipboard.writeText(full)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const selectedCatalog = catalogs.find((c) => c.id === selectedCatalogId)

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Stepper Header */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2 text-caption font-bold uppercase text-primary tracking-wider">
            <Sparkles size={14} />
            <span>Quy Trình Gửi Thẻ Chào 3 Bước</span>
          </div>
          {onGoToManager && (
            <button
              type="button"
              onClick={onGoToManager}
              className="text-body-sm text-text-muted hover:text-foreground font-medium underline"
            >
              Vào Bảng Quản Lý
            </button>
          )}
        </div>

        {/* 3 Steps indicator */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
              step === 1
                ? "bg-selected text-primary border-primary font-bold shadow-xs"
                : step > 1
                ? "bg-surface text-foreground border-border font-medium"
                : "bg-surface-muted text-text-muted border-transparent"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-caption shrink-0 font-bold ${
                step > 1 ? "bg-success text-white" : step === 1 ? "bg-primary text-white" : "bg-border text-text-muted"
              }`}
            >
              {step > 1 ? <Check size={12} /> : "1"}
            </div>
            <div className="truncate">
              <div className="text-caption hidden sm:block text-text-muted">BƯỚC 1</div>
              <div className="text-body-sm truncate">Bộ Sưu Tập</div>
            </div>
          </div>

          <div
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
              step === 2
                ? "bg-selected text-primary border-primary font-bold shadow-xs"
                : step > 2
                ? "bg-surface text-foreground border-border font-medium"
                : "bg-surface-muted text-text-muted border-transparent"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-caption shrink-0 font-bold ${
                step > 2 ? "bg-success text-white" : step === 2 ? "bg-primary text-white" : "bg-border text-text-muted"
              }`}
            >
              {step > 2 ? <Check size={12} /> : "2"}
            </div>
            <div className="truncate">
              <div className="text-caption hidden sm:block text-text-muted">BƯỚC 2</div>
              <div className="text-body-sm truncate">Thông Tin Khách</div>
            </div>
          </div>

          <div
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
              step === 3
                ? "bg-selected text-primary border-primary font-bold shadow-xs"
                : "bg-surface-muted text-text-muted border-transparent"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-caption shrink-0 font-bold ${
                step === 3 ? "bg-primary text-white" : "bg-border text-text-muted"
              }`}
            >
              3
            </div>
            <div className="truncate">
              <div className="text-caption hidden sm:block text-text-muted">BƯỚC 3</div>
              <div className="text-body-sm truncate">Nhận Link Gửi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Step Body */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        {/* STEP 1: CHỌN HOẶC TẠO CATALOG */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-title font-extrabold text-foreground">
                Bước 1: Chọn Bộ Sưu Tập Mẫu Hoa để gửi khách
              </h3>
              <p className="text-body-sm text-text-muted mt-1">
                Khách hàng sẽ lướt xem các mẫu hoa nằm trong bộ sưu tập mà bạn chọn tại đây.
              </p>
            </div>

            {loadingCatalogs ? (
              <div className="py-12 flex items-center justify-center text-text-muted">
                <Loader2 size={20} className="animate-spin mr-2" />
                <span className="text-body-sm">Đang tải danh sách bộ sưu tập...</span>
              </div>
            ) : catalogs.length === 0 || isCreatingCatalog ? (
              /* Form tạo catalog mới */
              <form onSubmit={handleCreateCatalogSubmit} className="flex flex-col gap-4 p-5 rounded-2xl bg-surface-muted border border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-body font-extrabold text-foreground">Tạo Bộ Sưu Tập Hoa Mới</h4>
                  {catalogs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingCatalog(false)}
                      className="text-body-sm text-text-muted hover:text-foreground"
                    >
                      Quay lại chọn danh sách
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-caption font-bold text-foreground mb-1">
                    Tên Bộ Sưu Tập *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Mẫu Hoa Chúc Mừng 20/10, Hoa Tươi Sinh Nhật..."
                    value={newCatalogName}
                    onChange={(e) => setNewCatalogName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-body text-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="block text-caption font-bold text-foreground mb-1">
                    Mã định danh (không bắt buộc)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 20-10-basic (tự sinh nếu để trống)"
                    value={newCatalogCode}
                    onChange={(e) => setNewCatalogCode(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-body text-foreground"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {catalogs.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreatingCatalog(false)}
                      className="h-10"
                    >
                      Hủy
                    </Button>
                  )}
                  <button
                    type="submit"
                    disabled={savingCatalog || !newCatalogName.trim()}
                    className="inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-dark text-white font-bold h-10 px-5 text-body-sm shadow-sm transition-colors disabled:opacity-50"
                  >
                    {savingCatalog ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Plus size={16} className="mr-1.5" />}
                    <span>Lưu & Chọn Ngay</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Danh sách chọn catalog */
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                  {catalogs.map((cat) => {
                    const isSelected = selectedCatalogId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCatalogId(cat.id)
                          setCatalogItemCount(cat.itemCount)
                          if (cat.filters && typeof cat.filters === "object") {
                            setSelectedTemplateId(
                              resolveGreetingTemplateId(
                                (cat.filters as Record<string, unknown>).templateId as string | undefined
                              )
                            )
                          }
                        }}
                        className={`p-4 rounded-xl border text-left flex items-start justify-between gap-3 transition-all ${
                          isSelected
                            ? "bg-selected/60 border-primary shadow-xs ring-1 ring-primary"
                            : "bg-background border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-body font-bold text-foreground truncate">{cat.name}</p>
                          <p className="text-caption text-primary font-mono mt-0.5 truncate">
                            bst/{orgSlug}/{cat.code}
                          </p>
                          <p className="text-caption text-text-muted font-medium mt-1.5">
                            {cat.itemCount > 0 ? `${cat.itemCount} mẫu hoa đã gán` : "Chưa có mẫu hoa"}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={12} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Inline product picker for the selected catalog */}
                {selectedCatalogId && (
                  <div className="rounded-2xl border border-border bg-surface-muted p-4">
                    <p className="text-body-sm font-bold text-text mb-3">
                      Sản phẩm trong bộ sưu tập đã chọn
                    </p>
                    <CatalogProductPicker
                      catalogId={selectedCatalogId}
                      compact
                      onItemCountChange={setCatalogItemCount}
                    />
                  </div>
                )}

                {/* Template Selection for this catalog */}
                {selectedCatalogId && (
                  <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs">
                    <TemplateSelectorCard
                      selectedTemplateId={selectedTemplateId}
                      onSelectTemplate={handleSelectTemplate}
                    />
                  </div>
                )}

                {/* Public Link Card if catalog has products */}
                {selectedCatalogId && catalogItemCount > 0 && (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col gap-3.5 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-body font-extrabold text-foreground">
                              Link Dùng Chung Cho Mọi Khách Hàng
                            </p>
                            <span className="text-caption px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                              Public Link
                            </span>
                          </div>
                          <p className="text-body-sm text-text-muted mt-0.5">
                            Gửi link này lên Fanpage, Zalo, Bio hoặc chạy quảng cáo. Mọi khách bấm vào đều xem trọn vẹn {catalogItemCount} mẫu hoa và có thể tự chốt đơn, thanh toán VietQR.
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview()}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/30 bg-surface hover:bg-surface-muted text-primary text-body-sm font-bold shadow-xs transition-colors"
                          title="Xem trước giao diện khách nhìn thấy trên điện thoại & desktop"
                        >
                          <Eye size={16} />
                          <span>Xem trước (Preview)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyPublicLink()}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-body-sm font-bold hover:bg-primary-dark shadow-xs transition-colors"
                        >
                          {copiedPublicLink ? <Check size={16} className="text-white" /> : <Copy size={16} />}
                          <span>{copiedPublicLink ? "Đã sao chép!" : "Sao chép link"}</span>
                        </button>

                        <a
                          href={getPublicUrl()}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl border border-border bg-surface hover:bg-surface-muted text-text-muted hover:text-foreground transition-colors"
                          title="Mở trong tab mới"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>

                    {/* Display URL box with quick copy and duplicate option */}
                    <div className="p-3 bg-surface rounded-xl border border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 min-w-0 font-mono text-body-sm truncate">
                        <LinkIcon size={14} className="shrink-0 text-text-muted" />
                        <span className="text-text-muted text-caption hidden md:inline">Link xem:</span>
                        <span className="text-primary font-bold truncate select-all">{getDisplayPath()}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setCloneName(`${selectedCatalog?.name ?? "Bộ Sưu Tập"} - Kênh 2`)
                            setCloneCode(`${selectedCatalog?.code || "bst"}-kenh2`)
                            setIsCloning(true)
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-caption font-bold transition-colors"
                          title="Tạo thêm 1 link dùng chung khác (VD: SiinStore/20-10 vs LoviiNet/20-10) cùng chứa các mẫu hoa này"
                        >
                          <CopyPlus size={14} />
                          <span>+ Tạo thêm link khác cho BST này</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Clone Link (Tạo thêm link dùng chung cho cùng BST) */}
                {isCloning && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <form
                      onSubmit={handleCloneCatalog}
                      className="bg-surface rounded-2xl border border-border p-6 shadow-2xl max-w-md w-full flex flex-col gap-4 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-title-sm font-extrabold text-foreground flex items-center gap-2">
                          <CopyPlus size={18} className="text-primary" />
                          <span>Tạo thêm link dùng chung mới</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsCloning(false)}
                          className="text-text-muted hover:text-foreground text-caption"
                        >
                          Đóng
                        </button>
                      </div>

                      <p className="text-body-sm text-text-muted">
                        Tất cả <strong>{catalogItemCount} mẫu hoa</strong> trong bộ sưu tập hiện tại sẽ được tự động nhân bản sang link mới. Bạn có thể đặt mã slug link riêng (ví dụ: <code className="text-primary font-bold">20-10-fanpage</code>, <code className="text-primary font-bold">20-10-zalo</code>, <code className="text-primary font-bold">lovii-20-10</code>...).
                      </p>

                      <div>
                        <label className="block text-caption font-bold text-foreground mb-1">
                          Tên Bộ Sưu Tập / Kênh *
                        </label>
                        <input
                          type="text"
                          value={cloneName}
                          onChange={(e) => setCloneName(e.target.value)}
                          placeholder="VD: 20/10 - Kênh LoviiNet"
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background text-body text-foreground"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-caption font-bold text-foreground mb-1">
                          Đoạn mã link (Slug URL) *
                        </label>
                        <div className="flex items-center rounded-xl border border-border bg-background px-3 h-10">
                          <span className="text-caption text-text-muted font-mono mr-1">/bst/{orgSlug}/</span>
                          <input
                            type="text"
                            value={cloneCode}
                            onChange={(e) => setCloneCode(e.target.value)}
                            placeholder="20-10-kenh2"
                            className="flex-1 bg-transparent text-body font-mono text-foreground focus:outline-none"
                            required
                          />
                        </div>
                        <p className="text-caption text-text-muted mt-1">
                          Link sẽ có dạng: <strong className="text-foreground">/bst/{orgSlug}/{cloneCode.toLowerCase().trim() || "..."}</strong>
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCloning(false)}
                          className="h-10"
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          disabled={cloningLoading || !cloneCode.trim()}
                          className="bg-primary hover:bg-primary-dark text-white font-bold h-10 px-4"
                        >
                          {cloningLoading ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Plus size={16} className="mr-1.5" />}
                          <span>Tạo Link Ngay</span>
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCatalog(true)}
                    className="text-body-sm font-bold text-primary hover:underline inline-flex items-center gap-1.5 self-start"
                  >
                    <Plus size={15} />
                    <span>Tạo thêm bộ sưu tập mới</span>
                  </button>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={!selectedCatalogId || catalogItemCount === 0}
                      onClick={() => handleOpenPreview()}
                      title={catalogItemCount === 0 ? "Vui lòng thêm ít nhất 1 mẫu hoa để xem trước" : "Xem trước giao diện khách hàng sẽ thấy"}
                      className="inline-flex items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-muted text-foreground font-bold h-10 px-4 gap-1.5 shadow-xs text-body-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Eye size={15} />
                      <span>Xem Trước</span>
                    </button>

                    <button
                      type="button"
                      disabled={!selectedCatalogId || catalogItemCount === 0}
                      onClick={() => handleCopyPublicLink()}
                      title={catalogItemCount === 0 ? "Vui lòng thêm ít nhất 1 mẫu hoa" : "Sao chép link dùng chung không cần tạo CRM"}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-muted text-foreground font-bold h-10 px-4 gap-1.5 shadow-xs text-body-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copiedPublicLink ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                      <span>{copiedPublicLink ? "Đã chép link chung!" : "Chép Link Dùng Chung"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={!selectedCatalogId || catalogItemCount === 0}
                      onClick={() => setStep(2)}
                      title={catalogItemCount === 0 ? "Vui lòng thêm ít nhất 1 mẫu hoa trước khi gửi link" : undefined}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-dark text-white font-bold h-10 px-5 gap-1.5 shadow-sm text-body-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Gửi Riêng Từng Khách (CRM)</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: NHẬP THÔNG TIN KHÁCH HÀNG (CÁ NHÂN HÓA CRM) */}
        {step === 2 && (
          <form onSubmit={handleCreateLinkSubmit} className="flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-title font-extrabold text-foreground">
                  Bước 2: Gán thông tin khách hàng nhận link (CRM)
                </h3>
                <span className="text-caption px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  Cá nhân hóa
                </span>
              </div>
              <p className="text-body-sm text-text-muted mt-1">
                Bộ sưu tập đang chọn: <strong className="text-foreground">{selectedCatalog?.name}</strong>. Khi gán tên, màn hình thiệp sẽ có lời chào thân mật (VD: <em>Dành riêng cho Chị Lan</em>) và hệ thống tự theo dõi xem khách đã mở thiệp hay chốt đơn chưa.
              </p>
              <div className="mt-2 text-caption text-text-muted bg-surface-muted p-2.5 rounded-lg border border-border">
                💡 <strong>Mẹo:</strong> Nếu bạn muốn gửi 1 link chung cho tất cả mọi người (không cần tên riêng), hãy nhấn <strong>&quot;Quay lại Bước 1&quot;</strong> và chọn <strong>&quot;Chép Link Dùng Chung&quot;</strong>.
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-surface-muted p-5 rounded-2xl border border-border">
              <div>
                <label className="block text-caption font-bold text-foreground mb-1.5">
                  Tên Khách Hàng (được hiển thị chào trên Thẻ)
                </label>
                <input
                  type="text"
                  placeholder="VD: Anh Minh, Chị Lan, Công ty ABC..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-body text-foreground"
                />
              </div>

              <div>
                <label className="block text-caption font-bold text-foreground mb-1.5">
                  Số Điện Thoại Khách (không bắt buộc)
                </label>
                <input
                  type="tel"
                  placeholder="VD: 0901234567 (dùng để liên hệ giao hoa khi chốt đơn)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-body text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-10 gap-1.5 text-body-sm font-medium"
              >
                <ArrowLeft size={15} />
                <span>Quay lại Bước 1</span>
              </Button>

              <button
                type="submit"
                disabled={creatingLink}
                className="inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-dark text-white font-bold h-10 px-6 text-body-sm shadow-sm transition-colors disabled:opacity-50 gap-1.5"
              >
                {creatingLink ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span>{creatingLink ? "Đang sinh link..." : "Sinh Link Chào Hàng Ngay"}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: KẾT QUẢ LINK GỬI */}
        {step === 3 && (
          <div className="flex flex-col gap-6 text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-success-bg text-success mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-title font-extrabold text-foreground">
                Đã Sinh Link Thẻ Chào Thành Công!
              </h3>
              <p className="text-body-sm text-text-muted mt-1 max-w-md mx-auto">
                Mã gửi: <strong className="font-mono text-primary">{createdSendCode}</strong> cho khách hàng{" "}
                <strong className="text-foreground">{customerName || "Khách"}</strong>
              </p>
            </div>

            {/* Link Box */}
            <div className="p-4 bg-surface-muted rounded-2xl border border-border max-w-lg mx-auto w-full flex flex-col gap-3">
              <div className="p-3 bg-background rounded-xl border border-border text-body-sm font-mono text-foreground break-all select-all">
                {typeof window !== "undefined" ? `${window.location.origin}${createdShareUrl}` : createdShareUrl}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-dark text-white font-bold h-11 text-body-sm gap-1.5 shadow-sm transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? "Đã copy link!" : "1-Click Copy Link gửi Zalo/Tin nhắn"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fullUrl = typeof window !== "undefined"
                      ? `${window.location.origin}${createdShareUrl}`
                      : createdShareUrl
                    setPreviewUrl(fullUrl)
                    setPreviewTitle(`Xem trước link gửi khách: ${customerName || "Khách"}`)
                  }}
                  className="h-11 px-4 rounded-xl border border-border hover:bg-surface text-text-muted hover:text-foreground flex items-center justify-center gap-1.5 text-body-sm font-medium transition-colors"
                >
                  <Eye size={15} />
                  <span>Xem Trước</span>
                </button>
                <a
                  href={typeof window !== "undefined" ? `${window.location.origin}${createdShareUrl}` : createdShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 px-3 rounded-xl border border-border hover:bg-surface text-text-muted hover:text-foreground flex items-center justify-center transition-colors"
                  title="Mở trong tab mới"
                >
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>

            {/* Next actions */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(1)
                  setCustomerName("")
                  setCustomerPhone("")
                  setCreatedSendCode("")
                  setCreatedShareUrl("")
                }}
                className="h-10 text-body-sm font-medium"
              >
                Tạo thêm link khác
              </Button>
              {onFinish && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onFinish}
                  className="h-10 text-body-sm font-bold"
                >
                  Xong & Xem Danh Sách Đã Gửi
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Modal */}
      {previewUrl && (
        <BrochurePreviewModal
          url={previewUrl}
          title={previewTitle}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </div>
  )
}
