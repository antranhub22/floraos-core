"use client"

import React, { useState } from "react"
import { Eye } from "lucide-react"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import {
  VISIBILITY_SETTINGS_KEY,
  parseVisibilityMode,
  type VisibilityMode,
} from "@/modules/greeting-card/domain/order-visibility"

/**
 * Điều hành chọn nhân viên bán hàng thấy mọi đơn hay chỉ đơn từ link của chính mình.
 * Điều phối, giao hàng, kế toán, điều hành luôn thấy tất cả.
 */
export function BrochureVisibilitySettings() {
  const org = useApi<{ settings?: Record<string, unknown> | null }>("/api/v1/organizations/current")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const mode = org.data ? parseVisibilityMode(org.data.settings) : null

  async function change(next: VisibilityMode) {
    setSaving(true)
    setMessage(null)
    try {
      await apiSend(
        "/api/v1/organizations/current",
        "PATCH",
        { settings: { [VISIBILITY_SETTINGS_KEY]: { mode: next } } },
        "Không lưu được phạm vi xem đơn",
      )
      await org.mutate()
      setMessage({ ok: true, text: "Đã lưu phạm vi xem đơn." })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Không lưu được phạm vi xem đơn" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-surface rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Eye size={18} className="text-primary" aria-hidden="true" />
        <h3 className="text-title-sm font-extrabold text-foreground">Nhân viên bán hàng xem đơn nào</h3>
      </div>
      {!mode ? (
        <div className="h-16 rounded-lg bg-surface-muted animate-pulse" aria-busy="true" />
      ) : (
        <fieldset className="flex flex-col gap-2 text-body-sm" disabled={saving}>
          <legend className="sr-only">Phạm vi xem đơn của nhân viên bán hàng</legend>
          <label className="flex items-start gap-2">
            <input type="radio" name="brochure-visibility" checked={mode === "ALL"} onChange={() => void change("ALL")} className="mt-1" />
            <span><strong>Thấy tất cả đơn</strong> (mặc định) — mọi sale cùng theo dõi, hỗ trợ nhau chốt đơn.</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" name="brochure-visibility" checked={mode === "OWN"} onChange={() => void change("OWN")} className="mt-1" />
            <span><strong>Chỉ đơn từ link của chính mình</strong> — mỗi sale chỉ thấy link và đơn do mình gửi.</span>
          </label>
          <p className="text-caption text-text-muted">Điều hành, điều phối, giao hàng và kế toán luôn thấy tất cả đơn.</p>
        </fieldset>
      )}
      {message && (
        <p role="status" className={`text-caption font-medium ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</p>
      )}
    </section>
  )
}
