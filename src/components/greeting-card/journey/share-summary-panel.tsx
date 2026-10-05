"use client"

import { Check, CheckCircle2, Circle, Copy, CopyPlus, ExternalLink, Eye, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CatalogOption } from "./use-journey-catalogs"

interface ShareSummaryPanelProps {
  catalog: CatalogOption | undefined
  templateLabel: string | null
  itemCount: number
  publicPath: string
  publicUrl: string
  copied: boolean
  copyError: string | null
  onCopy: () => void
  onPreview: () => void
  onClone: () => void
}

function ChecklistRow({ done, label }: { done: boolean; label: string }) {
  const Icon = done ? CheckCircle2 : Circle
  return (
    <li className="flex items-center gap-2 text-body-sm">
      <Icon size={16} aria-hidden="true" className={done ? "text-success" : "text-text-muted"} />
      <span className={done ? "text-foreground" : "text-text-muted"}>{label}</span>
      <span className="sr-only">{done ? "(đã xong)" : "(chưa xong)"}</span>
    </li>
  )
}

/** Cột tóm tắt: trạng thái sẵn sàng + link dùng chung (một nơi duy nhất cho thao tác chia sẻ). */
export function ShareSummaryPanel(props: ShareSummaryPanelProps) {
  const { catalog, templateLabel, itemCount, publicPath, publicUrl, copied, copyError, onCopy, onPreview, onClone } = props
  const ready = Boolean(catalog) && itemCount > 0

  return (
    <aside aria-label="Tóm tắt và chia sẻ" className="flex flex-col gap-4 lg:sticky lg:top-6">
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-caption font-bold uppercase tracking-wider text-text-muted">Đang chuẩn bị</h2>
        <p className="mt-1.5 truncate text-title-sm font-bold text-foreground" title={catalog?.name}>
          {catalog?.name ?? "Chưa chọn bộ sưu tập"}
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          <ChecklistRow done={Boolean(catalog)} label="Đã chọn bộ sưu tập" />
          <ChecklistRow done={itemCount > 0} label={itemCount > 0 ? `Có ${itemCount} mẫu hoa` : "Thêm ít nhất 1 mẫu hoa"} />
        </ul>
        {templateLabel && (
          <p className="mt-4 border-t border-border pt-3 text-body-sm text-text-muted">
            Giao diện: <span className="font-semibold text-foreground">{templateLabel}</span>
          </p>
        )}
      </section>

      <section
        className={cn(
          "rounded-2xl border p-5 transition-colors",
          ready ? "border-primary/30 bg-primary/5" : "border-dashed border-border bg-surface",
        )}
      >
        <div className="flex items-center gap-2">
          <LinkIcon size={16} aria-hidden="true" className="text-primary" />
          <h2 className="text-body font-bold text-foreground">Link dùng chung</h2>
        </div>
        <p className="mt-1 text-body-sm text-text-muted">
          Đăng lên Fanpage, Zalo, bio hoặc quảng cáo. Ai mở link cũng xem được mẫu hoa và tự đặt, thanh toán qua mã QR.
        </p>

        {ready ? (
          <>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate font-mono text-body-sm font-semibold text-primary" title={publicUrl}>
                {publicPath}
              </span>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Mở link trong thẻ mới"
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-alt hover:text-foreground"
              >
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={onPreview} className="gap-1.5 whitespace-nowrap px-3">
                <Eye size={16} aria-hidden="true" />
                Xem trước
              </Button>
              <Button variant="primary" size="sm" onClick={onCopy} className="gap-1.5 whitespace-nowrap px-3">
                {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copied ? "Đã chép" : "Sao chép"}
              </Button>
            </div>
            {copyError && (
              <p role="alert" className="mt-2 text-caption text-danger">
                {copyError}
              </p>
            )}
            <button
              type="button"
              onClick={onClone}
              className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:underline"
            >
              <CopyPlus size={16} aria-hidden="true" />
              Tạo link riêng cho kênh khác
            </button>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-surface-alt px-3 py-2.5 text-body-sm text-text-muted">
            Link sẽ xuất hiện khi bộ sưu tập có ít nhất 1 mẫu hoa.
          </p>
        )}
      </section>
    </aside>
  )
}
