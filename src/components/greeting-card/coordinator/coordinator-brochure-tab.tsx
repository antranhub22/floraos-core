"use client"

import React, { useState } from "react"
import { RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CoordinatorActionModal } from "./coordinator-action-modal"
import { CoordinatorOrderCard, type BrochureOrder, type ModalState } from "./coordinator-order-card"
import { useApi, usePagedList } from "@/components/greeting-card/greeting-api"
import { parsePaymentPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"

export function CoordinatorBrochureTab() {
  // Chỉ đơn chưa huỷ — bảng xưởng không cần đơn đã huỷ
  const list = usePagedList<BrochureOrder>("/api/v1/greeting-card/orders")
  const orders = list.items.filter((o) => o.status !== "CANCELLED")
  const loading = list.isLoading
  const loadOrders = () => void list.refresh()
  const org = useApi<{ settings?: Record<string, unknown> | null }>("/api/v1/organizations/current")
  const policy = parsePaymentPolicy(org.data?.settings)
  const [modal, setModal] = useState<ModalState>({ type: "none" })
  const openModal = (m: ModalState) => setModal(m)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-title font-extrabold text-foreground flex items-center gap-2">
            <span>Tiếp Nhận Đơn Từ Thẻ Chào</span>
            <span className="text-caption px-2.5 py-0.5 rounded-full bg-info-bg text-info font-bold">
              Điều Phối Xưởng
            </span>
          </h2>
          <p className="text-body-sm text-text-muted mt-1">
            Mỗi tác vụ cập nhật trạng thái đơn — khách tự động nhận thông báo qua link theo dõi
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={loadOrders} className="gap-1.5 text-caption h-9">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center text-text-muted flex flex-col items-center">
          <Sparkles size={36} className="text-primary/40 mb-2" />
          <p className="text-body font-bold text-foreground">Chưa có đơn hàng nào từ Thẻ chào</p>
          <p className="text-caption text-text-muted mt-1">
            Khi khách hoàn tất đặt hoa qua link brochure, đơn sẽ hiển thị ngay tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <CoordinatorOrderCard key={order.id} order={order} policy={policy} onOpen={openModal} />
          ))}
        </div>
      )}
      {list.hasMore && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm" disabled={list.isLoadingMore} onClick={() => void list.loadMore()}>
            {list.isLoadingMore ? "Đang tải..." : "Tải thêm đơn"}
          </Button>
        </div>
      )}

      {/* Modal overlay */}
      {modal.type !== "none" && (
        <CoordinatorActionModal
          key={`${modal.type}:${modal.orderId}`}
          modal={modal}
          onClose={() => setModal({ type: "none" })}
          onDone={() => {
            setModal({ type: "none" })
            loadOrders()
          }}
        />
      )}
    </div>
  )
}
