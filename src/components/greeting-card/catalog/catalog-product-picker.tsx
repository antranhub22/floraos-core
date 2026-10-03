"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Search, ImageOff, Plus, Trash2, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type AvailableProduct = {
  id: string
  name: string
  code: string
  category: string | null
  masterImageUrl?: string | undefined
  price_vnd: number | null
}

type CatalogItem = {
  id: string
  product: { id: string; name: string; masterImageUrl?: string | undefined }
  sort_order: number
}

interface Props {
  catalogId: string
  /** Hiển thị compact (dùng trong wizard) hay full (dùng trong manager) */
  compact?: boolean
  /** Callback sau khi thêm/xóa để wizard cập nhật itemCount */
  onItemCountChange?: (count: number) => void
}

export function CatalogProductPicker({ catalogId, compact = false, onItemCountChange }: Props) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [allProducts, setAllProducts] = useState<AvailableProduct[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [loadingItems, setLoadingItems] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const loadCatalogItems = useCallback(async () => {
    setLoadingItems(true)
    try {
      const res = await fetch(`/api/v1/greeting-card/catalogs/${catalogId}`)
      if (!res.ok) return
      const json = await res.json() as { data: { items: CatalogItem[] } }
      const newItems = json.data?.items ?? []
      setItems(newItems)
      onItemCountChange?.(newItems.length)
    } finally {
      setLoadingItems(false)
    }
  }, [catalogId, onItemCountChange])

  useEffect(() => { void loadCatalogItems() }, [loadCatalogItems])

  async function openPicker() {
    setLoadingProducts(true)
    setShowPicker(true)
    try {
      const res = await fetch("/api/v1/products?limit=100")
      if (res.ok) {
        const json = await res.json() as { data: AvailableProduct[] }
        setAllProducts(Array.isArray(json.data) ? json.data : [])
      }
    } finally {
      setLoadingProducts(false)
    }
  }

  async function handleAdd(productId: string) {
    setAddingId(productId)
    try {
      const res = await fetch(`/api/v1/greeting-card/catalogs/${catalogId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      if (res.ok) await loadCatalogItems()
    } finally {
      setAddingId(null)
    }
  }

  async function handleRemove(productId: string) {
    setRemovingId(productId)
    try {
      await fetch(`/api/v1/greeting-card/catalogs/${catalogId}/products`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      await loadCatalogItems()
    } finally {
      setRemovingId(null)
    }
  }

  const existingIds = new Set(items.map((i) => i.product.id))
  const filtered = allProducts.filter(
    (p) =>
      !existingIds.has(p.id) &&
      (!productSearch.trim() ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(productSearch.toLowerCase()))
  )

  if (loadingItems) {
    return (
      <div className="flex items-center justify-center py-8 text-text-muted gap-2">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-body-sm">Đang tải danh sách sản phẩm...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-body-sm font-bold text-text">
            {items.length > 0
              ? `${items.length} mẫu hoa trong bộ sưu tập`
              : "Bộ sưu tập chưa có mẫu hoa nào"}
          </p>
          {items.length === 0 && (
            <p className="text-caption text-text-muted mt-0.5">
              Thêm ít nhất 1 mẫu để khách có thể vuốt xem
            </p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => void openPicker()}
          className="gap-1.5 font-bold text-body-sm h-9 shadow-sm"
        >
          <Plus size={15} />
          Thêm mẫu hoa
        </Button>
      </div>

      {/* Selected product chips */}
      {items.length > 0 && (
        <div
          className={`grid gap-2 ${
            compact
              ? "grid-cols-2 sm:grid-cols-3"
              : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5"
          }`}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="relative group rounded-xl border border-border bg-surface overflow-hidden"
            >
              <div className="aspect-square bg-surface-alt flex items-center justify-center overflow-hidden">
                {item.product.masterImageUrl ? (
                  <img
                    src={item.product.masterImageUrl}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageOff size={20} className="text-text-muted" />
                )}
              </div>
              <div className="p-2">
                <p className="text-caption font-semibold text-text line-clamp-2 leading-tight">
                  {item.product.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleRemove(item.product.id)}
                disabled={removingId === item.product.id}
                aria-label={`Xóa ${item.product.name}`}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg bg-black/50 hover:bg-danger/80 text-white"
              >
                {removingId === item.product.id ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Trash2 size={11} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Success notice */}
      {items.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success-bg border border-success/20 text-success">
          <CheckCircle size={14} />
          <span className="text-caption font-bold">
            Bộ sưu tập sẵn sàng — {items.length} mẫu hoa đã thêm
          </span>
        </div>
      )}

      {/* Inline picker panel */}
      {showPicker && (
        <div className="rounded-2xl border border-border bg-surface-muted p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-body-sm font-bold text-text">Chọn từ kho sản phẩm</p>
            <button
              type="button"
              onClick={() => {
                setShowPicker(false)
                setProductSearch("")
              }}
              className="text-caption text-text-muted hover:text-text font-medium underline"
            >
              Đóng
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Tìm tên hoặc mã sản phẩm..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-body-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Product list */}
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-8 text-text-muted gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-body-sm">Đang tải kho sản phẩm...</span>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-body-sm text-text-muted text-center py-8">
                {productSearch
                  ? "Không tìm thấy sản phẩm phù hợp"
                  : "Tất cả sản phẩm đã được thêm vào bộ sưu tập"}
              </p>
            ) : (
              filtered.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors"
                >
                  <div className="w-11 h-11 rounded-lg bg-surface-alt border border-border flex items-center justify-center shrink-0 overflow-hidden">
                    {product.masterImageUrl ? (
                      <img
                        src={product.masterImageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageOff size={14} className="text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-bold text-text truncate">{product.name}</p>
                    <p className="text-caption text-text-muted font-mono">{product.code}</p>
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
                    onClick={() => void handleAdd(product.id)}
                    disabled={addingId === product.id}
                    aria-label={`Thêm ${product.name} vào bộ sưu tập`}
                    className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors shrink-0"
                  >
                    {addingId === product.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Plus size={15} />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
