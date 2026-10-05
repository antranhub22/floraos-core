"use client"

import { useState, useEffect } from "react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"

const SAMPLE_PRODUCTS: GreetingCatalogProduct[] = [
  {
    id: "sample-1",
    name: "Bó Hoa Hồng Red Naomi Ecuador",
    code: "HH-01",
    price: 850000,
    imageUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    description: "Hoa hồng đỏ nhung Ecuador tuyển chọn, phối cành lá bạc bạch đàn.",
    flowersSummary: "12 cành hoa hồng Red Naomi Ecuador, lá bạc thơm, giấy gói lụa cao cấp",
    style: "Sang Trọng",
    meaning: "Tình yêu mãnh liệt, đam mê và sự gắn kết trường tồn",
    sortOrder: 1,
  },
  {
    id: "sample-2",
    name: "Giỏ Hoa Mẫu Đơn & Tulip Mùa Xuân",
    code: "GH-02",
    price: 1450000,
    imageUrl:
      "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80",
    description: "Mẫu đơn Sarah Bernhardt phối cùng tulip pastel Hà Lan trong giỏ mây tự nhiên.",
    flowersSummary: "5 bông mẫu đơn hồng, 10 cành tulip, hoa thanh liễu",
    style: "Thơ Mộng",
    meaning: "Sự thịnh vượng, thanh nhã và niềm vui trọn vẹn",
    sortOrder: 2,
  },
]

interface UseCatalogProductsResult {
  products: GreetingCatalogProduct[]
  isLoading: boolean
  isRealData: boolean
}

/**
 * Fetches real products for a catalog, falls back to sample data.
 * Pass `previewProducts` to skip the network request entirely.
 */
export function useCatalogProducts(
  catalogId?: string | undefined,
  previewProducts?: GreetingCatalogProduct[] | undefined
): UseCatalogProductsResult {
  const [loadedProducts, setLoadedProducts] = useState<GreetingCatalogProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (previewProducts && previewProducts.length > 0) {
      setLoadedProducts(previewProducts)
      return
    }
    if (!catalogId) return

    let cancelled = false
    setIsLoading(true)
    fetch(`/api/v1/greeting-card/catalogs/${catalogId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.data?.items) return
        type RawItem = {
          product: {
            id: string
            name: string
            code?: string
            masterImageUrl?: string
            price_vnd?: number | null
            description?: string | null
            flowers_summary?: string | null
            style?: string | null
            meaning?: string | null
            variants?: Array<{ price_vnd?: number | null }>
          }
          sort_order: number
        }
        const mapped: GreetingCatalogProduct[] = (json.data.items as RawItem[]).map(
          (item, idx) => {
            const p = item.product
            const price = p.price_vnd ?? p.variants?.[0]?.price_vnd ?? 0
            return {
              id: p.id,
              name: p.name,
              code: p.code || `SP-${idx + 1}`,
              price: Number(price) || 0,
              imageUrl: p.masterImageUrl || "",
              description: p.description || "",
              flowersSummary: p.flowers_summary || "",
              style: p.style || "Thiết Kế",
              meaning: p.meaning || "",
              sortOrder: item.sort_order ?? idx + 1,
            }
          }
        )
        if (mapped.length > 0 && !cancelled) setLoadedProducts(mapped)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [catalogId, previewProducts])

  const products =
    loadedProducts.length > 0
      ? loadedProducts
      : previewProducts && previewProducts.length > 0
        ? previewProducts
        : SAMPLE_PRODUCTS

  return {
    products,
    isLoading,
    isRealData: loadedProducts.length > 0,
  }
}
