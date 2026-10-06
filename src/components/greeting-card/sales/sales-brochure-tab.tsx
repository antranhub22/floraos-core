"use client"

import React, { useState } from "react"
import { ChevronDown, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApi, usePagedList } from "@/components/greeting-card/greeting-api"
import { WorkItemCard } from "@/components/greeting-card/work/work-item-card"
import { useNow, useWorklist } from "@/components/greeting-card/work/use-worklist"
import { MessageThread } from "@/components/greeting-card/inbox/message-thread"
import { WORK_BUCKET_LABEL, sortWorklist, workBucket, type WorkBucket } from "@/modules/greeting-card/domain/worklist"
import type { TrackingPipelineItem, TrackingPipelineStepId } from "@/modules/greeting-card/domain/tracking-pipeline-types"
import { SalesSessionTable } from "./sales-session-table"
import { SalesCreateLinkModal } from "./sales-create-link-modal"
import type { CatalogOption, SessionRow } from "./sales-types"

interface SalesBrochureTabProps {
  initialOpenCreate?: boolean
  onNavigateToCatalog?: () => void
}

const BUCKETS: WorkBucket[] = ["ACTION", "WAITING_CUSTOMER", "IN_PROGRESS", "DONE"]

/** Tab Sale: trạng thái từng khách của mình là trọng tâm; việc kẹt cần sale tác động lên đầu. */
export function SalesBrochureTab({ initialOpenCreate = false, onNavigateToCatalog }: SalesBrochureTabProps = {}) {
  const [isModalOpen, setIsModalOpen] = useState(initialOpenCreate)
  const [scope, setScope] = useState<"MINE" | "ALL">("MINE")
  const [bucket, setBucket] = useState<WorkBucket | null>(null)
  const [linksOpen, setLinksOpen] = useState(false)
  const [notesFor, setNotesFor] = useState<{ item: TrackingPipelineItem; stepId: TrackingPipelineStepId | "GENERAL" } | null>(null)
  const work = useWorklist()
  const now = useNow()
  const sessions = usePagedList<SessionRow>(linksOpen ? "/api/v1/greeting-card/send-links" : null)
  const catalogs = useApi<{ data: CatalogOption[] }>("/api/v1/greeting-card/catalogs")
  const catalogList = catalogs.data?.data ?? []

  // Máy chủ đã lọc theo quyền Điều hành cấp; thấy khách của sale khác = được xem "Tất cả"
  const canSeeAll = work.items.some((i) => i.saleId !== work.userId)
  const scoped = scope === "MINE" || !canSeeAll ? work.items.filter((i) => i.saleId === work.userId) : work.items
  const counts = Object.fromEntries(BUCKETS.map((b) => [b, scoped.filter((i) => workBucket(i, "SALE") === b).length])) as Record<WorkBucket, number>
  const shown = sortWorklist(bucket ? scoped.filter((i) => workBucket(i, "SALE") === bucket) : scoped.filter((i) => workBucket(i, "SALE") !== "DONE"), "SALE")
  const openNotes = (item: TrackingPipelineItem, stepId?: TrackingPipelineStepId) => setNotesFor({ item, stepId: stepId ?? "GENERAL" })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title font-extrabold text-foreground">Khách của tôi</h2>
          <p className="mt-1 text-body-sm text-text-muted">Theo dõi từng khách đang ở bước nào; đơn cần bạn nhắc khách được đưa lên đầu.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void work.refresh()} className="h-9 gap-1.5 text-caption">
            <RefreshCw size={14} aria-hidden="true" /> Làm mới
          </Button>
          <Button type="button" size="sm" onClick={() => setIsModalOpen(true)} className="h-9 gap-1.5 bg-primary text-body-sm font-bold text-white hover:bg-primary-dark">
            <Plus size={16} aria-hidden="true" /> Tạo Thẻ Chào Mới
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canSeeAll && (
          <div role="group" aria-label="Phạm vi khách" className="mr-2 inline-flex rounded-xl border border-border bg-surface-alt p-1">
            {(["MINE", "ALL"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={scope === s} onClick={() => setScope(s)}
                className={`h-8 rounded-lg px-3 text-caption font-bold ${scope === s ? "bg-surface text-primary shadow-xs" : "text-text-muted"}`}>
                {s === "MINE" ? "Khách của tôi" : "Tất cả khách"}
              </button>
            ))}
          </div>
        )}
        {BUCKETS.map((b) => (
          <button key={b} type="button" aria-pressed={bucket === b} onClick={() => setBucket(bucket === b ? null : b)}
            className={`h-9 rounded-xl border px-3 text-caption font-bold ${
              bucket === b ? "border-primary bg-primary text-white" : b === "ACTION" && counts.ACTION > 0 ? "border-danger/40 bg-danger-bg text-danger" : "border-border text-text-muted hover:bg-surface-muted"
            }`}>
            {WORK_BUCKET_LABEL[b]} ({counts[b]})
          </button>
        ))}
      </div>

      {work.error ? (
        <p role="alert" className="rounded-xl bg-danger-bg p-4 text-body-sm text-danger">{work.error.message}</p>
      ) : work.isLoading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          {[0, 1].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-surface-muted" />)}
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-body-sm text-text-muted">
          {bucket ? "Không có khách nào trong mục này." : "Chưa có khách nào đang theo dõi. Tạo Thẻ Chào Mới để gửi khách."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((item) => <WorkItemCard key={item.id} item={item} me="SALE" now={now} onOpenNotes={openNotes} />)}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <button type="button" aria-expanded={linksOpen} onClick={() => setLinksOpen((v) => !v)}
          className="flex w-full items-center justify-between p-4 text-left text-body font-extrabold text-foreground hover:bg-surface-muted">
          Link đã gửi (thu hồi, mở lại)
          <ChevronDown size={18} aria-hidden="true" className={linksOpen ? "rotate-180" : ""} />
        </button>
        {linksOpen && (sessions.error ? (
          <p role="alert" className="p-4 text-body-sm text-danger">{sessions.error.message}</p>
        ) : (
          <SalesSessionTable
            sessions={sessions.items}
            hasMore={sessions.hasMore}
            isLoadingMore={sessions.isLoadingMore}
            onLoadMore={() => void sessions.loadMore()}
            onChanged={() => void sessions.refresh()}
            emptyState={<p className="p-6 text-center text-body-sm text-text-muted">Chưa có link nào.</p>}
          />
        ))}
      </section>

      {isModalOpen && (
        <SalesCreateLinkModal
          catalogs={catalogList}
          onClose={() => setIsModalOpen(false)}
          onCreated={() => { void work.refresh(); void sessions.refresh() }}
          onNavigateToCatalog={onNavigateToCatalog}
        />
      )}
      {notesFor && (
        <MessageThread
          target={{ orderId: notesFor.item.orderId, sessionId: notesFor.item.sessionId }}
          stepKey={notesFor.stepId}
          title={`${notesFor.item.customerName} · ${notesFor.item.orderCode ? `Đơn ${notesFor.item.orderCode}` : `Link ${notesFor.item.sendCode}`}`}
          onClose={() => setNotesFor(null)}
        />
      )}
    </div>
  )
}
