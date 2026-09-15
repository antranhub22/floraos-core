"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Flower2,
  Send,
  MessageCircle,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FlowSteps, type FlowStep } from "@/components/flow/flow-steps"
import {
  ContentGuidanceCard,
  AngleSelectorCard,
  MultichannelPostCard,
  ModelSelectorCard,
  type AIContentProvider,
  type ContentAngle,
  type MultichannelPostItem,
} from "@/components/templates/content-engine"

interface ProductOption {
  id: string
  name: string
  code?: string
  price?: number
  flowers?: string
  color?: string
  imageUrl?: string
}

const CHANNELS_CONFIG = [
  {
    id: "facebook",
    label: "Facebook Fanpage",
    icon: "📘",
    tag: "Album & Bài viết",
    description: "Kể chuyện cảm xúc, thông điệp ý nghĩa & album ảnh mẫu hoa",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: "📸",
    tag: "Visual & Hashtag",
    description: "Caption thẩm mỹ ngắn gọn, tinh tế theo phong cách hình ảnh",
  },
  {
    id: "tiktok",
    label: "TikTok Video",
    icon: "🎵",
    tag: "Kịch bản quay 30s",
    description: "Hook mở đầu 3s giữ chân, visual cues & âm thanh xu hướng",
  },
  {
    id: "zalo",
    label: "Zalo OA",
    icon: "💬",
    tag: "Tư vấn & Báo giá",
    description: "Tin nhắn chào mẫu mới, báo giá ưu đãi & tư vấn 1-chạm",
  },
  {
    id: "linkedin",
    label: "LinkedIn B2B",
    icon: "💼",
    tag: "Doanh nghiệp & Đối tác",
    description: "Thought Leadership, văn hóa doanh nghiệp & quà tặng đối tác",
  },
]

const FLOW_STEPS: FlowStep[] = [
  { key: "analyze", label: "Đọc thông số hoa & Brand Kit" },
  { key: "generate", label: "SocialFlow M07 sinh bài đa kênh" },
  { key: "review", label: "Kiểm duyệt an toàn thương hiệu" },
]

export default function ContentEnginePage() {
  const router = useRouter()

  // Trạng thái dữ liệu
  const [products, setProducts] = useState<ProductOption[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedAngle, setSelectedAngle] = useState<ContentAngle>("emotional")
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "facebook",
    "instagram",
    "tiktok",
    "zalo",
    "linkedin",
  ])
  const [selectedProvider, setSelectedProvider] = useState<AIContentProvider>("ollama")

  // Trạng thái luồng
  const [phase, setPhase] = useState<"select" | "generating" | "results">("select")
  const [currentStep, setCurrentStep] = useState<string>("analyze")
  const [generatedPosts, setGeneratedPosts] = useState<MultichannelPostItem[]>([])
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [modelInfo, setModelInfo] = useState<{
    provider?: string | undefined
    modelName?: string | undefined
    isFallback?: boolean | undefined
  }>({
    provider: "ollama",
    modelName: "qwen2.5:7b",
    isFallback: false,
  })
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Tải danh mục sản phẩm từ Product Master
  useEffect(() => {
    async function loadProducts() {
      setIsLoadingProducts(true)
      setLoadError(null)
      try {
        const [resProds, resAnalyses] = await Promise.all([
          fetch("/api/v1/products?limit=25"),
          fetch("/api/v1/vision/analyses?approval_state=APPROVED&limit=100").catch(() => null),
        ])

        const imageMap: Record<string, string> = {}
        if (resAnalyses && resAnalyses.ok) {
          try {
            const analysesJson = await resAnalyses.json()
            const analysesList = analysesJson.data || []
            for (const a of analysesList) {
              if (a.image_url) {
                if (a.product_id) imageMap[a.product_id] = a.image_url
                if (a.product?.id) imageMap[a.product.id] = a.image_url
                if (a.product?.code) imageMap[a.product.code] = a.image_url
              }
            }
          } catch {
            // Bỏ qua nếu lỗi đọc analyses
          }
        }

        if (resProds.ok) {
          const json = await resProds.json()
          const rawList = json.data || json.items || []
          if (rawList.length > 0) {
            const mapped = rawList.map((p: any) => ({
              id: p.id,
              name: p.name,
              code: p.code,
              price: p.pricing?.selling_price || 0,
              flowers: p.category ? `Danh mục: ${p.category}` : (p.shape || "Hoa tươi thiết kế"),
              color: p.shape || "Tiêu chuẩn",
              imageUrl:
                imageMap[p.id] ||
                (p.code ? imageMap[p.code] : undefined) ||
                p.master_image_url ||
                p.image_url ||
                p.images?.[0]?.url,
            }))
            setProducts(mapped)
            setSelectedProductId(mapped[0]?.id || "")
          } else {
            setProducts([])
          }
        } else {
          setLoadError("Không thể tải sản phẩm từ Product Master.")
        }
      } catch {
        setLoadError("Lỗi kết nối cơ sở dữ liệu sản phẩm.")
      } finally {
        setIsLoadingProducts(false)
      }
    }
    loadProducts()
  }, [])

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0]

  // Xử lý bật/tắt chọn kênh
  const toggleChannel = (chId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(chId)
        ? prev.filter((c) => c !== chId)
        : [...prev, chId]
    )
  }

  // Kích hoạt sinh nội dung qua SocialFlow Proxy
  async function handleGenerate() {
    if (selectedChannels.length === 0 || !selectedProduct) return

    setPhase("generating")
    setCurrentStep("analyze")

    setTimeout(() => setCurrentStep("generate"), 600)

    try {
      const payload = {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        flower_details: selectedProduct.flowers,
        colors: selectedProduct.color,
        price: selectedProduct.price,
        image_url: selectedProduct.imageUrl,
        channels: selectedChannels,
        angle: selectedAngle,
        provider: selectedProvider,
      }

      // Gọi Server-side Proxy tới SocialFlow M07
      const res = await fetch("/api/v1/proxy/api/m07/generate?client=SOCIALFLOW", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      setTimeout(() => setCurrentStep("review"), 1400)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const errorMsg = errJson.detail || errJson.message || `Lỗi máy chủ (${res.status}) khi gọi SocialFlow M07`
        throw new Error(errorMsg)
      }

      const data = await res.json()
      setActivePostId(data.result_id || null)

      const posts: MultichannelPostItem[] = []
      for (const ch of selectedChannels) {
        const chData = data.channels?.[ch]
        if (chData) {
          posts.push({
            postId: chData.post_id || data.result_id,
            channel: ch as any,
            channelLabel:
              CHANNELS_CONFIG.find((c) => c.id === ch)?.label || ch.toUpperCase(),
            headline: chData.title || `Bó hoa ${selectedProduct.name}`,
            bodyText: chData.body || "",
            hashtags: chData.hashtags || [],
            cta: chData.cta,
            script: chData.script,
          })
        }
      }

      if (posts.length === 0) {
        throw new Error("Không nhận được nội dung hợp lệ từ AI Engine cho các kênh đã chọn.")
      }

      setModelInfo({
        provider: data.provider || "ollama",
        modelName: data.model_name || "qwen2.5:7b",
        isFallback: false,
      })
      setGeneratedPosts(posts)
      setTimeout(() => setPhase("results"), 1800)
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Lỗi sinh nội dung: ${err.message || "Không thể kết nối SocialFlow backend (cổng 8000)"}. Vui lòng kiểm tra lại dịch vụ qua npm run dev:all.`,
      })
      setPhase("select")
    }
  }

  // Cập nhật từng trường của bài viết
  const handleUpdatePost = (channel: string, updated: Partial<MultichannelPostItem>) => {
    setGeneratedPosts((prev) =>
      prev.map((p) => (p.channel === channel ? { ...p, ...updated } : p))
    )
  }

  // Duyệt bài viết và gửi sang Lịch đăng
  async function handleApprovePost(post: MultichannelPostItem) {
    try {
      const targetId = post.postId || activePostId || "new"
      await fetch(`/api/v1/proxy/api/m07/posts/${targetId}/approve?client=SOCIALFLOW`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: targetId,
          channel: post.channel,
          title: post.headline,
          body: post.bodyText,
          hashtags: post.hashtags,
          cta: post.cta,
        }),
      })
    } catch {
      // Bỏ qua lỗi proxy nếu offline
    }

    setNotification({
      type: "success",
      message: `Đã duyệt bài viết ${post.channelLabel} và đưa vào hàng đợi xuất bản!`,
    })

    setTimeout(() => {
      router.push("/lich-dang" as never)
    }, 1200)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Top Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-3.5">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-text-muted uppercase">M07 · SOCIALFLOW</div>
          <div className="text-[17px] font-black text-primary flex items-center gap-2">
            <Sparkles size={18} />
            AI Content Engine — Cỗ Máy Nội Dung Đa Kênh
          </div>
        </div>

        {/* Standardized Tab Action Header */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/lich-dang" as never)}
            className="text-xs gap-1.5"
          >
            <Calendar size={14} />
            Lịch đăng bài
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-xs gap-1.5"
          >
            <ArrowLeft size={14} />
            Trang chủ
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto p-6 max-w-5xl mx-auto w-full gap-5">
        {/* Thông báo toast nếu có */}
        {notification && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <CheckCircle2 size={16} />
            {notification.message}
          </div>
        )}

        {/* Khối Hướng dẫn Thao tác SSOT (Chuẩn khung đỏ nét đứt) */}
        <ContentGuidanceCard />

        {/* ================= PHASE 1: CHỌN SẢN PHẨM & CẤU HÌNH GÓC TIẾP CẬN ================= */}
        {phase === "select" && (
          <div className="flex flex-col gap-5">
            {/* 1. Chọn Sản phẩm từ Product Master */}
            <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-text-muted">Bước 1: Chọn sản phẩm hoa</div>
                  <div className="text-[15px] font-extrabold text-text">Dữ liệu từ Product Master</div>
                </div>
                <Badge tone="accent" className="text-xs">
                  {products.length} sản phẩm sẵn sàng
                </Badge>
              </div>

              {isLoadingProducts ? (
                <div className="py-8 text-center text-xs text-text-muted animate-pulse">
                  Đang tải danh sách sản phẩm từ cơ sở dữ liệu thật...
                </div>
              ) : loadError ? (
                <div className="py-6 text-center text-xs text-rose-600 bg-rose-50/50 rounded-lg border border-rose-200/60 p-3">
                  {loadError}
                </div>
              ) : products.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted bg-surface/50 rounded-lg p-4">
                  Chưa có sản phẩm nào trong Product Master.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 max-h-[280px] overflow-y-auto pr-1">
                  {products.map((prod) => {
                    const isSelected = prod.id === selectedProductId
                    return (
                      <div
                        key={prod.id}
                        onClick={() => setSelectedProductId(prod.id)}
                        className={`cursor-pointer rounded-xl border p-3 transition flex items-center gap-3 ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                            : "border-border hover:border-text-muted bg-background"
                        }`}
                      >
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center text-xl flex-shrink-0">
                            🌸
                          </div>
                        )}
                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-text-muted truncate">{prod.code || "SKU"}</span>
                            <span className="text-[11px] font-bold text-primary">
                              {prod.price ? `${prod.price.toLocaleString("vi-VN")}đ` : "Giá liên hệ"}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-text line-clamp-1">{prod.name}</div>
                          <div className="text-[10.5px] text-text-muted line-clamp-1">
                            {prod.flowers || "Hoa tươi nghệ thuật"}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* 2. Chọn Góc tiếp cận (Angle) */}
            <AngleSelectorCard
              selectedAngle={selectedAngle}
              onSelectAngle={setSelectedAngle}
            />

            {/* 3. Chọn Kênh Phân Phối Đăng Bài */}
            <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-text-muted">
                    Bước 3: Chọn kênh phân phối bài đăng
                  </div>
                  <div className="text-[16px] font-extrabold text-text">
                    Lựa chọn nền tảng viết bài & xuất bản
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-muted">
                    Đã chọn:{" "}
                    <strong className="text-primary font-bold">
                      {selectedChannels.length}/{CHANNELS_CONFIG.length} kênh
                    </strong>
                  </span>
                  <div className="h-4 w-px bg-border hidden sm:block" />
                  <button
                    type="button"
                    onClick={() => setSelectedChannels(CHANNELS_CONFIG.map((c) => c.id))}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-xs text-text-muted">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedChannels([])}
                    className="text-xs text-text-muted hover:text-text font-semibold"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
              </div>

              {/* Grid 4 Kênh phân phối */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CHANNELS_CONFIG.map((ch) => {
                  const isChecked = selectedChannels.includes(ch.id)
                  return (
                    <div
                      key={ch.id}
                      onClick={() => toggleChannel(ch.id)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between gap-2 relative select-none ${
                        isChecked
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                          : "border-border hover:border-text-muted bg-background opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{ch.icon}</span>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? "bg-primary border-primary text-white"
                              : "border-border bg-surface"
                          }`}
                        >
                          {isChecked && <Check size={13} strokeWidth={3} />}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-text flex items-center gap-1.5">
                          {ch.label}
                        </div>
                        <div className="text-[11px] text-text-muted line-clamp-2 mt-0.5 leading-snug">
                          {ch.description}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                          {ch.tag}
                        </span>
                        <span
                          className={`text-[11px] font-bold ${
                            isChecked ? "text-primary" : "text-text-muted"
                          }`}
                        >
                          {isChecked ? "Sẽ tạo & đăng" : "Bỏ qua"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* 4. Chọn Cỗ máy AI (Model Engine) & Sinh bài viết */}
            <ModelSelectorCard
              selectedProvider={selectedProvider}
              onSelectProvider={setSelectedProvider}
              selectedChannelsCount={selectedChannels.length}
              onGenerate={handleGenerate}
            />
          </div>
        )}

        {/* ================= PHASE 2: TIẾN TRÌNH XỬ LÝ (GENERATING) ================= */}
        {phase === "generating" && (
          <div className="flex flex-col items-center justify-center py-12 gap-6">
            <div className="text-center">
              <div className="text-sm font-semibold text-primary animate-pulse">SocialFlow Engine đang xử lý...</div>
              <div className="text-[18px] font-black text-text mt-1">Đang soạn thảo nội dung tiếp thị ngành hoa</div>
              <div className="text-xs text-text-muted mt-1">
                Tự động tối ưu theo từng nền tảng & kiểm duyệt từ ngữ cấm
              </div>
            </div>

            <div className="w-full max-w-md">
              <FlowSteps
                steps={FLOW_STEPS}
                currentStep={currentStep}
                cancellable={false}
              />
            </div>
          </div>
        )}

        {/* ================= PHASE 3: HIỂN THỊ & BIÊN TẬP TRỰC TIẾP ================= */}
        {phase === "results" && generatedPosts.length > 0 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-text-muted">Kết quả từ SocialFlow M07</span>
                <h2 className="text-lg font-black text-text">Xem trước & Biên tập nội dung</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPhase("select")}
                className="text-xs gap-1.5"
              >
                <RefreshCw size={13} />
                Soạn lại mẫu khác
              </Button>
            </div>

            {/* Thẻ hiển thị đa kênh kèm Live Preview & Atomic Fields */}
            <MultichannelPostCard
              posts={generatedPosts}
              productName={selectedProduct?.name || "Sản phẩm hoa tươi"}
              productImageUrl={selectedProduct?.imageUrl}
              modelInfo={modelInfo}
              onUpdatePost={handleUpdatePost}
              onSchedulePost={handleApprovePost}
            />

            {/* Gợi ý chuyển tiếp */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span>🚀</span> Bước tiếp theo: Xuất bản đa nền tảng
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  Sau khi duyệt, bài viết sẽ tự động chuyển vào hàng đợi Social Publishing để lên lịch phát sóng tự động.
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push("/lich-dang" as never)}
                className="text-xs gap-1.5 font-bold whitespace-nowrap"
              >
                Đến Lịch đăng bài
                <Send size={13} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
