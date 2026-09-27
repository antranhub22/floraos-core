"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Search, ChevronRight, Sparkles, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FlowerPlaceholder } from "@/components/ui/flower-placeholder"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"

type Product = {
  id: string
  name: string
  code: string
  category: string | null
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
}

function ProductStatusBadge({ status }: { status: Product["status"] }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-0.5 text-caption font-bold text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
        Đang bán
      </span>
    )
  }
  if (status === "ARCHIVED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-2.5 py-0.5 text-caption font-bold text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
        Lưu trữ
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-0.5 text-caption font-bold text-text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-text-muted" aria-hidden="true" />
      Nháp
    </span>
  )
}

export default function SanPhamPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [tuKhoa, setTuKhoa] = useState("")

  useEffect(() => {
    let huy = false
    async function napLai() {
      try {
        const res = await fetch("/api/v1/products?limit=50")
        if (res.status === 401) {
          router.push("/dang-nhap" as never)
          return
        }
        if (!res.ok) throw new Error(`Không tải được danh sách (${res.status})`)
        const data = (await res.json()) as { data: Product[] }
        if (!huy) setProducts(data.data)
      } catch (e) {
        if (!huy) setLoi(e instanceof Error ? e.message : "Không tải được danh sách sản phẩm")
      }
    }
    napLai()
    return () => {
      huy = true
    }
  }, [router])

  const hien = (products ?? []).filter((p) =>
    tuKhoa.trim() === "" ? true : (p.name + p.code).toLowerCase().includes(tuKhoa.trim().toLowerCase())
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-4">
        <div>
          <div className="text-caption text-text-muted">Danh mục sản phẩm cửa hàng</div>
          <h1 className="text-title font-extrabold text-primary">Sản phẩm</h1>
        </div>
        <Button size="sm" onClick={() => router.push("/tai-anh" as never)} className="flex items-center gap-1.5">
          <Plus size={16} strokeWidth={2.2} />
          Thêm sản phẩm
        </Button>
      </header>

      <main className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
        {loi && (
          <div className="rounded-xl border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-body-sm font-medium text-danger">
            {loi}
          </div>
        )}

        <div className="relative">
          <Search size={16} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm theo tên sản phẩm hoặc mã..."
            className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>

        {products === null ? (
          <div className="py-4">
            <SkeletonBlock lines={5} />
          </div>
        ) : hien.length === 0 ? (
          <EmptyState
            title={products.length === 0 ? "Chưa có sản phẩm nào" : "Không tìm thấy sản phẩm phù hợp"}
            reason={
              products.length === 0
                ? "Bắt đầu tạo mẫu sản phẩm đầu tiên bằng cách tải ảnh lên để AI phân tích cấu phần."
                : "Thử tìm kiếm với từ khoá hoặc mã sản phẩm khác."
            }
            action={
              products.length === 0
                ? {
                    label: "Thêm sản phẩm mới",
                    onClick: () => router.push("/tai-anh" as never),
                  }
                : undefined
            }
          />
        ) : (
          <>
            {/* Chế độ danh sách thẻ trên Mobile (390px) */}
            <div className="flex flex-col gap-2.5 md:hidden">
              {hien.map((p) => (
                <Link
                  key={p.id}
                  href={`/san-pham/${p.id}` as never}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5 transition-colors hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-surface-alt text-secondary">
                      <FlowerPlaceholder size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-body-sm font-semibold text-text">{p.name}</div>
                      <div className="truncate text-caption text-text-muted">
                        Mã: {p.code}
                        {p.category ? ` · ${p.category}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <ProductStatusBadge status={p.status} />
                    <ChevronRight size={16} className="text-text-muted" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Chế độ Bảng dữ liệu trên Desktop (1280px / md+) */}
            <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
              <table className="w-full text-left text-body-sm">
                <thead className="border-b border-border bg-surface-alt text-caption font-bold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3">Sản phẩm</th>
                    <th scope="col" className="px-4 py-3">Mã</th>
                    <th scope="col" className="px-4 py-3">Danh mục</th>
                    <th scope="col" className="px-4 py-3">Trạng thái</th>
                    <th scope="col" className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {hien.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-alt/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-text">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-alt text-secondary">
                            <FlowerPlaceholder size={18} />
                          </div>
                          <span className="truncate">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-caption text-text-muted">{p.code}</td>
                      <td className="px-4 py-3 text-caption text-text">{p.category ?? "—"}</td>
                      <td className="px-4 py-3">
                        <ProductStatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/san-pham/${p.id}` as never)}
                            className="flex items-center gap-1 text-caption font-semibold"
                          >
                            <Eye size={14} />
                            Chi tiết
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/san-pham/${p.id}/tinh-nang` as never)}
                            className="flex items-center gap-1 text-caption font-semibold"
                          >
                            <Sparkles size={14} />
                            Tính năng
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
