"use client"

import { useState, useEffect, useRef } from "react"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"

export type AvailableProduct = {
  id: string
  name: string
  code: string
  category: string | null
  /** URL ảnh chính — từ SSOT API `/api/v1/products`. `undefined` khi chưa có ảnh. */
  masterImageUrl?: string | undefined
  /** Giá tham chiếu — `null` = Liên hệ báo giá. */
  price_vnd: number | null
  /** Link Google Drive (import Excel) — fallback thumbnail khi chưa có ảnh storage. */
  driveLink?: string | undefined
}

const PICKER_LIMIT = 50
const SEARCH_DEBOUNCE_MS = 280

/**
 * Mẫu hoa trong một bộ sưu tập + kho sản phẩm để thêm vào (SWR). Dùng chung
 * cho wizard (picker gọn) và bảng quản lý chi tiết.
 *
 * Tìm kiếm server-side (`search` param) để hoạt động đúng với kho lớn (1000+ sản phẩm).
 * Debounce 280ms tránh gọi API mỗi keystroke.
 */
export function useCatalogItems<TDetail extends { items: Array<{ product: { id: string } }> }>(
  catalogId: string,
  onItemCountChange?: (count: number) => void
) {
  const detail = useApi<{ data: TDetail }>(`/api/v1/greeting-card/catalogs/${catalogId}`, {
    onSuccess: (res) => onItemCountChange?.(res.data.items.length),
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Debounce: chỉ cập nhật debouncedSearch sau SEARCH_DEBOUNCE_MS ms im lặng
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // Xây dựng URL gọi API — chỉ gọi khi picker đang mở
  const productsUrl = pickerOpen
    ? `/api/v1/products?limit=${PICKER_LIMIT}&status=ACTIVE${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}`
    : null

  const products = useApi<{ data: AvailableProduct[] }>(productsUrl)

  async function change(method: "POST" | "DELETE", productId: string) {
    setBusyId(productId)
    setError(null)
    try {
      await apiSend(
        `/api/v1/greeting-card/catalogs/${catalogId}/products`,
        method,
        { productId },
        method === "POST" ? "Không thêm được mẫu hoa" : "Không xoá được mẫu hoa"
      )
      await detail.mutate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác không thành công")
    } finally {
      setBusyId(null)
    }
  }

  const catalog = detail.data?.data ?? null
  const existing = new Set(catalog?.items.map((i) => i.product.id) ?? [])
  return {
    catalog,
    loading: detail.isLoading,
    reload: () => detail.mutate(),
    pickerOpen,
    openPicker: () => setPickerOpen(true),
    closePicker: () => {
      setPickerOpen(false)
      setSearchQuery("")
      setDebouncedSearch("")
    },
    loadingProducts: products.isLoading,
    searchQuery,
    setSearchQuery,
    /** Sản phẩm chưa có trong bộ sưu tập (server đã lọc theo search, client chỉ loại trùng). */
    available: (products.data?.data ?? []).filter((p) => !existing.has(p.id)),
    add: (productId: string) => change("POST", productId),
    remove: (productId: string) => change("DELETE", productId),
    busyId,
    error,
  }
}
