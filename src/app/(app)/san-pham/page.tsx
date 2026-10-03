"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Search,
  ChevronRight,
  Sparkles,
  Eye,
  LayoutGrid,
  LayoutList,
  ImageOff,
  Camera,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"

type Product = {
  id: string
  name: string
  code: string
  category: string | null
  shape: string | null
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  masterImageUrl?: string | undefined
  price_vnd: number | null
}

type ViewMode = "grid" | "table"

function StatusBadge({ status }: { status: Product["status"] }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-caption font-bold text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
        Đang bán
      </span>
    )
  }
  if (status === "ARCHIVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-caption font-bold text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
        Lưu trữ
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2 py-0.5 text-caption font-bold text-text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-text-muted" aria-hidden="true" />
      Nháp
    </span>
  )
}

function PriceLabel({ price }: { price: number | null }) {
  if (price === null) {
    return <span className="text-caption text-text-muted italic">Liên hệ báo giá</span>
  }
  return (
    <span className="text-caption font-semibold text-primary">
      {price.toLocaleString("vi-VN")}đ
    </span>
  )
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/san-pham/${product.id}` as never}
      className="group flex flex-col rounded-2xl border border-border bg-surface overflow-hidden transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
    >
      {/* Ảnh sản phẩm */}
      <div className="relative aspect-square w-full bg-surface-alt overflow-hidden">
        {product.masterImageUrl ? (
          <img
            src={product.masterImageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-text-muted">
            <ImageOff size={28} strokeWidth={1.5} />
            <span className="text-caption">Chưa có ảnh</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={product.status} />
        </div>
      </div>

      {/* Thông tin */}
      <div className="flex flex-col gap-1 p-3">
        <div className="truncate text-body-sm font-bold text-text">{product.name}</div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-caption text-text-muted">{product.category ?? "Chưa phân loại"}</span>
          <PriceLabel price={product.price_vnd} />
        </div>
        <div className="mt-1 text-caption text-text-muted font-mono">#{product.code}</div>
      </div>
    </Link>
  )
}

const CATEGORIES = ["Tất cả", "Bó hoa", "Giỏ hoa", "Kệ khai trương", "Hộp hoa", "Bình hoa"]

export default function SanPhamPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [tuKhoa, setTuKhoa] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [activeCategory, setActiveCategory] = useState("Tất cả")

  const napLai = useCallback(async () => {
    setLoi(null)
    try {
      const res = await fetch("/api/v1/products?limit=50")
      if (res.status === 401) {
        router.push("/dang-nhap" as never)
        return
      }
      if (!res.ok) throw new Error(`Không tải được danh sách (${res.status})`)
      const data = (await res.json()) as { data: Product[] }
      setProducts(data.data)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không tải được danh sách sản phẩm")
    }
  }, [router])

  useEffect(() => {
    napLai()
  }, [napLai])

  const hien = (products ?? []).filter((p) => {
    const tuKhoaOk =
      tuKhoa.trim() === "" ? true : (p.name + p.code).toLowerCase().includes(tuKhoa.trim().toLowerCase())
    const catOk = activeCategory === "Tất cả" ? true : p.category === activeCategory
    return tuKhoaOk && catOk
  })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header tác vụ */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3.5 gap-3">
        <div>
          <div className="text-caption text-text-muted">Kho sản phẩm cửa hàng</div>
          <h1 className="text-title font-extrabold text-primary">Mẫu hoa</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => napLai()}
            aria-label="Tải lại danh sách"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-muted hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          >
            <RefreshCw size={15} />
          </button>
          <button
            type="button"
            onClick={() => router.push("/san-pham/nhap-hang-loat" as never)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 h-9 text-body-sm font-semibold text-text hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            title="Nhập sản phẩm đồng loạt từ file Excel và folder ảnh"
          >
            <FileSpreadsheet size={14} className="text-success" />
            <span className="hidden sm:inline">Nhập Excel & Ảnh</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/tai-anh" as never)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 h-9 text-body-sm font-semibold text-text hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            title="Upload ảnh hoa → AI phân tích tự động"
          >
            <Sparkles size={14} className="text-primary" />
            <span className="hidden sm:inline">Phân tích AI</span>
          </button>
          <Button
            size="sm"
            onClick={() => router.push("/san-pham/tao-moi" as never)}
            className="flex items-center gap-1.5 h-9"
          >
            <Plus size={15} strokeWidth={2.2} />
            <span>Thêm sản phẩm</span>
          </Button>
        </div>
      </header>

      {/* Bộ lọc + tìm kiếm */}
      <div className="flex flex-shrink-0 flex-col gap-3 border-b border-border bg-surface px-4 py-3">
        {/* Thanh tìm kiếm + toggle view */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="Tìm tên hoặc mã sản phẩm..."
              className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>
          {/* Toggle Grid / Bảng */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Xem dạng lưới"
              aria-pressed={viewMode === "grid"}
              className={`flex h-10 w-10 items-center justify-center transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "bg-surface text-text-muted hover:bg-surface-alt"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-label="Xem dạng bảng"
              aria-pressed={viewMode === "table"}
              className={`flex h-10 w-10 items-center justify-center border-l border-border transition-colors ${viewMode === "table" ? "bg-primary text-white" : "bg-surface text-text-muted hover:bg-surface-alt"}`}
            >
              <LayoutList size={16} />
            </button>
          </div>
        </div>

        {/* Lọc nhanh theo danh mục */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 rounded-full border px-3 py-1 text-caption font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                activeCategory === cat
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text-muted hover:border-primary/50 hover:text-text"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Nội dung chính */}
      <main className="flex flex-1 flex-col overflow-y-auto p-4">
        {loi && (
          <div className="mb-3 rounded-xl border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-body-sm font-medium text-danger">
            {loi}
          </div>
        )}

        {products === null ? (
          <div className="py-4">
            <SkeletonBlock lines={5} />
          </div>
        ) : hien.length === 0 ? (
          <EmptyState
            title={products.length === 0 ? "Kho sản phẩm trống" : "Không tìm thấy mẫu phù hợp"}
            reason={
              products.length === 0
                ? "Upload ảnh hoa → AI phân tích BOM tự động → Duyệt → Sản phẩm vào kho."
                : "Thử tìm kiếm với từ khoá khác hoặc chọn danh mục khác."
            }
            action={
              products.length === 0
                ? { label: "Upload ảnh → Tạo sản phẩm", onClick: () => router.push("/tai-anh" as never) }
                : undefined
            }
          />
        ) : viewMode === "grid" ? (
          /* Dạng lưới card có ảnh */
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {hien.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          /* Dạng bảng quản trị */
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-border bg-surface-alt text-caption font-bold uppercase tracking-wider text-text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Sản phẩm</th>
                  <th scope="col" className="px-4 py-3">Danh mục</th>
                  <th scope="col" className="px-4 py-3">Giá</th>
                  <th scope="col" className="px-4 py-3">Trạng thái</th>
                  <th scope="col" className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hien.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-surface-alt/50">
                    <td className="px-4 py-3 font-semibold text-text">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-surface-alt border border-border">
                          {p.masterImageUrl ? (
                            <img
                              src={p.masterImageUrl}
                              alt={p.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-text-muted">
                              <ImageOff size={16} strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-text">{p.name}</div>
                          <div className="text-caption text-text-muted font-mono">#{p.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-caption text-text">{p.category ?? "—"}</td>
                    <td className="px-4 py-3">
                      <PriceLabel price={p.price_vnd} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => router.push(`/san-pham/${p.id}` as never)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-caption font-semibold text-text-muted hover:bg-surface-alt hover:text-text transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <Eye size={13} />
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/san-pham/${p.id}/tinh-nang` as never)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-caption font-semibold text-text hover:border-primary/40 hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <Sparkles size={13} />
                          Studio
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Đếm kết quả */}
        {products !== null && hien.length > 0 && (
          <div className="mt-4 text-center text-caption text-text-muted">
            Hiển thị {hien.length} / {products.length} mẫu hoa
          </div>
        )}
      </main>
    </div>
  )
}
