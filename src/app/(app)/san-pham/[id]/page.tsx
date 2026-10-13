"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Sparkles, Tag } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { driveThumbProxySrc } from "@/components/greeting-card/drive-thumb-image"
import { AiProductEnrichmentModal } from "@/components/products/ai-product-enrichment-modal"
import { ProductReminderOverrideCard } from "@/components/coordinator/product-reminder-override-card"
import { useSession } from "@/lib/session"
import {
  ProductOverviewCard,
  ProductDesignCard,
  ProductBomCard,
  ProductStoryCard,
} from "@/components/products/product-detail-cards"

type ProductDetail = {
  id: string
  name: string
  code: string
  category: string | null
  shape: string | null
  facing: string | null
  container: string | null
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  attributes: Record<string, unknown> | null
  masterImageUrl?: string
  price_vnd?: number | null
  driveLink?: string
  created_at?: string
  updated_at?: string
}

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const productId = params.id
  const { can } = useSession()
  const canEdit = can("F2") || can("H4")

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const napLai = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/products/${productId}`)
      if (res.status === 401) {
        router.push("/dang-nhap" as never)
        return
      }
      if (!res.ok) throw new Error(`Không tải được thông tin sản phẩm (${res.status})`)
      const data = (await res.json()) as { product?: ProductDetail } | ProductDetail
      const p = "product" in data && data.product ? data.product : (data as ProductDetail)
      setProduct(p)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không tải được sản phẩm")
    }
  }, [productId, router])

  useEffect(() => {
    napLai()
  }, [napLai])

  const attrs = (product?.attributes as Record<string, unknown> | null) ?? {}
  const rawBom = (attrs.bom as Record<string, unknown> | undefined) ?? {}
  const rawFlowers = Array.isArray(rawBom.flowers) ? rawBom.flowers : []
  const primaryColor = (attrs.color as string) || null
  const description = (attrs.description as string) || null
  const priceVnd =
    typeof attrs.price === "number" && attrs.price > 0
      ? attrs.price
      : typeof product?.price_vnd === "number" && product.price_vnd > 0
      ? product.price_vnd
      : null

  const driveLink = product?.driveLink || (typeof attrs.drive_link === "string" ? attrs.drive_link : null)
  const displayImageUrl =
    product?.masterImageUrl ||
    (typeof attrs.imageUrl === "string" ? attrs.imageUrl : null) ||
    (driveLink ? driveThumbProxySrc(driveLink) : null)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/san-pham" as never)}
            aria-label="Về danh sách sản phẩm"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="text-caption text-text-muted">Chi tiết sản phẩm</div>
            <h1 className="text-title font-extrabold text-primary">
              {product ? product.name : ""}
            </h1>
          </div>
        </div>

        {product && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/san-pham/${productId}/tinh-nang` as never)}
              className="flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-primary" />
              <span className="hidden sm:inline">Mở Studio Tính Năng</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 font-bold"
            >
              <Sparkles size={14} />
              <span>Phân tích AI & Chỉnh sửa</span>
            </Button>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {loi && (
          <div className="rounded-xl border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-body-sm font-medium text-danger">
            {loi}
          </div>
        )}

        {product === null ? (
          <div className="py-4">
            <SkeletonBlock lines={6} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Nhóm 1: Thẻ tổng quan */}
            <ProductOverviewCard
              name={product.name}
              code={product.code}
              status={product.status}
              priceVnd={priceVnd}
              primaryColor={primaryColor}
              displayImageUrl={displayImageUrl}
            />

            {/* Nhóm 2: Định dạng thiết kế hoa */}
            <ProductDesignCard
              shape={product.shape}
              facing={product.facing}
              container={product.container}
            />

            {/* Nhóm 3: Thành phần hoa (BOM) */}
            <ProductBomCard
              flowers={rawFlowers}
              onOpenModal={() => setIsModalOpen(true)}
            />

            {/* Nhóm 4: Câu chuyện và thông điệp mẫu hoa (Content Engine) */}
            <ProductStoryCard
              description={description}
              onOpenModal={() => setIsModalOpen(true)}
            />

            {/* Nhóm 5: Phân loại & Danh mục */}
            <Card className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-caption font-bold uppercase tracking-wider text-text-muted">
                <Tag size={14} aria-hidden="true" />
                Phân loại & Danh mục
              </div>
              <div className="flex items-center justify-between py-2 text-body-sm border-b border-border">
                <span className="text-text-muted">Danh mục sản phẩm</span>
                <span className="font-semibold text-text">{product.category ?? "Chưa phân loại"}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-body-sm">
                <span className="text-text-muted">Trạng thái kinh doanh</span>
                <span className="font-semibold text-text">{product.status}</span>
              </div>
            </Card>

            {/* Nhóm 6: Cấu hình mốc nhắc việc Điều phối riêng cho mẫu hoa này */}
            <ProductReminderOverrideCard
              productId={productId}
              canEdit={canEdit}
            />

            {/* Nhóm 6: Lối tắt tác vụ AI */}
            <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-primary/5 border-primary/20">
              <div>
                <div className="text-body-sm font-bold text-primary">Bộ máy tính năng AI sản phẩm</div>
                <div className="text-caption text-text-muted mt-0.5">
                  Phân tích cấu phần, sinh ảnh bối cảnh marketing, tạo dữ liệu bán hàng đa kênh.
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <Sparkles size={14} className="text-primary" />
                  <span>Phân tích AI</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/san-pham/${productId}/tinh-nang` as never)}
                  className="flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>Mở Studio Tính Năng</span>
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Modal làm giàu dữ liệu bằng AI */}
      {product && (
        <AiProductEnrichmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productId={productId}
          initialProduct={product}
          onSuccess={napLai}
        />
      )}
    </div>
  )
}
