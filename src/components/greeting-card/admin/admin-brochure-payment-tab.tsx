"use client"

import React, { useState } from "react"
import { RefreshCw, Settings, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApi, usePagedList } from "@/components/greeting-card/greeting-api"
import { parsePaymentPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"
import { UnmatchedPaymentsPanel } from "./unmatched-payments-panel"
import { AdminOrderTable } from "./admin-order-table"
import { AdminOrderActionDialog } from "./admin-order-action-dialog"
import { AdminSettingsDrawer } from "./admin-settings-drawer"
import { ORDER_FILTERS, type ActionResult, type AdminOrder, type OrderAction, type OrderFilterId } from "./admin-order-types"
import { CopyCustomerMessage } from "./copy-customer-message"

/** Tab Điều hành: việc cần chủ tiệm quyết (thu tiền, báo giá, tiền chưa khớp); cài đặt nằm trong ngăn riêng. */
export function AdminBrochurePaymentTab() {
  const [filter, setFilter] = useState<OrderFilterId>("outstanding")
  const [action, setAction] = useState<OrderAction | null>(null)
  const [notice, setNotice] = useState<ActionResult | null>(null)
  const [search, setSearch] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Tìm theo mã đơn / mã link / SĐT khách bỏ qua bộ lọc — để đối chiếu nội dung chuyển khoản trên sao kê
  const term = search.trim()
  const query = term.length >= 3 ? `q=${encodeURIComponent(term)}` : ORDER_FILTERS.find((f) => f.id === filter)?.query ?? ""
  const orders = usePagedList<AdminOrder>(`/api/v1/greeting-card/orders${query ? `?${query}` : ""}`)
  const org = useApi<{ settings?: Record<string, unknown> | null }>("/api/v1/organizations/current")
  const policy = parsePaymentPolicy(org.data?.settings)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-title font-extrabold text-foreground flex items-center gap-2">
            <span>Việc chờ bạn quyết</span>
          </h2>
          <p className="text-body-sm text-text-muted mt-1">
            Đối chiếu tiền khách chuyển với giá bán rồi xác nhận, báo giá mẫu chưa niêm yết, huỷ đơn và hoàn tiền
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="gap-1.5 text-caption h-9">
            <Settings size={14} aria-hidden="true" />
            <span>Cài đặt</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void orders.refresh()} className="gap-1.5 text-caption h-9">
            <RefreshCw size={14} className={orders.isLoading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      <UnmatchedPaymentsPanel />

      {notice && (
        <div role="status" className="p-3.5 rounded-xl bg-success-bg border border-success/30 text-success text-body-sm font-bold flex items-center gap-2">
          <ShieldCheck size={20} />
          <span className="flex-1">{notice.message}</span>
          {notice.customerMessage && <CopyCustomerMessage text={notice.customerMessage} />}
        </div>
      )}

      <section className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-2" role="tablist" aria-label="Lọc đơn">
          {ORDER_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 h-8 rounded-lg text-caption font-bold border ${
                filter === f.id ? "bg-primary text-white border-primary" : "border-border text-text-muted hover:bg-surface-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
          <input
            type="search"
            aria-label="Tìm đơn theo mã hoặc số điện thoại"
            placeholder="Tìm mã đơn / SĐT khách…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto h-8 w-full sm:w-56 rounded-lg border border-border bg-surface px-3 text-caption text-foreground"
          />
        </div>
        {orders.error ? (
          <p role="alert" className="p-4 text-body-sm text-danger">{orders.error.message}</p>
        ) : orders.isLoading ? (
          <div className="p-4 flex flex-col gap-2" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-surface-muted animate-pulse" />)}
          </div>
        ) : orders.items.length === 0 ? (
          <p className="p-8 text-center text-body-sm text-text-muted">Không có đơn nào trong mục này.</p>
        ) : (
          <>
            <AdminOrderTable orders={orders.items} onAction={setAction} shopDepositPercent={policy.depositPercent} />
            {orders.hasMore && (
              <div className="p-3 border-t border-border flex justify-center">
                <Button type="button" variant="outline" size="sm" disabled={orders.isLoadingMore} onClick={() => void orders.loadMore()}>
                  {orders.isLoadingMore ? "Đang tải..." : "Tải thêm đơn"}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {settingsOpen && <AdminSettingsDrawer onClose={() => setSettingsOpen(false)} />}

      {action && (
        <AdminOrderActionDialog
          action={action}
          policy={policy}
          onClose={() => setAction(null)}
          onDone={(result) => {
            setAction(null)
            setNotice(result)
            void orders.refresh()
          }}
        />
      )}
    </div>
  )
}
