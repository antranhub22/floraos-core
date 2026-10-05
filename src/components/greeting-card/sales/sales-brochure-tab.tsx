"use client"

import React, { useState, useEffect } from "react"
import { Plus, Copy, Check, ExternalLink, RefreshCw, Send, Users, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { readApiError } from "@/components/greeting-card/api-error"

interface CatalogOption {
  id: string
  name: string
  code: string
}

interface SessionRow {
  id: string
  send_code: string
  customer_name: string | null
  customer_phone: string | null
  status: string
  order_id?: string | null
  last_active_at: string
  catalog: { id: string; name: string; code: string }
  order: { id: string; code: string; status: string; total_vnd: number; paid_vnd: number } | null
}

interface SalesBrochureTabProps {
  initialOpenCreate?: boolean
  onNavigateToCatalog?: () => void
}

export function SalesBrochureTab({
  initialOpenCreate = false,
  onNavigateToCatalog,
}: SalesBrochureTabProps = {}) {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [catalogs, setCatalogs] = useState<CatalogOption[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Modal create state
  const [isModalOpen, setIsModalOpen] = useState(initialOpenCreate)
  const [selectedCatalogId, setSelectedCatalogId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [createdLink, setCreatedLink] = useState<string | null>(null)

  function loadData() {
    setLoading(true)
    Promise.all([
      fetch("/api/v1/greeting-card/send-links").then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/v1/greeting-card/catalogs").then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([sessionsRes, catalogsRes]) => {
        if (sessionsRes.data) setSessions(sessionsRes.data)
        if (catalogsRes.data) {
          setCatalogs(catalogsRes.data)
          if (catalogsRes.data.length > 0) setSelectedCatalogId(catalogsRes.data[0].id)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  function copyToClipboard(url: string, code: string) {
    const fullUrl = `${window.location.origin}${url}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  async function handleCreateLink(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch("/api/v1/greeting-card/send-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogId: selectedCatalogId || undefined,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
        }),
      })
      if (!res.ok) {
        setCreateError(await readApiError(res, "Không tạo được link chào khách"))
        return
      }
      const json = await res.json()
      if (json.data?.shareUrl) {
        setCreatedLink(`${window.location.origin}${json.data.shareUrl}`)
        loadData()
      }
    } catch {
      setCreateError("Mất kết nối mạng, vui lòng thử lại")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {createError && (
        <div role="alert" className="p-3 rounded-xl bg-danger-bg text-danger text-body-sm font-medium">
          {createError}
        </div>
      )}
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-title font-extrabold text-foreground flex items-center gap-2">
            <span>Thẻ Chào & Link Chào Khách</span>
            <span className="text-caption px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              Kênh Bán Hàng
            </span>
          </h2>
          <p className="text-body-sm text-text-muted mt-1">
            Tạo link bộ sưu tập mẫu hoa gửi riêng cho khách hàng, theo dõi trực tiếp lượt xem và đơn chốt
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadData}
            className="gap-1.5 text-caption h-9"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              setCreatedLink(null)
              setIsModalOpen(true)
            }}
            className="bg-primary hover:bg-primary-dark text-white font-bold gap-1.5 text-body-sm h-9 shadow-sm"
          >
            <Plus size={16} />
            <span>Tạo Thẻ Chào Mới</span>
          </Button>
        </div>
      </div>

      {/* Metrics overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Send size={20} />
          </div>
          <div>
            <div className="text-caption text-text-muted font-medium">Tổng link đã gửi</div>
            <div className="text-title font-extrabold text-foreground">{sessions.length}</div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="text-caption text-text-muted font-medium">Khách đang xem / chọn</div>
            <div className="text-title font-extrabold text-foreground">
              {sessions.filter((s) => s.status === "OPENED" || s.status === "BROWSING" || s.status === "SELECTED").length}
            </div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-border flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-success-bg text-success flex items-center justify-center shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <div className="text-caption text-text-muted font-medium">Đơn hàng đã đặt</div>
            <div className="text-title font-extrabold text-foreground">
              {sessions.filter((s) => s.order_id !== null).length}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-body font-extrabold text-foreground">
            Danh sách Link Thẻ Chào Đã Tạo
          </h3>
          <span className="text-caption text-text-muted">
            Hiển thị {sessions.length} lượt gửi gần nhất
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="p-10 text-center text-text-muted flex flex-col items-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mb-3 text-text-muted">
              <Send size={28} />
            </div>
            <p className="text-body font-bold text-foreground">Chưa có link Thẻ chào nào được tạo</p>
            {catalogs.length === 0 ? (
              <div className="mt-2 flex flex-col items-center gap-3">
                <p className="text-body-sm text-text-muted">
                  Bạn cần tạo ít nhất 1 Bộ Sưu Tập mẫu hoa trước khi có thể sinh link gửi chào hàng cho khách.
                </p>
                {onNavigateToCatalog && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onNavigateToCatalog}
                    className="font-bold text-body-sm h-9 gap-1.5"
                  >
                    <span>Đến trang tạo Bộ Sưu Tập</span>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-body-sm text-text-muted mt-1">
                Nhấn nút &ldquo;Tạo Thẻ Chào Mới&rdquo; ở trên để chọn mẫu hoa và sinh link gửi khách hàng.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-muted text-text-muted text-caption uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-3">Mã gửi (Send Code)</th>
                  <th className="px-4 py-3">Bộ sưu tập</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Trạng thái tương tác</th>
                  <th className="px-4 py-3">Đơn hàng</th>
                  <th className="px-4 py-3 text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((row) => {
                  const shareUrl = `/b/${row.send_code}`
                  const isCopied = copiedCode === row.send_code

                  return (
                    <tr key={row.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">
                        {row.send_code}
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">
                        {row.catalog.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {row.customer_name || "Khách chưa đặt tên"}
                        </div>
                        {row.customer_phone && (
                          <div className="text-caption text-text-muted">{row.customer_phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.status === "CREATED" && (
                          <span className="px-2.5 py-1 rounded-full text-caption font-bold bg-surface-muted text-text-muted">
                            Chưa mở link
                          </span>
                        )}
                        {(row.status === "OPENED" || row.status === "BROWSING") && (
                          <span className="px-2.5 py-1 rounded-full text-caption font-bold bg-warning/15 text-warning">
                            Đang xem mẫu hoa
                          </span>
                        )}
                        {row.status === "SELECTED" && (
                          <span className="px-2.5 py-1 rounded-full text-caption font-bold bg-primary/10 text-primary">
                            Đã chọn mẫu hoa
                          </span>
                        )}
                        {row.status === "ORDER_SUBMITTED" && (
                          <span className="px-2.5 py-1 rounded-full text-caption font-bold bg-info-bg text-info">
                            Đã tạo đơn hàng
                          </span>
                        )}
                        {row.status === "PAYMENT_REPORTED" && (
                          <span className="px-2.5 py-1 rounded-full text-caption font-bold bg-warning-bg text-warning">
                            Khách báo đã chuyển tiền
                          </span>
                        )}
                        {row.status === "COMPLETED" && (
                          <span className="px-2.5 py-1 rounded-full text-caption font-bold bg-success-bg text-success">
                            Đã xác nhận thanh toán
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.order ? (
                          <div>
                            <div className="font-bold text-primary">{row.order.code}</div>
                            <div className="text-caption text-text-muted">
                              {row.order.total_vnd.toLocaleString("vi-VN")} đ
                            </div>
                          </div>
                        ) : (
                          <span className="text-caption text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(shareUrl, row.send_code)}
                            className="h-8 px-2.5 text-caption gap-1"
                          >
                            {isCopied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                            <span>{isCopied ? "Đã copy" : "Copy link"}</span>
                          </Button>
                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border hover:bg-surface-muted text-text-muted hover:text-foreground"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create Link */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-border p-6 shadow-xl flex flex-col gap-4">
            <h3 className="text-title font-extrabold text-foreground">
              Tạo Thẻ Chào Gửi Khách Hàng
            </h3>

            {createdLink ? (
              <div className="flex flex-col gap-3 py-2">
                <div className="p-3 bg-success-bg border border-success/30 rounded-xl text-success text-body-sm font-bold flex items-center gap-2">
                  <Check size={18} />
                  <span>Đã tạo link Thẻ chào thành công!</span>
                </div>
                <div className="p-3 bg-surface-muted rounded-xl border border-border text-body-sm font-mono break-all">
                  {createdLink}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(createdLink)
                    setCopiedCode("created")
                  }}
                  className="w-full hover:bg-primary/10 font-bold h-11 gap-1.5"
                >
                  {copiedCode === "created" ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedCode === "created" ? "Đã copy vào bộ nhớ tạm" : "Copy link gửi khách"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full h-10"
                >
                  Đóng
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateLink} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-caption font-bold text-foreground mb-1">
                    Chọn Bộ sưu tập / Catalog *
                  </label>
                  {catalogs.length === 0 ? (
                    <div className="p-3 bg-warning-bg/50 border border-warning/30 rounded-xl flex flex-col gap-2">
                      <p className="text-body-sm text-text">
                        Chưa có bộ sưu tập nào. Cần tạo bộ sưu tập mẫu hoa trước!
                      </p>
                      {onNavigateToCatalog && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsModalOpen(false)
                            onNavigateToCatalog()
                          }}
                          className="text-primary font-bold text-body-sm underline text-left"
                        >
                          → Đến trang tạo Bộ Sưu Tập ngay
                        </button>
                      )}
                    </div>
                  ) : (
                    <select
                      value={selectedCatalogId}
                      onChange={(e) => setSelectedCatalogId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground"
                    >
                      {catalogs.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-caption font-bold text-foreground mb-1">
                    Tên khách hàng (không bắt buộc)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Anh Minh"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-caption font-bold text-foreground mb-1">
                    Số điện thoại khách (không bắt buộc)
                  </label>
                  <input
                    type="tel"
                    placeholder="VD: 0901234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="h-10"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={creating}
                    className="bg-primary hover:bg-primary-dark text-white font-bold h-10 px-4"
                  >
                    {creating ? "Đang tạo..." : "Tạo Link Ngay"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
