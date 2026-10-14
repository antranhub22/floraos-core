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
 * lookupNormalized() cho phép mọi biến thể dấu/hoa thường đều khớp.
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
 * Từ khoá tìm trong tên sản phẩm khi `attributes.occasionCodes` chưa được điền.
 * Chuẩn hoá sẵn qua normalizeText để so sánh.
 */
const OCCASION_NAME_KEYWORDS: Record<string, string[]> = {
  "Sinh nhật": ["sinh nhat", "birthday", "sinh nhật"],
  "Khai trương": ["khai truong", "khai trương", "khai nghiep", "khai nghiệp"],
  "Kỷ niệm": ["ky niem", "kỷ niệm", "anniversary"],
  "Chúc mừng": ["chuc mung", "chúc mừng", "congratulation"],
  "Chia buồn": ["chia buon", "chia buồn", "tang le", "tang lễ"],
}

/**
 * Từ khoá tìm trong tên sản phẩm khi `attributes.color` chưa được điền.
 */
const COLOR_NAME_KEYWORDS: Record<string, string[]> = {
  Pastel: ["pastel"],
  Đỏ: ["do", "red", "đỏ", "hong"],
  Vàng: ["vang", "yellow", "vàng"],
  Hồng: ["hong", "pink", "hồng", "rose"],
  Trắng: ["trang", "white", "trắng"],
}

/**
 * Mẫu hoa trong một bộ sưu tập + kho sản phẩm để thêm vào (SWR). Dùng chung
 * cho wizard (picker gọn) và bảng quản lý chi tiết.
 *
 * Chiến lược lọc:
 * - Server-side (DB query): `category` (cột thật) + `search` (tên/mã)
 * - Client-side (soft match): `occasion`, `color`, `flowerType`, `priceRange`
 *   → khớp attributes nếu có, fallback về khớp tên sản phẩm nếu attributes chưa điền.
 *   Đảm bảo hoạt động ngay cả khi dữ liệu sản phẩm chưa hoàn chỉnh.
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

  /**
   * URL API — chỉ truyền server-side filters mà DB có cột thật:
   *   - `category` (cột `products.category` → BOUQUET/BASKET/…)
   *   - `search` (ILIKE trên name + code)
   * Các filter còn lại (occasion, color, flowerType, priceRange) xử lý client-side
   * để đảm bảo hoạt động khi attributes chưa được điền đầy đủ.
   */
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

  /**
   * Client-side filtering — soft match:
   * Ưu tiên khớp attributes nếu có dữ liệu, fallback về khớp tên sản phẩm.
   * Điều này đảm bảo bộ lọc vẫn hoạt động khi sản phẩm chưa được gán đầy đủ
   * occasionCodes / color / flowerTypes trong attributes.
   */
  const filteredAvailable = rawAvailable.filter((product) => {
    const price = product.price_vnd ?? 0
    const attrs = (product.attributes as Record<string, unknown>) ?? {}
    const normName = normalizeText(product.name ?? "")

    // 1. Khoảng giá — client-side (API chưa lọc được attributes.price)
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

    // 2. Dịp tặng — soft match: attributes.occasionCodes → fallback tên sản phẩm
    if (filterOccasion) {
      const occasionsArr: string[] = Array.isArray(attrs.occasionCodes)
        ? (attrs.occasionCodes as string[])
        : Array.isArray(product.occasions)
          ? (product.occasions as string[])
          : []

      if (occasionsArr.length > 0) {
        // Có dữ liệu → khớp chính xác
        const occ = normalizeText(filterOccasion)
        const matchOcc = occasionsArr.some((o) => normalizeText(String(o)).includes(occ))
        if (!matchOcc) return false
      } else {
        // Chưa có dữ liệu → soft match theo tên sản phẩm
        const keywords = lookupNormalized(OCCASION_NAME_KEYWORDS, filterOccasion) ?? []
        const matchName = keywords.some((kw) => normName.includes(normalizeText(kw)))
        if (!matchName) return false
      }
    }

    // 3. Loại hoa — soft match: attributes.flowerTypes → fallback tên sản phẩm
    if (filterFlowerType) {
      const fl = normalizeText(filterFlowerType)
      const flowerTypesArr: string[] = Array.isArray(attrs.flowerTypes)
        ? (attrs.flowerTypes as string[])
        : Array.isArray(product.flowerTypes)
          ? (product.flowerTypes as string[])
          : []

      const matchFlower =
        normName.includes(fl) ||
        flowerTypesArr.some((f) => normalizeText(String(f)).includes(fl))
      if (!matchFlower) return false
    }

    // 4. Tone màu — soft match: attributes.color → fallback tên sản phẩm
    if (filterColorTone) {
      const colorVal = normalizeText(
        String(product.colorTheme ?? attrs.color ?? attrs.colorTheme ?? "")
      )
      const keywords = lookupNormalized(COLOR_NAME_KEYWORDS, filterColorTone) ?? [
        normalizeText(filterColorTone),
      ]

      if (colorVal) {
        // Có dữ liệu → khớp attributes.color
        const matchColor = keywords.some((kw) => colorVal.includes(normalizeText(kw)))
        if (!matchColor) return false
      } else {
        // Chưa có dữ liệu → soft match theo tên sản phẩm
        const matchName = keywords.some((kw) => normName.includes(normalizeText(kw)))
        if (!matchName) return false
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
    /** Sản phẩm sau khi lọc qua search query & quick filters */
    available: filteredAvailable,
    rawCount: rawAvailable.length,
    add: (productId: string) => change("POST", productId),
    remove: (productId: string) => change("DELETE", productId),
    busyId,
    error,
  }
}
