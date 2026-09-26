"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles, Tag, Layers, Box, CheckCircle2, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { FlowerPlaceholder } from "@/components/ui/flower-placeholder"

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
  created_at?: string
  updated_at?: string
}

function ProductStatusBadge({ status }: { status: ProductDetail["status"] }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-0.5 text-caption font-bold text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
        Đang bán
      </span>
    )
  }
  if (status === "ARCHIVED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-2.5 py-0.5 text-caption font-bold text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
        Lưu trữ
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-0.5 text-caption font-bold text-text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-text-muted" aria-hidden="true" />
      Nháp
    </span>
  )
}

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const productId = params.id

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    let huy = false
    async function napLai() {
      try {
        const res = await fetch(`/api/v1/products/${productId}`)
        if (res.status === 401) {
          router.push("/dang-nhap" as never)
          return
        }
        if (!res.ok) throw new Error(`Không tải được thông tin sản phẩm (${res.status})`)
        const data = (await res.json()) as { product?: ProductDetail } | ProductDetail
        const p = "product" in data && data.product ? data.product : (data as ProductDetail)
        if (!huy) setProduct(p)
      } catch (e) {
        if (!huy) setLoi(e instanceof Error ? e.message : "Không tải được sản phẩm")
      }
    }
    napLai()
    return () => {
      huy = true
    }
  }, [productId, router])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/san-pham"
            aria-label="Về danh sách sản phẩm"
            className="flex h-11 w-11 items-center justify-center rounded-full text-text hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="text-caption text-text-muted">Chi tiết sản phẩm</div>
            <h1 className="text-title font-extrabold text-primary">
              {product ? product.name : "Đang tải…"}
            </h1>
          </div>
        </div>
        {product && (
          <Button
            size="sm"
            onClick={() => router.push(`/san-pham/${productId}/tinh-nang` as never)}
            className="flex items-center gap-1.5"
          >
            <Sparkles size={15} />
            Mở Studio Tính Năng
          </Button>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        {loi && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-body-sm font-medium text-red-700">
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
            <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-surface-alt text-secondary">
                  <FlowerPlaceholder size={32} />
                </div>
                <div>
                  <h2 className="text-title-sm font-bold text-text">{product.name}</h2>
                  <div className="mt-0.5 text-body-sm text-text-muted">Mã định danh: {product.code}</div>
                </div>
              </div>
              <ProductStatusBadge status={product.status} />
            </Card>

            {/* Nhóm 2: Định dạng thiết kế hoa */}
            <Card className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-caption font-bold uppercase tracking-wider text-text-muted">
                <Layers size={14} aria-hidden="true" />
                Định dạng thiết kế
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="rounded-xl bg-surface-alt p-3">
                  <div className="text-caption text-text-muted">Hình dáng thiết kế</div>
                  <div className="text-body-sm font-semibold text-text mt-0.5">{product.shape ?? "—"}</div>
                </div>
                <div className="rounded-xl bg-surface-alt p-3">
                  <div className="text-caption text-text-muted">Mặt hoa / Hướng nhìn</div>
                  <div className="text-body-sm font-semibold text-text mt-0.5">{product.facing ?? "—"}</div>
                </div>
                <div className="rounded-xl bg-surface-alt p-3">
                  <div className="text-caption text-text-muted">Vật chứa / Giá đỡ</div>
                  <div className="text-body-sm font-semibold text-text mt-0.5">{product.container ?? "—"}</div>
                </div>
              </div>
            </Card>

            {/* Nhóm 3: Danh mục & Phân khúc */}
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

            {/* Nhóm 4: Lối tắt tác vụ AI */}
            <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-primary/5 border-primary/20">
              <div>
                <div className="text-body-sm font-bold text-primary">Bộ máy tính năng AI sản phẩm</div>
                <div className="text-caption text-text-muted mt-0.5">
                  Phân tích cấu phần, sinh ảnh bối cảnh marketing, tạo dữ liệu bán hàng đa kênh.
                </div>
              </div>
              <Button
                onClick={() => router.push(`/san-pham/${productId}/tinh-nang` as never)}
                className="flex items-center gap-1.5 flex-shrink-0"
              >
                <Sparkles size={15} />
                Mở Tính Năng AI
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
