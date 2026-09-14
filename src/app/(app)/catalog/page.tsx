"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, ArrowLeft, AlertTriangle, QrCode, Globe, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TabActionHeader } from "@/components/ui/tab-header"

type Product = {
  id: string
  name: string
  code: string
  category: string
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
}

type CatalogLink = {
  slug: string
  name: string
  description: string | null
  filters: Record<string, unknown>
  revoked_at: string | null
  created_at: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export default function CatalogWebsitePage() {
  const router = useRouter()
  const [tab, setTab] = useState<"catalog" | "landing">("catalog")
  const [, setSaved] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filterCategory, setFilterCategory] = useState<string>("Tất cả")
  const [savedQR, setSavedQR] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [catalogLinks, setCatalogLinks] = useState<CatalogLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingLink, setCreatingLink] = useState(false)

  const categories = ["Tất cả", "Bó hoa", "Giỏ hoa", "Hộp hoa", "Bình hoa"]

  const filtered = products.filter((p) =>
    (filterCategory === "Tất cả" || p.category === filterCategory) && p.status === "ACTIVE"
  )

  function toggleSelect(id: string) {
    setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))
  }

  const fetchProducts = useCallback(async () => {
      try {
        const res = await fetch("/api/v1/products")
        if (res.status === 401) {
          router.push("/dang-nhap")
          return
        }
        if (!res.ok) throw new Error("Không thể tải sản phẩm")
        const data = await res.json()
        setProducts(data.data || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi không xác định")
      } finally {
        setLoading(false)
      }
    }, [router])

    const fetchCatalogLinks = useCallback(async () => {
      try {
        const res = await fetch("/api/v1/catalog-links?include_revoked=true")
        if (res.status === 401) {
          router.push("/dang-nhap")
          return
        }
        if (!res.ok) throw new Error("Không thể tải danh sách catalog")
        const data = await res.json()
        setCatalogLinks(data.data || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi không xác định")
      }
    }, [router])

    const createCatalogLink = useCallback(async () => {
      if (selectedIds.length === 0) return
      setCreatingLink(true)
      try {
        const selectedProducts = products.filter((p) => selectedIds.includes(p.id))
        const name = `Catalog ${new Date().toLocaleDateString("vi-VN")}`
        const slug = slugify(name)
        const res = await fetch("/api/v1/catalog-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            name,
            description: `Catalog tự động với ${selectedProducts.length} sản phẩm`,
            filters: { product_ids: selectedIds },
          }),
        })
        if (res.status === 401) {
          router.push("/dang-nhap")
          return
        }
        if (!res.ok) throw new Error("Không thể tạo catalog link")
        setSaved(true)
        setSavedQR(true)
        setTimeout(() => {
          setSaved(false)
          setSavedQR(false)
        }, 2000)
        fetchCatalogLinks()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi không xác định")
      } finally {
        setCreatingLink(false)
      }
    }, [selectedIds, products, router, fetchCatalogLinks])

    useEffect(() => {
      const loadData = async () => {
        await fetchProducts()
        await fetchCatalogLinks()
      }
      loadData()
    }, [fetchProducts, fetchCatalogLinks])

  if (loading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
          <div>
            <div className="text-xs text-text-muted">M06 + M05</div>
            <div className="text-[17px] font-extrabold text-primary">Catalog & Website</div>
          </div>
          <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-1.5">
            <ArrowLeft size={16} strokeWidth={2} /> Quay về Trang chủ
          </Button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="mt-4 text-text-muted">Đang tải sản phẩm...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">M06 + M05</div>
          <div className="text-[17px] font-extrabold text-primary">Catalog & Website</div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-1.5">
          <ArrowLeft size={16} strokeWidth={2} /> Quay về Trang chủ
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-[18px]">
        {error && (
          <div className="rounded-lg bg-destructive-bg px-4 py-2 text-[13px] text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle size={16} strokeWidth={2} />
            {error}
          </div>
        )}

        <div className="mb-5">
          <TabActionHeader
            tabs={[
              { id: "catalog", label: "Catalog số trực tuyến", icon: BookOpen, badge: `${filtered.length} SP`, badgeTone: "neutral" },
              { id: "landing", label: "Landing page chiến dịch", icon: Globe, badge: "M05", badgeTone: "accent" },
            ]}
            activeTab={tab}
            onTabChange={(id) => setTab(id as "catalog" | "landing")}
            primaryActions={
              tab === "catalog"
                ? [
                    {
                      id: "publish-qr",
                      label: creatingLink ? "Đang tạo..." : "Xuất bản & Sinh QR",
                      icon: QrCode,
                      variant: "primary",
                      disabled: creatingLink || selectedIds.length === 0,
                      onClick: createCatalogLink,
                    },
                  ]
                : []
            }
            overflowActions={[
              {
                id: "preview-catalog",
                label: "Xem trước catalog mới nhất",
                onClick: () => {
                  const latest = catalogLinks[0]
                  if (latest) {
                    alert(`Xem trước tại: /c/${latest.slug} (link công khai, không cần đăng nhập)`)
                  } else {
                    alert("Chưa có catalog nào được xuất bản. Hãy chọn sản phẩm rồi bấm 'Xuất bản & Sinh QR'.")
                  }
                },
              },
            ]}
          />
        </div>

        {tab === "catalog" && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">① Catalog số</div>
              <div className="mt-1 text-[13px] text-text-muted">Tự động liệt kê sản phẩm đã duyệt — không cần nhập liệu thủ công</div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {categories.map((c) => (
                <Button key={c} size="sm" variant={filterCategory === c ? "primary" : "ghost"} onClick={() => setFilterCategory(c)}>{c}</Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filtered.map((p) => (
                <Card key={p.id} className={`flex items-center gap-3 ${selectedIds.includes(p.id) ? "border-primary" : ""}`}>
                  <input type="checkbox" checked={selectedIds.includes(p.id)}
                    onChange={() => toggleSelect(p.id)} className="h-4 w-4 accent-primary" />
                  <div className="flex-1">
                    <div className="text-[14px] font-bold">{p.name}</div>
                    <div className="text-[12px] text-text-muted">{p.category} · {p.code}</div>
                  </div>
                  <Badge tone="success">Đã duyệt</Badge>
                </Card>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-2 text-center text-text-muted py-8">
                  Không có sản phẩm nào đang hoạt động trong danh mục này
                </div>
              )}
            </div>

            <div className="flex items-center justify-between w-full max-w-3xl border-t border-border pt-5">
              <Button variant="ghost" onClick={() => {
                const latest = catalogLinks[0]
                if (latest) {
                  alert(`Xem trước tại: /c/${latest.slug} (link công khai, không cần đăng nhập)`)
                } else {
                  alert("Chưa có catalog nào được xuất bản. Hãy bấm 'Duyệt xuất bản + Sinh QR' trước.")
                }
              }}>
                Xem trước catalog
              </Button>
              <Button onClick={createCatalogLink} disabled={creatingLink || selectedIds.length === 0} className="flex items-center gap-2">
                {creatingLink ? "Đang tạo..." : "Duyệt xuất bản + Sinh QR"}
                <QrCode size={16} strokeWidth={2} />
              </Button>
            </div>

            {savedQR && (
              <div className="rounded-lg bg-success-bg px-4 py-2 text-[12.5px] font-medium text-secondary">
                Đã lưu — mã QR để tải/in đã sẵn sàng.
              </div>
            )}

            {catalogLinks.length > 0 && (
              <div className="border-t border-border pt-5">
                <div className="text-[14px] font-bold mb-3">Danh sách catalog đã xuất bản</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {catalogLinks.map((link) => (
                    <div key={link.slug} className="flex items-center justify-between p-3 rounded-lg bg-surface border">
                      <div>
                        <div className="font-medium">{link.name}</div>
                        <div className="text-[12px] text-text-muted">Slug: {link.slug} · {new Date(link.created_at).toLocaleString("vi-VN")}</div>
                        {link.revoked_at && <div className="text-[12px] text-destructive">Đã thu hồi: {new Date(link.revoked_at).toLocaleString("vi-VN")}</div>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => alert(`Link công khai: /c/${link.slug}`)}>Xem trước</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "landing" && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">① Landing page chiến dịch</div>
              <div className="mt-1 text-[13px] text-text-muted">Chọn dịp → chọn sản phẩm → dựng trang → duyệt</div>
            </div>

            <Card className="w-full max-w-md p-5 flex flex-col gap-3">
              <div className="text-[14px] font-bold">Chọn dịp</div>
              {["20/10", "Valentine", "8/3", "Ngày của Mẹ", "Khai trương", "Hoa cưới"].map((occ) => (
                <label key={occ} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="occasion" className="accent-primary" />
                  <span className="text-[13px]">{occ}</span>
                </label>
              ))}
              <div className="text-[14px] font-bold mt-2">Chọn sản phẩm đưa vào trang</div>
              {filtered.map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked={selectedIds.includes(p.id)}
                    onChange={() => toggleSelect(p.id)} className="h-4 w-4 accent-primary" />
                  <span className="text-[13px]">{p.name}</span>
                </label>
              ))}
              {filtered.length === 0 && (
                <div className="text-text-muted text-[13px]">Không có sản phẩm hoạt động để chọn</div>
              )}
            </Card>

            <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}>
              <Globe size={16} strokeWidth={2} className="mr-2" /> Dựng trang
            </Button>

            <div className="w-full max-w-3xl border-t border-border pt-5">
              <div className="text-[14px] font-bold mb-2">Xem trước toàn trang</div>
              <div className="grid grid-cols-4 gap-2">
                {selectedIds.map((id) => (
                  <div key={id} className="aspect-[4/3] rounded-lg bg-surface-alt" />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between w-full max-w-3xl border-t border-border pt-5">
              <Button variant="ghost">Xem trước toàn trang</Button>
              <Button className="flex items-center gap-2" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); router.push("/") }}>
                Duyệt xuất bản + Lưu
                <ChevronRight size={16} strokeWidth={2.4} />
              </Button>
            </div>

            {savedQR && (
              <div className="rounded-lg bg-success-bg px-4 py-2 text-[12.5px] font-medium text-secondary">Đã lưu — nhận đường link + mã QR riêng.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}