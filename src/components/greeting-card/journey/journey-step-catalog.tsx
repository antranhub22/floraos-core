"use client"

import React, { useState } from "react"
import { ArrowRight, Check, Copy, Eye, Loader2, Plus } from "lucide-react"
import { CatalogProductPicker } from "@/components/greeting-card/catalog/catalog-product-picker"
import { JourneyCatalogForm } from "./journey-catalog-form"
import { JourneyPublicLinkCard } from "./journey-public-link-card"
import { JourneyCloneModal } from "./journey-clone-modal"
import { absoluteUrl, catalogDisplayPath, type CatalogOption } from "./journey-types"

interface Props {
  catalogs: CatalogOption[]
  loading: boolean
  orgSlug: string
  selected: CatalogOption | undefined
  itemCount: number
  onSelect: (catalogId: string, itemCount?: number) => void
  onItemCountChange: (count: number) => void
  onCatalogsChanged: () => Promise<unknown>
  onPreview: (url: string, title: string) => void
  onNext: () => void
  onError: (message: string | null) => void
}

const SECONDARY_BTN =
  "inline-flex items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-muted text-foreground font-bold h-10 px-4 gap-1.5 shadow-xs text-body-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

/** Bước 1: chọn/tạo bộ sưu tập, thêm mẫu hoa, lấy link dùng chung hoặc sang bước gửi riêng. */
export function JourneyStepCatalog(p: Props) {
  const [isCreating, setIsCreating] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [copied, setCopied] = useState(false)
  const publicUrl = p.selected ? absoluteUrl(catalogDisplayPath(p.selected, p.orgSlug)) : ""
  const ready = !!p.selected && p.itemCount > 0

  function copyPublic() {
    if (!publicUrl) return
    void navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }
  const preview = () =>
    p.selected && p.onPreview(publicUrl, `Xem trước: ${p.selected.name} (${catalogDisplayPath(p.selected, p.orgSlug)})`)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-title font-extrabold text-foreground">Bước 1: Chọn Bộ Sưu Tập Mẫu Hoa để gửi khách</h3>
        <p className="text-body-sm text-text-muted mt-1">Khách hàng sẽ lướt xem các mẫu hoa nằm trong bộ sưu tập mà bạn chọn tại đây.</p>
      </div>

      {p.loading ? (
        <div className="py-12 flex items-center justify-center text-text-muted" aria-busy="true">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-body-sm">Đang tải danh sách bộ sưu tập...</span>
        </div>
      ) : p.catalogs.length === 0 || isCreating ? (
        <JourneyCatalogForm
          canCancel={p.catalogs.length > 0}
          onCancel={() => setIsCreating(false)}
          onError={p.onError}
          onCreated={async (id) => {
            await p.onCatalogsChanged()
            p.onSelect(id, 0) // bộ sưu tập mới tạo luôn trống
            setIsCreating(false)
          }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1" role="radiogroup" aria-label="Bộ sưu tập">
            {p.catalogs.map((cat) => {
              const isSelected = p.selected?.id === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => p.onSelect(cat.id, cat.itemCount)}
                  className={`p-4 rounded-xl border text-left flex items-start justify-between gap-3 transition-all ${
                    isSelected ? "bg-selected/60 border-primary shadow-xs ring-1 ring-primary" : "bg-background border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-bold text-foreground truncate">{cat.name}</p>
                    <p className="text-caption text-primary font-mono mt-0.5 truncate">{catalogDisplayPath(cat, p.orgSlug)}</p>
                    <p className="text-caption text-text-muted font-medium mt-1.5">
                      {cat.itemCount > 0 ? `${cat.itemCount} mẫu hoa đã gán` : "Chưa có mẫu hoa"}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {p.selected && (
            <div className="rounded-2xl border border-border bg-surface-muted p-4">
              <p className="text-body-sm font-bold text-text mb-3">Sản phẩm trong bộ sưu tập đã chọn</p>
              <CatalogProductPicker catalogId={p.selected.id} compact onItemCountChange={p.onItemCountChange} />
            </div>
          )}

          {ready && (
            <JourneyPublicLinkCard
              itemCount={p.itemCount}
              displayPath={catalogDisplayPath(p.selected, p.orgSlug)}
              publicUrl={publicUrl}
              copied={copied}
              onPreview={preview}
              onCopy={copyPublic}
              onClone={() => setIsCloning(true)}
            />
          )}

          {isCloning && p.selected && (
            <JourneyCloneModal
              source={p.selected}
              itemCount={p.itemCount}
              orgSlug={p.orgSlug}
              onClose={() => setIsCloning(false)}
              onCloned={async (id, count) => {
                setIsCloning(false)
                await p.onCatalogsChanged()
                p.onSelect(id, count)
              }}
            />
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="text-body-sm font-bold text-primary hover:underline inline-flex items-center gap-1.5 self-start"
            >
              <Plus size={15} />
              <span>Tạo thêm bộ sưu tập mới</span>
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" disabled={!ready} onClick={preview} title={ready ? "Xem trước giao diện khách hàng sẽ thấy" : "Vui lòng thêm ít nhất 1 mẫu hoa để xem trước"} className={SECONDARY_BTN}>
                <Eye size={15} />
                <span>Xem Trước</span>
              </button>
              <button type="button" disabled={!ready} onClick={copyPublic} title={ready ? "Sao chép link dùng chung không cần tạo CRM" : "Vui lòng thêm ít nhất 1 mẫu hoa"} className={`flex-1 sm:flex-none ${SECONDARY_BTN}`}>
                {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                <span>{copied ? "Đã chép link chung!" : "Chép Link Dùng Chung"}</span>
              </button>
              <button
                type="button"
                disabled={!ready}
                onClick={p.onNext}
                title={ready ? undefined : "Vui lòng thêm ít nhất 1 mẫu hoa trước khi gửi link"}
                className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-dark text-white font-bold h-10 px-5 gap-1.5 shadow-sm text-body-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Gửi Riêng Từng Khách (CRM)</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
