"use client"

import { useCallback, useEffect, useState } from "react"

export interface CatalogOption {
  id: string
  name: string
  code: string
  itemCount: number
}

type CatalogListResponse = {
  data?: Array<{ id: string; name: string; code: string; _count?: { items: number } }>
}

const CATALOG_API = "/api/v1/greeting-card/catalogs"

/** Chuẩn hóa mã link: chữ thường, chỉ a-z, 0-9 và dấu gạch ngang. */
export function normalizeLinkCode(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/** Đường dẫn công khai của bộ sưu tập; rỗng khi chưa biết slug cửa hàng. */
export function catalogPublicPath(orgSlug: string, catalog: CatalogOption): string {
  if (orgSlug && catalog.code) return `bst/${orgSlug}/${catalog.code}`
  return `g/${catalog.id}`
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const json = (await res.json()) as { error?: { message?: string } | string }
    if (typeof json.error === "string") return json.error
    return json.error?.message ?? fallback
  } catch {
    return fallback
  }
}

/** Dữ liệu và thao tác bộ sưu tập dùng cho luồng gửi thẻ chào. */
export function useJourneyCatalogs() {
  const [catalogs, setCatalogs] = useState<CatalogOption[]>([])
  const [orgSlug, setOrgSlug] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchList = useCallback(async (): Promise<CatalogOption[]> => {
    try {
      const res = await fetch(CATALOG_API)
      if (!res.ok) throw new Error(await readError(res, "Không tải được danh sách bộ sưu tập."))
      const json = (await res.json()) as CatalogListResponse
      const list = (json.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        itemCount: c._count?.items ?? 0,
      }))
      setCatalogs(list)
      setLoadError(null)
      return list
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Không tải được danh sách bộ sưu tập.")
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const reload = useCallback(async (): Promise<CatalogOption[]> => {
    setLoading(true)
    return fetchList()
  }, [fetchList])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu từ API khi mount; setState chỉ chạy sau await trong hàm tải
    void fetchList()
    void (async () => {
      try {
        const res = await fetch("/api/v1/organizations/current")
        if (!res.ok) return
        const data = (await res.json()) as { slug?: string }
        if (data.slug) setOrgSlug(data.slug)
      } catch {
        // Không có slug → dùng link dạng g/<id>
      }
    })()
  }, [fetchList])

  const createCatalog = useCallback(
    async (input: { name: string; code?: string; productIds?: string[] }): Promise<string> => {
      const code = normalizeLinkCode(input.code ?? "") || `bst-${Date.now().toString(36)}`
      const res = await fetch(CATALOG_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name.trim(),
          code,
          type: "STANDARD",
          ...(input.productIds ? { productIds: input.productIds } : {}),
        }),
      })
      if (!res.ok) throw new Error(await readError(res, "Không tạo được bộ sưu tập. Mã link có thể đã được dùng."))
      const json = (await res.json()) as { data?: { id: string } }
      if (!json.data?.id) throw new Error("Máy chủ không trả về bộ sưu tập vừa tạo.")
      await reload()
      return json.data.id
    },
    [reload],
  )

  const cloneCatalog = useCallback(
    async (sourceId: string, input: { name: string; code: string }) => {
      const res = await fetch(`${CATALOG_API}/${sourceId}`)
      if (!res.ok) throw new Error(await readError(res, "Không đọc được mẫu hoa của bộ sưu tập gốc."))
      const json = (await res.json()) as { data?: { items?: Array<{ product: { id: string } }> } }
      const productIds = json.data?.items?.map((item) => item.product.id) ?? []
      const id = await createCatalog({ ...input, productIds })
      return { id, itemCount: productIds.length }
    },
    [createCatalog],
  )

  const createSendLink = useCallback(
    async (input: { catalogId: string; customerName: string; customerPhone: string }) => {
      const res = await fetch("/api/v1/greeting-card/send-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogId: input.catalogId,
          customerName: input.customerName.trim() || undefined,
          customerPhone: input.customerPhone.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error(await readError(res, "Không tạo được link gửi khách. Vui lòng thử lại."))
      const json = (await res.json()) as { data?: { sendCode: string; shareUrl: string } }
      if (!json.data) throw new Error("Máy chủ không trả về link gửi khách.")
      return json.data
    },
    [],
  )

  return { catalogs, setCatalogs, orgSlug, loading, loadError, reload, createCatalog, cloneCatalog, createSendLink }
}
