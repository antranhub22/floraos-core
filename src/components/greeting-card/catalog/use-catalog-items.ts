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
 * Ánh xạ HAI CHIỀU: mọi biến thể (mã DB tiếng Anh + nhãn UI tiếng Việt đã chuẩn hoá)
 * → canonical key thống nhất.
 *
 * Ví dụ: product.category = "STAND" hoặc "Kệ hoa" hoặc "ke hoa" đều → "ke-hoa".
 * Filter chip "Kệ hoa" → normalizeText → "ke hoa" → "ke-hoa" → khớp.
 */
const CATEGORY_CANONICAL: Record<string, string> = {
  // ── Mã DB tiếng Anh ──
  bouquet: "bo-hoa",
  basket: "gio-hoa",
  vase: "binh-hoa",
  box: "hop-hoa",
  stand: "ke-hoa",
  arrangement: "lang-hoa",
  // ── Nhãn tiếng Việt (sau normalizeText) ──
  "bo hoa": "bo-hoa",
  "gio hoa": "gio-hoa",
  "binh hoa": "binh-hoa",
  "hop hoa": "hop-hoa",
  "ke hoa": "ke-hoa",
  "lang hoa": "lang-hoa",
  lang: "lang-hoa",
  // ── Shape values thường gặp ──
  round: "bo-hoa",
  triangle: "gio-hoa",
  cascade: "binh-hoa",
  heart: "hop-hoa",
  vertical: "ke-hoa",
}

/** Tra canonical key cho category/shape bất kỳ, sau khi chuẩn hoá. */
function categoryCanonical(value: string | null | undefined): string | null {
  if (!value) return null
  return CATEGORY_CANONICAL[normalizeText(value)] ?? null
}

/** Từ khoá fallback trong tên sản phẩm khi attributes.occasionCodes chưa điền. */
const OCCASION_NAME_KEYWORDS: Record<string, string[]> = {
  "Sinh nhật": ["sinh nhat", "birthday"],
  "Khai trương": ["khai truong", "khai nghiep"],
  "Kỷ niệm": ["ky niem", "anniversary"],
  "Chúc mừng": ["chuc mung", "congratulation"],
  "Chia buồn": ["chia buon", "tang le"],
}

/** Từ khoá fallback trong tên sản phẩm khi attributes.color chưa điền. */
const COLOR_NAME_KEYWORDS: Record<string, string[]> = {
  Pastel: ["pastel"],
  Đỏ: ["do", "red", "hong"],
  Vàng: ["vang", "yellow"],
  Hồng: ["hong", "pink", "rose"],
  Trắng: ["trang", "white"],
}

/**
 * Mẫu hoa trong một bộ sưu tập + kho sản phẩm để thêm vào (SWR).
 *
 * Chiến lược lọc:
 * - Server-side: `search` (ILIKE name/code) — không phụ thuộc chất lượng attributes
 * - Client-side: category, occasion, color, flowerType, priceRange
 *   → canonical key + soft match → chịu được mọi biến thể (mã DB Anh, nhãn Việt, dấu/hoa/thường)
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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // Server-side chỉ lọc search (ILIKE). Mọi filter khác xử lý client-side.
  const productsUrl = (() => {
    if (!pickerOpen) return null
    const params = new URLSearchParams()
    params.set("limit", String(PICKER_LIMIT))
    params.set("status", "ACTIVE")
    if (debouncedSearch) params.set("search", debouncedSearch)
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

  const filteredAvailable = rawAvailable.filter((product) => {
    const price = product.price_vnd ?? 0
    const attrs = (product.attributes as Record<string, unknown>) ?? {}
    const normName = normalizeText(product.name ?? "")

    // 1. Khoảng giá — client-side (API chưa lọc được attributes.price)
    if (selectedBudgets.length > 0) {
      const match = selectedBudgets.some((bId) => {
        if (bId === "b1") return price > 0 && price <= 500_000
        if (bId === "b2") return price >= 500_000 && price <= 800_000
        if (bId === "b3") return price >= 800_000 && price <= 1_500_000
        if (bId === "b4") return price >= 1_500_000
        return false
      })
      if (!match) return false
    }

    // 2. Dáng hoa — canonical key (chịu BOUQUET / "Bó hoa" / "bo hoa" / ROUND…)
    if (filterCategory) {
      const filterKey = categoryCanonical(filterCategory)
      if (filterKey) {
        const productKey =
          categoryCanonical(product.category) ?? categoryCanonical(product.shape)
        const matchCanonical = productKey === filterKey
        // Fallback: tên sản phẩm chứa từ khoá chuẩn hoá
        const matchName = normName.includes(normalizeText(filterCategory))
        if (!matchCanonical && !matchName) return false
      }
    }

    // 3. Dịp tặng — khớp attributes nếu có, fallback tên sản phẩm
    if (filterOccasion) {
      const occasionsArr: string[] = Array.isArray(attrs.occasionCodes)
        ? (attrs.occasionCodes as string[])
        : Array.isArray(product.occasions)
          ? (product.occasions as string[])
          : []
      if (occasionsArr.length > 0) {
        const occ = normalizeText(filterOccasion)
        if (!occasionsArr.some((o) => normalizeText(String(o)).includes(occ))) return false
      } else {
        const kws = lookupNormalized(OCCASION_NAME_KEYWORDS, filterOccasion) ?? []
        if (!kws.some((kw) => normName.includes(normalizeText(kw)))) return false
      }
    }

    // 4. Loại hoa — khớp tên hoặc attributes.flowerTypes
    if (filterFlowerType) {
      const fl = normalizeText(filterFlowerType)
      const ftArr: string[] = Array.isArray(attrs.flowerTypes)
        ? (attrs.flowerTypes as string[])
        : Array.isArray(product.flowerTypes)
          ? (product.flowerTypes as string[])
          : []
      if (!normName.includes(fl) && !ftArr.some((f) => normalizeText(String(f)).includes(fl)))
        return false
    }

    // 5. Tone màu — khớp attributes.color nếu có, fallback tên sản phẩm
    if (filterColorTone) {
      const colorVal = normalizeText(
        String(product.colorTheme ?? attrs.color ?? attrs.colorTheme ?? "")
      )
      const kws = lookupNormalized(COLOR_NAME_KEYWORDS, filterColorTone) ?? [
        normalizeText(filterColorTone),
      ]
      if (colorVal) {
        if (!kws.some((kw) => colorVal.includes(normalizeText(kw)))) return false
      } else {
        if (!kws.some((kw) => normName.includes(normalizeText(kw)))) return false
      }
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
    available: filteredAvailable,
    rawCount: rawAvailable.length,
    add: (productId: string) => change("POST", productId),
    remove: (productId: string) => change("DELETE", productId),
    busyId,
    error,
  }
}
