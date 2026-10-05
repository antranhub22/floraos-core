"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { InlineError } from "@/components/ui/inline-error"
import {
  OPTIONAL_DISPLAY_FIELDS,
  enabledFieldsFor,
  type DisplaySettings,
  type OptionalDisplayField,
} from "@/modules/greeting-card/domain/display-fields"
import { GREETING_TEMPLATES, type GreetingTemplateId } from "@/modules/greeting-card/domain/greeting-template-registry"

const API = "/api/v1/greeting-card/display-settings"

/** Cấu hình trường hiển thị của cửa hàng: tải một lần, lưu theo từng mẫu. */
export function useDisplaySettings() {
  const [settings, setSettings] = useState<DisplaySettings>({})
  useEffect(() => {
    let cancelled = false
    fetch(API)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: { settings?: DisplaySettings } } | null) => {
        if (!cancelled && j?.data?.settings) setSettings(j.data.settings)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  const save = useCallback(async (templateId: string, fields: OptionalDisplayField[]) => {
    const res = await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, fields }),
    })
    if (!res.ok) throw new Error("Không lưu được cài đặt hiển thị. Vui lòng thử lại.")
    const j = (await res.json()) as { data: { settings: DisplaySettings } }
    setSettings(j.data.settings)
  }, [])
  return { settings, save }
}

const REQUIRED = ["Mã mẫu", "Tên sản phẩm", "Giá tiền"]

interface DisplaySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: GreetingTemplateId
  settings: DisplaySettings
  onSave: (templateId: string, fields: OptionalDisplayField[]) => Promise<void>
}

/** Bật/tắt từng trường thông tin sản phẩm cho một mẫu Thẻ chào (áp dụng cho cả cửa hàng). */
export function DisplaySettingsDialog({ open, onOpenChange, templateId, settings, onSave }: DisplaySettingsDialogProps) {
  const [fields, setFields] = useState<OptionalDisplayField[]>(() => enabledFieldsFor(settings, templateId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(key: OptionalDisplayField) {
    setFields((f) => (f.includes(key) ? f.filter((k) => k !== key) : [...f, key]))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave(templateId, fields)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !saving && onOpenChange(o)}
      title={`Thông tin hiển thị · ${GREETING_TEMPLATES[templateId]?.name ?? templateId}`}
      description="Áp dụng cho mọi bộ sưu tập của cửa hàng đang dùng mẫu này. Trường sản phẩm chưa có dữ liệu sẽ tự ẩn."
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
            {saving && <Loader2 size={16} className="mr-1.5 animate-spin" aria-hidden="true" />}
            Lưu cài đặt
          </Button>
        </div>
      }
    >
      <ul className="flex flex-col divide-y divide-border">
        {REQUIRED.map((label) => (
          <li key={label} className="flex items-center justify-between py-3 text-body-sm">
            <span className="font-medium">{label}</span>
            <span className="inline-flex items-center gap-1 text-caption text-text-muted">
              <Lock size={12} aria-hidden="true" /> Luôn hiển thị
            </span>
          </li>
        ))}
        {OPTIONAL_DISPLAY_FIELDS.map((f) => {
          const on = fields.includes(f.key)
          return (
            <li key={f.key} className="flex items-center justify-between py-3 text-body-sm">
              <label htmlFor={`df-${f.key}`} className="font-medium">
                {f.label}
              </label>
              <button
                id={`df-${f.key}`}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => toggle(f.key)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-border"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all ${on ? "left-5" : "left-0.5"}`} />
              </button>
            </li>
          )
        })}
      </ul>
      {error && <InlineError message={error} className="mt-3" />}
    </Dialog>
  )
}
