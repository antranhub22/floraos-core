"use client"

/**
 * Creative Studio — màn hình dashboard core chạy tính năng "Tạo ảnh bằng AI"
 * thuộc SocialFlow M04b (xoá nền, AIC-11) mà KHÔNG chuyển sang UI SocialFlow.
 *
 * Dashboard fetch same-origin `/api/v1/proxy/...?client=SOCIALFLOW`; core làm
 * proxy server-side, forward JWT `floraos_sso` (đọc cookie) sang SocialFlow
 * (`sso_auth.py` verify, `claims.org` là tổ chức). Kết quả hiện ngay trong
 * dashboard — user không bao giờ thấy UI SocialFlow.
 *
 * Xem `src/modules/proxy/` và `src/lib/mock-data.ts` (`ai-image`).
 */

import { useState } from "react"
import { Download, Image as ImageIcon, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type RemoveBackgroundResult = {
  asset_id: string
  product_id: string
  parent_asset_id: string
  storage_key: string
  mime_type: string
  width: number
  height: number
  status: string
  created_at: string
}

export function CreativeStudio() {
  const [productId, setProductId] = useState("")
  const [result, setResult] = useState<RemoveBackgroundResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function removeBackground() {
    if (!productId.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(
        "/api/v1/proxy/api/m04b/background-removal?client=SOCIALFLOW",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ product_id: productId.trim() }),
        }
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error?.message ?? data?.detail ?? `Thất bại (${res.status})`)
        return
      }
      setResult(data as RemoveBackgroundResult)
    } catch {
      setError("Không kết nối được máy chủ")
    } finally {
      setLoading(false)
    }
  }

  function downloadUrl(): string {
    if (!result) return ""
    return `/api/v1/proxy/api/m04b/assets/${result.asset_id}/download?client=SOCIALFLOW`
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">Tạo ảnh bằng AI</div>
          <div className="text-[17px] font-extrabold text-primary">Creative Studio</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
        <Card className="flex flex-col gap-3.5 p-[18px]">
          <div>
            <div className="text-[14.5px] font-bold">Xoá nền sản phẩm (AIC-11)</div>
            <div className="mt-1 text-[13px] text-text-muted">
              Lấy Master Image của sản phẩm từ core, xoá nền bằng SocialFlow
              (rembg + PIL fallback), trả ảnh nền trong dashboard — không cần
              mở app khác.
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-text-muted">
              Product ID
            </label>
            <input
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="VD: 550e8400-e29b-41d4-a716-446655440000"
              className="h-11 w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 text-sm outline-none focus:border-primary"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
              <X size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button onClick={removeBackground} disabled={loading || !productId.trim()}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang xoá nền…
              </>
            ) : (
              <>
                <ImageIcon size={16} />
                Xoá nền
              </>
            )}
          </Button>
        </Card>

        {result && (
          <Card className="flex flex-col gap-3.5 p-[18px]">
            <div className="flex items-center justify-between">
              <div className="text-[14.5px] font-bold">Kết quả</div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                  result.status === "COMPLETED"
                    ? "bg-success-bg text-primary"
                    : "bg-warning-bg text-warning"
                )}
              >
                {result.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[12.5px]">
              <div>
                <div className="text-text-muted">Asset ID</div>
                <div className="truncate font-semibold">{result.asset_id}</div>
              </div>
              <div>
                <div className="text-text-muted">Kích thước</div>
                <div className="font-semibold">
                  {result.width}×{result.height}
                </div>
              </div>
              <div>
                <div className="text-text-muted">Product ID</div>
                <div className="truncate font-semibold">{result.product_id}</div>
              </div>
              <div>
                <div className="text-text-muted">Định dạng</div>
                <div className="font-semibold">{result.mime_type}</div>
              </div>
            </div>

            <a
              href={downloadUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border-[1.5px] border-border px-3.5 py-2.5 text-[13px] font-semibold text-primary hover:bg-surface-alt"
            >
              <Download size={16} />
              Tải ảnh nền ({result.mime_type})
            </a>
          </Card>
        )}
      </div>
    </div>
  )
}