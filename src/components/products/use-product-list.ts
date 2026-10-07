"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

const PAGE_SIZE = "50"
const SEARCH_DEBOUNCE_MS = 300

type Page<T> = { data: T[]; next_cursor: string | null }

/**
 * Danh sách sản phẩm phía server: tìm kiếm (debounce 300ms) + danh mục + "tải thêm" theo cursor.
 * Mỗi lần tải mới huỷ yêu cầu cũ (AbortController) — gõ nhanh không bị kết quả cũ ghi đè kết quả mới.
 */
export function useProductList<T extends { id: string }>(search: string, category: string | null) {
  const router = useRouter()
  const [items, setItems] = useState<T[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [debounced, setDebounced] = useState(search)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [search])

  const buildUrl = useCallback((cursor?: string | null) => {
    const params = new URLSearchParams({ limit: PAGE_SIZE })
    if (debounced.trim()) params.set("search", debounced.trim())
    if (category) params.set("category", category)
    if (cursor) params.set("cursor", cursor)
    return `/api/v1/products?${params.toString()}`
  }, [debounced, category])

  const fetchPage = useCallback(async (cursor: string | null): Promise<Page<T> | null> => {
    controller.current?.abort()
    const ctrl = new AbortController()
    controller.current = ctrl
    const res = await fetch(buildUrl(cursor), { signal: ctrl.signal })
    if (res.status === 401) {
      router.push("/dang-nhap" as never)
      return null
    }
    if (!res.ok) throw new Error(`Không tải được danh sách (${res.status})`)
    return (await res.json()) as Page<T>
  }, [buildUrl, router])

  const reload = useCallback(async () => {
    setError(null)
    setItems(null)
    setNextCursor(null)
    try {
      const page = await fetchPage(null)
      if (!page) return
      setItems(page.data)
      setNextCursor(page.next_cursor)
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      setError(e instanceof Error ? e.message : "Không tải được danh sách sản phẩm")
    }
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const page = await fetchPage(nextCursor)
      if (!page) return
      setItems((prev) => [...(prev ?? []), ...page.data])
      setNextCursor(page.next_cursor)
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setError("Không tải thêm được, vui lòng thử lại")
    } finally {
      setLoadingMore(false)
    }
  }, [fetchPage, nextCursor, loadingMore])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu từ API khi đổi tìm kiếm/danh mục; setState nằm trong hàm tải (nợ #149)
    void reload()
    return () => controller.current?.abort()
  }, [reload])

  const removeLocal = useCallback((id: string) => setItems((prev) => (prev ? prev.filter((p) => p.id !== id) : prev)), [])

  return { items, error, nextCursor, loadingMore, reload, loadMore, removeLocal }
}
