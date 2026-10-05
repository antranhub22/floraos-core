"use client"

import { ArrowRight, BookOpen, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { InlineError } from "@/components/ui/inline-error"
import { Skeleton } from "@/components/ui/skeleton"
import { CatalogProductPicker } from "@/components/greeting-card/catalog/catalog-product-picker"
import { cn } from "@/lib/utils"
import { catalogPublicPath, type CatalogOption } from "./use-journey-catalogs"

interface StepCatalogProps {
  catalogs: CatalogOption[]
  orgSlug: string
  loading: boolean
  loadError: string | null
  selectedId: string
  itemCount: number
  onRetry: () => void
  onSelect: (catalog: CatalogOption) => void
  onCreate: () => void
  onItemCountChange: (count: number) => void
  onNext: () => void
}

export function StepCatalog(props: StepCatalogProps) {
  const { catalogs, orgSlug, loading, loadError, selectedId, itemCount } = props

  return (
    <section aria-labelledby="step-catalog-title" className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="step-catalog-title" className="text-title font-bold text-foreground">
            Chọn bộ sưu tập mẫu hoa
          </h2>
          <p className="mt-1 text-body-sm text-text-muted">Khách sẽ lướt xem các mẫu hoa trong bộ sưu tập bạn chọn.</p>
        </div>
        {catalogs.length > 0 && (
          <Button variant="outline" size="sm" onClick={props.onCreate} className="shrink-0 gap-1.5">
            <Plus size={16} aria-hidden="true" />
            Bộ sưu tập mới
          </Button>
        )}
      </header>

      {loadError && <InlineError message={loadError} onRetry={props.onRetry} />}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Đang tải bộ sưu tập">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : catalogs.length === 0 && !loadError ? (
        <EmptyState
          icon={BookOpen}
          title="Chưa có bộ sưu tập nào"
          reason="Tạo bộ sưu tập theo dịp (20/10, sinh nhật, khai trương…) rồi thêm mẫu hoa để gửi khách."
          action={{ label: "Tạo bộ sưu tập đầu tiên", onClick: props.onCreate }}
          className="rounded-2xl border border-dashed border-border py-10"
        />
      ) : (
        <div role="radiogroup" aria-label="Bộ sưu tập" className="grid max-h-80 grid-cols-1 gap-3 overflow-y-auto p-0.5 sm:grid-cols-2">
          {catalogs.map((cat) => {
            const selected = cat.id === selectedId
            return (
              <button
                key={cat.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => props.onSelect(cat)}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  selected ? "border-primary bg-selected ring-1 ring-primary" : "border-border bg-surface hover:border-primary/40",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-bold text-foreground">{cat.name}</span>
                  <span className="mt-0.5 block truncate font-mono text-caption text-text-muted">
                    {catalogPublicPath(orgSlug, cat)}
                  </span>
                  <span
                    className={cn(
                      "mt-2 inline-flex rounded-full px-2 py-0.5 text-caption font-semibold",
                      cat.itemCount > 0 ? "bg-success-bg text-success" : "bg-warning-bg text-warning",
                    )}
                  >
                    {cat.itemCount > 0 ? `${cat.itemCount} mẫu hoa` : "Chưa có mẫu hoa"}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-primary bg-primary text-white" : "border-border",
                  )}
                >
                  {selected && <Check size={12} />}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {selectedId && (
        <div className="rounded-2xl border border-border bg-surface-muted p-4 sm:p-5">
          <CatalogProductPicker catalogId={selectedId} compact onItemCountChange={props.onItemCountChange} />
        </div>
      )}

      <footer className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-text-muted">
          {itemCount > 0
            ? "Muốn gửi kèm lời chào riêng cho từng khách? Tiếp tục sang bước 2."
            : "Thêm ít nhất 1 mẫu hoa để tiếp tục."}
        </p>
        <Button size="sm" disabled={!selectedId || itemCount === 0} onClick={props.onNext} className="gap-1.5">
          Gửi riêng cho khách
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </footer>
    </section>
  )
}
