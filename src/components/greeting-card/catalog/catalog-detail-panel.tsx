"use client"

import React, { useState } from "react"
import { ArrowLeft, Package, Plus, Trash2, Search, Loader2, X, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCatalogItems } from "./use-catalog-items"
import { FlowerImage } from "@/components/greeting-card/flower-image"
import { CatalogHeartsPanel } from "./catalog-hearts-panel"

type ProductVariant = { id: string; price_vnd: number; name: string }
type CatalogProduct = {
  id: string
  product: {
    id: string
    name: string
    masterImageUrl?: string | undefined
    driveLink?: string | undefined
    variants: ProductVariant[]
  }
  sort_order: number
}
type CatalogDetail = {
  id: string
  code: string
  name: string
  type: string
  description: string | null
  _count: { sessions: number }
  items: CatalogProduct[]
}

type Props = {
  catalogId: string
  catalogName: string
  onBack: () => void
}

export function CatalogDetailPanel({ catalogId, catalogName, onBack }: Props) {
  const [productSearch, setProductSearch] = useState("")
  const ci = useCatalogItems<CatalogDetail>(catalogId)
  const catalog = ci.catalog
  const loading = ci.loading
  const isAddOpen = ci.pickerOpen
  const setIsAddOpen = (open: boolean) => (open ? ci.openPicker() : ci.closePicker())
  const openAddProduct = ci.openPicker
  const addingId = ci.busyId
  const removingId = ci.busyId
  const handleAddProduct = (productId: string) => void ci.add(productId)
  function handleRemoveProduct(productId: string) {
    if (!window.confirm("Xóa sản phẩm này khỏi bộ sưu tập?")) return
    void ci.remove(productId)
  }
  const filteredProducts = ci.available

  if (loading && !catalog) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <Loader2 size={24} className="animate-spin mr-2" />
        <span className="text-body-sm">Đang tải bộ sưu tập...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {ci.error && <p role="alert" className="p-3 rounded-xl bg-danger-bg text-danger text-body-sm">{ci.error}</p>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại danh sách bộ sưu tập"
            className="p-2 rounded-xl border border-border hover:bg-surface-muted transition-colors text-text-muted hover:text-foreground"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-title font-extrabold text-foreground">{catalogName}</h2>
            <p className="text-body-sm text-text-muted">
              {catalog?._count.sessions ?? 0} link đã gửi ·{" "}
              {catalog?.items.length ?? 0} mẫu hoa trong bộ sưu tập
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => void openAddProduct()}
          className="bg-primary hover:bg-primary-dark text-white font-bold gap-1.5 text-body-sm h-9 shadow-sm"
        >
          <Plus size={16} />
          <span>Thêm Mẫu Hoa</span>
        </Button>
      </div>

      {/* Add Product Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-lg mx-4 p-5 flex flex-col gap-4 max-h-[80vh]">
            <div className="flex items-center justify-between">
              <h3 className="text-title-sm font-extrabold text-foreground">Chọn mẫu hoa thêm vào bộ sưu tập</h3>
              <button
                type="button"
                onClick={() => { setIsAddOpen(false); setProductSearch("") }}
                aria-label="Đóng modal chọn mẫu hoa"
                className="p-1.5 rounded-lg hover:bg-surface text-text-muted"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Tìm tên sản phẩm..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background text-body text-foreground"
              />
            </div>
            <div className="overflow-y-auto flex flex-col gap-2 flex-1 min-h-0">
              {filteredProducts.length === 0 ? (
                <p className="text-body-sm text-text-muted text-center py-8">
                  {productSearch ? "Không tìm thấy sản phẩm phù hợp" : "Tất cả sản phẩm đã được thêm vào bộ sưu tập"}
                </p>
              ) : (
              filteredProducts.map((product) => {
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-surface transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-surface-alt border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        <FlowerImage src={product.masterImageUrl} driveLink={product.driveLink} alt={product.name} sizes="(max-width: 640px) 50vw, 200px" fallback="icon" className="w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-bold text-foreground truncate">{product.name}</p>
                        {product.price_vnd !== null ? (
                          <p className="text-caption text-primary font-semibold">
                            {product.price_vnd.toLocaleString("vi-VN")}đ
                          </p>
                        ) : (
                          <p className="text-caption text-text-muted italic">Liên hệ báo giá</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAddProduct(product.id)}
                        disabled={addingId === product.id}
                        className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors shrink-0"
                      >
                        {addingId === product.id
                          ? <Loader2 size={16} className="animate-spin" />
                          : <Plus size={16} />}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsAddOpen(false); setProductSearch("") }}
              className="self-end h-9"
            >
              Xong
            </Button>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {catalog?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center">
            <Package size={28} className="text-text-muted" />
          </div>
          <div className="text-center">
            <p className="text-title-sm font-bold text-foreground">Bộ sưu tập chưa có mẫu hoa</p>
            <p className="text-body-sm text-text-muted mt-1">
              Thêm mẫu hoa từ danh mục sản phẩm để khách có thể vuốt chọn
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void openAddProduct()}
            className="gap-2 mt-2 font-bold"
          >
            <Plus size={16} />
            Thêm Mẫu Hoa Đầu Tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {catalog?.items.map((item) => {
            const price = item.product.variants[0]?.price_vnd
            return (
              <div
                key={item.id}
                className="bg-surface rounded-xl border border-border overflow-hidden flex flex-col hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
              >
                <div className="aspect-square bg-surface-muted relative overflow-hidden">
                  <FlowerImage src={item.product.masterImageUrl} driveLink={item.product.driveLink} alt={item.product.name} sizes="(max-width: 640px) 50vw, 200px" fallback="icon" className="w-full h-full" />
                  <div className="absolute top-2 left-2">
                    <span className="w-6 h-6 rounded-full bg-black/50 text-white text-caption font-bold flex items-center justify-center">
                      {item.sort_order + 1}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemoveProduct(item.product.id)}
                    disabled={removingId === item.product.id}
                    aria-label={`Xóa ${item.product.name} khỏi bộ sưu tập`}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-black/50 hover:bg-danger/80 text-white"
                  >
                    {removingId === item.product.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={12} />}
                  </button>
                </div>
                <div className="p-3 flex flex-col gap-1">
                  <p className="text-caption font-bold text-foreground line-clamp-2 leading-tight">
                    {item.product.name}
                  </p>
                  {price !== undefined && (
                    <p className="text-caption text-text-muted font-mono">
                      {price.toLocaleString("vi-VN")}đ
                    </p>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add More Card */}
          <button
            type="button"
            onClick={() => void openAddProduct()}
            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-text-muted hover:text-primary"
          >
            <Plus size={24} />
            <span className="text-caption font-bold">Thêm mẫu</span>
          </button>
        </div>
      )}

      {catalog && catalog.items.length > 0 && <CatalogHeartsPanel catalogId={catalogId} />}

      {catalog && catalog.items.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-success-bg border border-success/20 text-success">
          <CheckCircle size={16} />
          <p className="text-caption font-bold">
            Bộ sưu tập sẵn sàng — {catalog.items.length} mẫu hoa, {catalog._count.sessions} link đã gửi tới khách
          </p>
        </div>
      )}
    </div>
  )
}
