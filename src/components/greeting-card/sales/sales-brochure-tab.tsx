"use client"

import React, { useState } from "react"
import { Plus, RefreshCw, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApi, usePagedList } from "@/components/greeting-card/greeting-api"
import { SalesFunnelStats } from "./sales-funnel-stats"
import { ChannelFunnelStats } from "./channel-funnel-stats"
import { SalesSessionTable } from "./sales-session-table"
import { SalesCreateLinkModal } from "./sales-create-link-modal"
import type { CatalogOption, SessionRow } from "./sales-types"

interface SalesBrochureTabProps {
  initialOpenCreate?: boolean
  onNavigateToCatalog?: () => void
}

/** Tab Sale: tạo link chào khách, theo dõi phản hồi, hiệu quả theo nhân viên. */
export function SalesBrochureTab({ initialOpenCreate = false, onNavigateToCatalog }: SalesBrochureTabProps = {}) {
  const [isModalOpen, setIsModalOpen] = useState(initialOpenCreate)
  const sessions = usePagedList<SessionRow>("/api/v1/greeting-card/send-links")
  const catalogs = useApi<{ data: CatalogOption[] }>("/api/v1/greeting-card/catalogs")
  const catalogList = catalogs.data?.data ?? []

  const emptyState = (
    <div className="p-10 text-center text-text-muted flex flex-col items-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mb-3 text-text-muted">
        <Send size={28} />
      </div>
      <p className="text-body font-bold text-foreground">Chưa có link Thẻ chào nào được tạo</p>
      {catalogList.length === 0 ? (
        <div className="mt-2 flex flex-col items-center gap-3">
          <p className="text-body-sm text-text-muted">
            Bạn cần tạo ít nhất 1 Bộ Sưu Tập mẫu hoa trước khi có thể sinh link gửi chào hàng cho khách.
          </p>
          {onNavigateToCatalog && (
            <Button type="button" variant="outline" size="sm" onClick={onNavigateToCatalog} className="font-bold text-body-sm h-9">
              Đến trang tạo Bộ Sưu Tập
            </Button>
          )}
        </div>
      ) : (
        <p className="text-body-sm text-text-muted mt-1">
          Nhấn nút &ldquo;Tạo Thẻ Chào Mới&rdquo; ở trên để chọn mẫu hoa và sinh link gửi khách hàng.
        </p>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-title font-extrabold text-foreground flex items-center gap-2">
            <span>Thẻ Chào & Link Chào Khách</span>
            <span className="text-caption px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Kênh Bán Hàng</span>
          </h2>
          <p className="text-body-sm text-text-muted mt-1">
            Tạo link bộ sưu tập mẫu hoa gửi riêng cho khách hàng, theo dõi trực tiếp lượt xem và đơn chốt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void sessions.refresh()} className="gap-1.5 text-caption h-9">
            <RefreshCw size={14} className={sessions.isLoading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white font-bold gap-1.5 text-body-sm h-9 shadow-sm"
          >
            <Plus size={16} />
            <span>Tạo Thẻ Chào Mới</span>
          </Button>
        </div>
      </div>

      <SalesFunnelStats />
      <ChannelFunnelStats />

      <section className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-body font-extrabold text-foreground">Danh sách Link Thẻ Chào Đã Tạo</h3>
          <span className="text-caption text-text-muted">Mới nhất trước</span>
        </div>
        {sessions.error ? (
          <p role="alert" className="p-4 text-body-sm text-danger">{sessions.error.message}</p>
        ) : sessions.isLoading ? (
          <div className="p-4 flex flex-col gap-2" aria-busy="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-surface-muted animate-pulse" />)}
          </div>
        ) : (
          <SalesSessionTable
            sessions={sessions.items}
            hasMore={sessions.hasMore}
            isLoadingMore={sessions.isLoadingMore}
            onLoadMore={() => void sessions.loadMore()}
            onChanged={() => void sessions.refresh()}
            emptyState={emptyState}
          />
        )}
      </section>

      {isModalOpen && (
        <SalesCreateLinkModal
          catalogs={catalogList}
          onClose={() => setIsModalOpen(false)}
          onCreated={() => void sessions.refresh()}
          onNavigateToCatalog={onNavigateToCatalog}
        />
      )}
    </div>
  )
}
