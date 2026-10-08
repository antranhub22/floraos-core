"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Sparkles, RefreshCw, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useSession } from "@/lib/session"
import {
  TrashConfirmModal,
  type TrashConfirmTarget,
} from "@/components/storage/trash-confirm-modal"
import { readApiError } from "@/components/greeting-card/api-error"
import { useProductList } from "@/components/products/use-product-list"
import { ProductCard, type ProductItem } from "@/components/products/product-card"
import { ProductTableView } from "@/components/products/product-table-view"
import { ProductSearchFilterBar } from "@/components/products/product-search-filter-bar"
import {
  DEFAULT_FILTER_STATE,
  filterAndSortProducts,
  type ProductFilterState,
} from "@/components/products/product-filter-types"

const BASE_CATEGORIES = [
  "Tất cả",
  "Bó hoa",
  "Giỏ hoa",
  "Kệ khai trương",
  "Hoa chia buồn",
  "Hộp hoa",
  "Bình hoa",
]

export default function SanPhamPage() {
  const router = useRouter()
  const session = useSession()
  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_FILTER_STATE)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [trashTarget, setTrashTarget] = useState<TrashConfirmTarget | null>(null)

  const isExecutive =
    session.roleKey === "dieu_hanh" ||
    session.roleKey === "store_admin" ||
    session.can("G3") ||
    session.can("L4")

  // Server tải dữ liệu (từ khoá debounce + danh mục nếu có)
  const {
    items: rawProducts,
    error: loi,
    nextCursor,
    loadingMore,
    reload: napLai,
    loadMore: handleLoadMore,
    removeLocal,
  } = useProductList<ProductItem>(
    filters.search,
    filters.category === "Tất cả" ? null : filters.category
  )

  const handleConfirmTrash = async (target: TrashConfirmTarget) => {
    const res = await fetch("/api/v1/storage/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: target.id, type: target.type }),
    })
    if (!res.ok) {
      throw new Error(await readApiError(res, "Không thể chuyển sản phẩm vào thùng rác"))
    }
    removeLocal(target.id)
  }

  // Tự động gộp các danh mục thực tế từ kho sản phẩm để hiển thị đầy đủ
  const availableCategories = useMemo(() => {
    const set = new Set<string>(BASE_CATEGORIES)
    if (rawProducts) {
      for (const p of rawProducts) {
        if (p.category && p.category.trim()) {
          set.add(p.category.trim())
        }
      }
    }
    return Array.from(set)
  }, [rawProducts])

  // Lọc và sắp xếp theo Dịp, Giá, Từ khoá, Danh mục
  const filteredProducts = useMemo(() => {
    if (!rawProducts) return []
    return filterAndSortProducts(rawProducts, filters)
  }, [rawProducts, filters])

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTER_STATE)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header tác vụ */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3.5 gap-3">
        <div>
          <div className="text-caption text-text-muted">Kho sản phẩm của hàng</div>
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

      {/* Bộ lọc + tìm kiếm theo Dịp, Giá, Danh mục & Sắp xếp */}
      <ProductSearchFilterBar
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={filteredProducts.length}
        availableCategories={availableCategories}
      />

      {/* Nội dung chính */}
      <main className="flex flex-1 flex-col overflow-y-auto p-4">
        {loi && (
          <div className="mb-3 rounded-xl border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-body-sm font-medium text-danger">
            {loi}
          </div>
        )}

        {rawProducts === null ? (
          <div className="py-4">
            <SkeletonBlock lines={5} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title={rawProducts.length === 0 ? "Kho sản phẩm trống" : "Không tìm thấy mẫu phù hợp"}
            reason={
              rawProducts.length === 0
                ? "Upload ảnh hoa hoặc nhập file Excel để nạp mẫu hoa vào kho."
                : "Thử tìm kiếm với từ khoá khác, điều chỉnh khoảng giá hoặc chọn dịp khác."
            }
            action={
              rawProducts.length === 0
                ? { label: "Upload ảnh → Tạo sản phẩm", onClick: () => router.push("/tai-anh" as never) }
                : { label: "Xóa tất cả bộ lọc", onClick: handleResetFilters }
            }
          />
        ) : viewMode === "grid" ? (
          /* Dạng lưới card có ảnh */
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isExecutive={isExecutive}
                onTrash={(prod) =>
                  setTrashTarget({
                    id: prod.id,
                    name: prod.name,
                    code: prod.code,
                    imageUrl: prod.masterImageUrl,
                    type: "PRODUCT",
                  })
                }
              />
            ))}
          </div>
        ) : (
          /* Dạng bảng quản trị */
          <ProductTableView
            products={filteredProducts}
            isExecutive={isExecutive}
            onTrash={(prod) =>
              setTrashTarget({
                id: prod.id,
                name: prod.name,
                code: prod.code,
                imageUrl: prod.masterImageUrl,
                type: "PRODUCT",
              })
            }
          />
        )}

        {/* Phân trang / Tải thêm sản phẩm */}
        {rawProducts !== null && (
          <div className="mt-4 flex flex-col items-center gap-2">
            {nextCursor && (
              <button
                type="button"
                onClick={() => void handleLoadMore()}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-body-sm font-semibold text-text hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Đang tải thêm...</span>
                  </>
                ) : (
                  "Tải thêm sản phẩm"
                )}
              </button>
            )}
            {filteredProducts.length > 0 && (
              <div className="text-caption text-text-muted">
                Hiển thị {filteredProducts.length} mẫu hoa
                {nextCursor ? " — còn nhiều hơn" : " (tất cả)"}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal xác nhận xóa an toàn */}
      <TrashConfirmModal
        target={trashTarget}
        onClose={() => setTrashTarget(null)}
        onConfirm={handleConfirmTrash}
      />
    </div>
  )
}
