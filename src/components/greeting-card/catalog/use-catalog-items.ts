"use client"

import { useState, useEffect, useRef } from "react"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import { lookupNormalized, normalizeText } from "@/lib/normalize-text"

export type AvailableProduct = {
  id: string
  name: string
  code: string
  category: string | null
  shape?: string | null | undefined
  /** URL ảnh chính — từ SSOT API `/api/v1/products`. `undefined` khi chưa có ảnh. */
  masterImageUrl?: string | undefined
  /** Giá tham chiếu — `null` = Liên hệ báo giá. */
  price_vnd: number | null
  /** Link Google Drive (import Excel) — fallback thumbnail khi chưa có ảnh storage. */
  driveLink?: string | undefined
  occasions?: string[] | undefined
  flowerTypes?: string[] | undefined
  colorTheme?: string | null | undefined
  attributes?: Record<string, unknown> | null | undefined
}

const PICKER_LIMIT = 100
const SEARCH_DEBOUNCE_MS = 280

/**
 * Ánh xạ nhãn UI tiếng Việt → mã DB tiếng Anh cho `category`.
 * DB lưu theo BOUQUET / BASKET / VASE / BOX / STAND / ARRANGEMENT.
 */
const CATEGORY_UI_TO_DB: Record<string, string> = {
  "Bó hoa": "BOUQUET",
  "Giỏ hoa": "BASKET",
  "Bình hoa": "VASE",
  "Hộp hoa": "BOX",
  "Kệ hoa": "STAND",
  "Lẵng hoa": "ARRANGEMENT",
}

/**
 * Ánh xạ nhãn UI tiếng Việt → mã dịp tặng trong `attributes.occasionCodes`.
 * Ví dụ DB: ["sinh-nhat", "khai-truong"].
 */
const OCCASION_UI_TO_DB: Record<string, string> = {
  "Sinh nhật": "sinh-nhat",
  "Khai trương": "khai-truong",
  "Kỷ niệm": "ky-niem",
  "Chúc mừng": "chuc-mung",
  "Chia buồn": "chia-buon",
}

/**
 * Ánh xạ nhãn UI tone màu → giá trị `attributes.color` trong DB.
 * DB thường lưu tiếng Anh hoặc tiếng Việt không dấu.
 */
const COLOR_UI_TO_DB: Record<string, string[]> = {
  Pastel: ["pastel"],
  Đỏ: ["do", "red", "đỏ"],
  Vàng: ["vang", "yellow", "vàng"],
  Hồng: ["hong", "pink", "hồng"],
  Trắng: ["trang", "white", "trắng"],
}

/**
 * Mẫu hoa trong một bộ sưu tập + kho sản phẩm để thêm vào (SWR). Dùng chung
 * cho wizard (picker gọn) và bảng quản lý chi tiết.
 *
 * Lọc server-side (`category`, `occasionCode`, `color`, `search`) để hoạt động
 * đúng với kho lớn (1000+ sản phẩm). Debounce 280ms tránh gọi API mỗi keystroke.
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

  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([])
  const [filterOccasion, setFilterOccasion] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [filterFlowerType, setFilterFlowerType] = useState<string>("")
  const [filterColorTone, setFilterColorTone] = useState<string>("")

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

  // Xây dựng URL gọi API với server-side filters — chỉ gọi khi picker đang mở
  const productsUrl = (() => {
    if (!pickerOpen) return null
    const params = new URLSearchParams()
    params.set("limit", String(PICKER_LIMIT))
    params.set("status", "ACTIVE")

    if (debouncedSearch) params.set("search", debouncedSearch)

    // Server-side: category → DB code (BOUQUET, BASKET…)
    // lookupNormalized chịu được mọi biến thể dấu/hoa thường
    if (filterCategory) {
      const dbCode = lookupNormalized(CATEGORY_UI_TO_DB, filterCategory)
      if (dbCode) params.set("category", dbCode)
    }

    // Server-side: occasion code (sinh-nhat, khai-truong…)
    if (filterOccasion) {
      const dbCode = lookupNormalized(OCCASION_UI_TO_DB, filterOccasion)
      if (dbCode) params.set("occasion_code", dbCode)
    }

    // Server-side: color (first alias)
    if (filterColorTone) {
      const aliases = lookupNormalized(COLOR_UI_TO_DB, filterColorTone)
      if (aliases?.[0]) params.set("color", aliases[0])
    }

    // Server-side: price range (gửi min/max để DB lọc)
    // Giá tham chiếu nằm trong attributes.price — server chưa hỗ trợ lọc giá qua API,
    // nên khoảng giá vẫn lọc client-side bên dưới.

    return `/api/v1/products?${params.toString()}`
  })()

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

  const resetFilters = () => {
    setSelectedBudgets([])
    setFilterOccasion("")
    setFilterCategory("")
    setFilterFlowerType("")
    setFilterColorTone("")
  }

  const hasActiveFilters =
    selectedBudgets.length > 0 ||
    Boolean(filterOccasion) ||
    Boolean(filterCategory) ||
    Boolean(filterFlowerType) ||
    Boolean(filterColorTone)

  const rawAvailable = (products.data?.data ?? []).filter((p) => !existing.has(p.id))

  // Client-side: khoảng giá (API chưa hỗ trợ lọc giá qua attributes.price)
  // + loại hoa (flowerTypes trong attributes) + màu (fallback nếu server không lọc được)
  const filteredAvailable = rawAvailable.filter((product) => {
    const price = product.price_vnd ?? 0

    // 1. Khoảng giá — client-side vì API chưa hỗ trợ lọc attributes.price
    if (selectedBudgets.length > 0) {
      const matchAnyBudget = selectedBudgets.some((bId) => {
        if (bId === "b1") return price > 0 && price <= 500_000
        if (bId === "b2") return price >= 500_000 && price <= 800_000
        if (bId === "b3") return price >= 800_000 && price <= 1_500_000
        if (bId === "b4") return price >= 1_500_000
        return false
      })
      if (!matchAnyBudget) return false
    }

    // 2. Loại hoa — client-side: khớp tên sản phẩm hoặc attributes.flowerTypes
    // normalizeText chịu được mọi biến thể dấu/hoa thường ở cả hai phía
    if (filterFlowerType) {
      const fl = normalizeText(filterFlowerType)
      const attrs = (product.attributes as Record<string, unknown>) ?? {}
      const flowerTypesArr = Array.isArray(attrs.flowerTypes)
        ? (attrs.flowerTypes as string[])
        : Array.isArray(product.flowerTypes)
          ? (product.flowerTypes as string[])
          : []
      const normName = normalizeText(product.name ?? "")
      const matchFlower =
        normName.includes(fl) ||
        flowerTypesArr.some((f) => normalizeText(String(f)).includes(fl))
      if (!matchFlower) return false
    }

    return true
  })

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
      resetFilters()
    },
    loadingProducts: products.isLoading,
    searchQuery,
    setSearchQuery,
    selectedBudgets,
    setSelectedBudgets,
    filterOccasion,
    setFilterOccasion,
    filterCategory,
    setFilterCategory,
    filterFlowerType,
    setFilterFlowerType,
    filterColorTone,
    setFilterColorTone,
    resetFilters,
    hasActiveFilters,
    /** Sản phẩm sau khi lọc qua search query & quick filters */
    available: filteredAvailable,
    rawCount: rawAvailable.length,
    add: (productId: string) => change("POST", productId),
    remove: (productId: string) => change("DELETE", productId),
    busyId,
    error,
  }
}
