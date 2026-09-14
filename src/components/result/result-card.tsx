"use client"

import { useState } from "react"
import { Pencil, Plus, X, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type JudgmentState = "safe" | "warning" | "blocked"

export interface ResultImage {
  src: string
  alt: string
  isBefore?: boolean
  isAfter?: boolean
}

export interface ResultFieldItem {
  id: string
  value?: string
  name?: string | null | undefined
  unit?: string | null | undefined
  quantity?: number | string | null | undefined
  role?: string | null | undefined
  color?: string | null | undefined
  extra?: string | null | undefined
}

export interface ResultField {
  key: string
  label: string
  type: "text" | "textarea" | "number" | "list" | "readonly"
  value: string | string[] | number | ResultFieldItem[]
  editable: boolean
  confidence?: number | null
  placeholder?: string
}

export interface QualityIndicator {
  score: number | null
  label: string
  status: JudgmentState
}

export interface ResultCardProps {
  images?: ResultImage[] | undefined
  beforeAfter?: { beforeSrc: string; afterSrc: string; caption?: string } | undefined
  fields: ResultField[]
  quality?: QualityIndicator | undefined
  judgment: JudgmentState
  onSaveDraft?: (() => void) | undefined
  onReject?: (() => void) | undefined
  onApprove?: (() => void) | undefined
  onRunAgain?: (() => void) | undefined
  onSkip?: (() => void) | undefined
  onFieldChange?: ((key: string, value: string | number | string[]) => void) | undefined
  onFieldAdd?: ((key: string, item: ResultFieldItem) => void) | undefined
  onFieldRemove?: ((key: string, itemId: string) => void) | undefined
  onItemChange?: ((key: string, itemId: string, item: ResultFieldItem) => void) | undefined
  disabled?: boolean | undefined
}

function ConfidenceBadge({ value }: { value: number | null | undefined }) {
  if (value == null) return null
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
        value >= 80 ? "bg-success-bg text-secondary"
          : value >= 60 ? "bg-warning-bg text-warning"
          : "bg-danger-bg text-danger"
      )}
    >
      Tin cậy {value}%
    </span>
  )
}

function FieldCard({
  field,
  onFieldChange,
  onFieldAdd,
  onFieldRemove,
  onItemChange,
  editable,
}: {
  field: ResultField
  onFieldChange?: ((key: string, value: string | number | string[]) => void)
  onFieldAdd?: (key: string, item: ResultFieldItem) => void
  onFieldRemove?: (key: string, itemId: string) => void
  onItemChange?: (key: string, itemId: string, item: ResultFieldItem) => void
  editable: boolean
}) {
  const [localValue, setLocalValue] = useState<string>(
    typeof field.value === "string" ? field.value : String(field.value ?? "")
  )

  if (field.type === "readonly") {
    return (
      <div className="flex items-center justify-between gap-2 py-2">
        <span className="text-[13px] text-text-muted">{field.label}</span>
        <span className="text-[13px] font-semibold text-text">
          {field.value != null && String(field.value).trim() !== "" && String(field.value) !== "—"
            ? String(field.value)
            : "N/A"}
        </span>
      </div>
    )
  }

  if (field.type === "list") {
    const items = field.value as ResultFieldItem[]
    return (
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-text">{field.label}</span>
          <ConfidenceBadge value={field.confidence ?? null} />
        </div>
        {items.length === 0 && (
          <div className="rounded-lg bg-surface-alt/50 px-3 py-2 text-[12px] text-text-muted italic border border-dashed border-border/80">
            N/A (Chưa có dữ liệu)
          </div>
        )}
        {items.map((item) => {
          const isStructured = item.quantity !== undefined || item.unit !== undefined || item.name !== undefined

          if (isStructured) {
            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-2.5 rounded-xl bg-surface-alt/70 p-2.5 border border-border hover:border-primary/40 transition-colors"
              >
                {/* Tên thành phần */}
                <div className="flex-1 min-w-[150px]">
                  {editable ? (
                    <input
                      type="text"
                      value={item.name ?? ""}
                      onChange={(e) =>
                        onItemChange?.(field.key, item.id, { ...item, name: e.target.value })
                      }
                      placeholder="Tên thành phần"
                      className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] font-medium text-text outline-none focus:border-primary"
                    />
                  ) : (
                    <span className="text-[13px] font-semibold text-text">{item.name || "N/A"}</span>
                  )}
                </div>

                {/* Đơn vị */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11.5px] font-medium text-text-muted">Đơn vị:</span>
                  {editable ? (
                    <input
                      type="text"
                      value={item.unit ?? "cành"}
                      onChange={(e) =>
                        onItemChange?.(field.key, item.id, { ...item, unit: e.target.value })
                      }
                      placeholder="ĐVT"
                      className="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-[12.5px] font-medium text-text outline-none focus:border-primary"
                    />
                  ) : (
                    <span className="rounded-md bg-surface px-2 py-0.5 text-[12px] font-medium text-text border border-border/60">
                      {item.unit ?? "cành"}
                    </span>
                  )}
                </div>

                {/* Số lượng */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11.5px] font-semibold text-primary">Số lượng:</span>
                  {editable ? (
                    <input
                      type="number"
                      min="0"
                      value={item.quantity ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : Number(e.target.value)
                        onItemChange?.(field.key, item.id, { ...item, quantity: val })
                      }}
                      placeholder="SL"
                      className="w-20 rounded-lg border-2 border-primary/40 bg-surface px-2 py-1.5 text-[13px] font-bold text-center text-primary outline-none focus:border-primary"
                    />
                  ) : (
                    <span className="font-bold text-[13px] text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                      {item.quantity != null ? item.quantity : "N/A"}
                    </span>
                  )}
                </div>

                {/* Badges / Extras */}
                {(item.role || item.color || item.extra) && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-text-muted">
                    {item.role && (
                      <span className="bg-surface px-2 py-0.5 rounded-full border border-border/60 font-medium text-text">
                        {item.role}
                      </span>
                    )}
                    {item.color && (
                      <span className="bg-surface px-2 py-0.5 rounded-full border border-border/60 text-text">
                        {item.color}
                      </span>
                    )}
                    {item.extra && <span className="text-text-muted italic">{item.extra}</span>}
                  </div>
                )}

                {/* Nút xoá */}
                {editable && (
                  <button
                    type="button"
                    onClick={() => onFieldRemove?.(field.key, item.id)}
                    className="ml-auto flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                    aria-label="Xoá mục này"
                  >
                    <X size={13} strokeWidth={2} />
                  </button>
                )}
              </div>
            )
          }

          // Simple string item fallback
          return (
            <div key={item.id} className="flex items-center gap-2 rounded-lg bg-surface-alt px-2.5 py-1.5">
              <span className="flex-1 text-[13px] text-text">{item.value}</span>
              {editable && (
                <button
                  type="button"
                  onClick={() => onFieldRemove?.(field.key, item.id)}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface"
                  aria-label={`Bỏ ${item.value}`}
                >
                  <X size={13} strokeWidth={2} />
                </button>
              )}
            </div>
          )
        })}
        {editable && (
          <button
            type="button"
            onClick={() => {
              const defaultUnit = field.key === "flowers" ? "bông" : field.key === "accessories" ? "cái" : "cành"
              onFieldAdd?.(field.key, { id: crypto.randomUUID(), name: "", unit: defaultUnit, quantity: 1, value: "" })
            }}
            className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-bold text-accent"
          >
            <Plus size={14} strokeWidth={2.4} /> Thêm dòng
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 py-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-text">{field.label}</span>
        <ConfidenceBadge value={field.confidence ?? null} />
      </div>
      {field.type === "textarea" ? (
        editable ? (
          <textarea
            value={localValue}
            onChange={(e) => {
              setLocalValue(e.target.value)
              onFieldChange?.(field.key, e.target.value)
            }}
            className="min-h-[60px] w-full rounded-lg border-[1.5px] border-border bg-surface px-2.5 py-2 text-[13px] text-text outline-none focus:border-primary"
            placeholder={field.placeholder}
          />
        ) : (
          <div className="text-[13px] text-text leading-relaxed">{localValue && localValue !== "—" ? localValue : "N/A"}</div>
        )
      ) : (
        <div className="flex items-center gap-2">
          {editable ? (
            <input
              type={field.type === "number" ? "number" : "text"}
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value)
                onFieldChange?.(field.key, e.target.value)
              }}
              className="flex-1 rounded-lg border-[1.5px] border-border bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary"
              placeholder={field.placeholder}
            />
          ) : (
            <span className="text-[13px] text-text">{localValue && localValue !== "—" ? localValue : "N/A"}</span>
          )}
          {editable && (
            <Pencil size={14} strokeWidth={1.8} className="text-text-muted" />
          )}
        </div>
      )}
    </div>
  )
}

export function ResultCard({
  images,
  beforeAfter,
  fields,
  quality,
  judgment,
  onSaveDraft,
  onReject,
  onApprove,
  onRunAgain,
  onSkip,
  onFieldChange,
  onFieldAdd,
  onFieldRemove,
  onItemChange,
  disabled,
}: ResultCardProps) {
  const [expandedQuality, setExpandedQuality] = useState(false)

  const judgmentMeta = {
    safe: {
      badge: "bg-success-bg text-secondary",
      label: "An toàn",
      dot: "bg-secondary",
    },
    warning: {
      badge: "bg-warning-bg text-warning",
      label: "Cảnh báo",
      dot: "bg-warning",
    },
    blocked: {
      badge: "bg-danger-bg text-danger",
      label: "Bị chặn",
      dot: "bg-danger",
    },
  }
  const meta = judgmentMeta[judgment]

  const approveBlocked = judgment === "blocked"

  return (
    <Card className="flex flex-col gap-3 border-border">
      {/* Zone 1: Illustration */}
      {beforeAfter && (
        <div className="flex gap-2 overflow-hidden rounded-xl">
          <div className="relative flex-1 aspect-[4/3] overflow-hidden rounded-xl bg-surface-alt">
            <img
              src={beforeAfter.beforeSrc}
              alt="Trước"
              className="h-full w-full object-cover"
            />
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
              Trước
            </span>
          </div>
          <div className="relative flex-1 aspect-[4/3] overflow-hidden rounded-xl bg-surface-alt">
            <img
              src={beforeAfter.afterSrc}
              alt="Sau"
              className="h-full w-full object-cover"
            />
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
              Sau
            </span>
            {beforeAfter.caption && (
              <span className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white text-center">
                {beforeAfter.caption}
              </span>
            )}
          </div>
        </div>
      )}

      {images && images.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
          {images.map((img, i) => (
            <div key={i} className="relative h-48 w-48 sm:h-56 sm:w-56 flex-shrink-0 overflow-hidden rounded-2xl bg-surface-alt border border-border shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
              {img.isBefore && (
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                  Trước
                </span>
              )}
              {img.isAfter && (
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                  Sau
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zone 2: Data fields */}
      <div className="flex flex-col divide-y divide-border">
        {fields.map((field) => (
          <FieldCard
            key={field.key}
            field={field}
            editable={field.editable && !disabled}
            {...(onFieldChange ? { onFieldChange } : {})}
            {...(onFieldAdd ? { onFieldAdd } : {})}
            {...(onFieldRemove ? { onFieldRemove } : {})}
            {...(onItemChange ? { onItemChange } : {})}
          />
        ))}
      </div>

      {/* Zone 3: Quality indicators */}
      {quality && (
        <div>
          <button
            type="button"
            onClick={() => setExpandedQuality(!expandedQuality)}
            className="flex w-full items-center justify-between rounded-lg bg-surface-alt px-3 py-2"
          >
            <span className="flex items-center gap-2 text-[13px] font-bold text-text">
              <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", meta.dot)} />
              Chất lượng: {quality.label}
              <Badge className={cn("text-[9.5px]", meta.badge)}>{meta.label}</Badge>
            </span>
            {expandedQuality ? (
              <ChevronUp size={14} className="text-text-muted" />
            ) : (
              <ChevronDown size={14} className="text-text-muted" />
            )}
          </button>
          {expandedQuality && (
            <div className="mt-1.5 rounded-lg bg-surface-alt px-3 py-2 text-[12px] text-text-muted">
              {quality.score != null && (
                <div>
                  Điểm: <span className="font-bold text-text">{quality.score}/100</span>
                </div>
              )}
              <div>{quality.label}</div>
            </div>
          )}
        </div>
      )}

      {/* Zone 4: Actions */}
      <div className="flex items-center gap-2 border-t border-border pt-3">
        {onSaveDraft && (
          <Button variant="secondary" onClick={onSaveDraft} disabled={disabled}>
            Lưu nháp
          </Button>
        )}
        {onReject && (
          <Button variant="ghost" onClick={onReject} disabled={disabled}>
            Từ chối
          </Button>
        )}
        {onApprove && !approveBlocked && (
          <Button onClick={onApprove} disabled={disabled}>
            Duyệt
          </Button>
        )}
        {approveBlocked && (
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-danger">
              <ShieldCheck size={14} strokeWidth={1.8} />
              Kết quả bị chặn — không thể duyệt trực tiếp
            </div>
            <div className="flex gap-2">
              {onRunAgain && (
                <Button variant="secondary" onClick={onRunAgain} disabled={disabled}>
                  Chạy lại
                </Button>
              )}
              {onSkip && (
                <Button variant="ghost" onClick={onSkip} disabled={disabled}>
                  Bỏ qua
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export function WarningBanner({
  message,
  onCancel,
}: {
  message: string
  onConfirm?: () => void
  onCancel?: () => void
}) {
  const [confirmed, setConfirmed] = useState(false)

  return (
    <div className="flex flex-col gap-3 rounded-xl border-[1.5px] border-warning bg-warning-bg p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-warning" />
        <div className="flex-1 text-[12.5px] leading-relaxed text-warning">{message}</div>
      </div>
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Hủy
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => setConfirmed(true)}
          className={cn(confirmed && "bg-warning hover:bg-warning/90")}
        >
          {confirmed ? "Vẫn duyệt dù có cảnh báo" : "Duyệt kèm cảnh báo"}
        </Button>
      </div>
    </div>
  )
}
