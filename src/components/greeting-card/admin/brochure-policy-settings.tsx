"use client"

import React, { useState } from "react"
import { Loader2, Save, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import {
  BROCHURE_POLICY_SETTINGS_KEY,
  parsePaymentPolicy,
  type BrochurePaymentPolicy,
} from "@/modules/greeting-card/domain/brochure-payment-policy"

/** Chính sách thu tiền đơn Thẻ chào: % đặt cọc, bắt thu trước khi cắm / trước khi giao. */
export function BrochurePolicySettings() {
  const org = useApi<{ settings?: Record<string, unknown> | null }>("/api/v1/organizations/current")
  const [draft, setDraft] = useState<BrochurePaymentPolicy | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const policy = draft ?? (org.data ? parsePaymentPolicy(org.data.settings) : null)
  const edit = (patch: Partial<BrochurePaymentPolicy>) => {
    if (!policy) return
    setDraft({ ...policy, ...patch })
    setMessage(null)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!policy) return
    setSaving(true)
    try {
      await apiSend(
        "/api/v1/organizations/current",
        "PATCH",
        {
          settings: {
            [BROCHURE_POLICY_SETTINGS_KEY]: {
              deposit_percent: policy.depositPercent,
              require_paid_before_production: policy.requirePaidBeforeProduction,
              require_full_before_dispatch: policy.requireFullBeforeDispatch,
            },
          },
        },
        "Không lưu được chính sách thu tiền"
      )
      await org.mutate()
      setDraft(null)
      setMessage({ ok: true, text: "Đã lưu chính sách thu tiền." })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Không lưu được chính sách thu tiền" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="bg-surface rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-primary" />
        <h3 className="text-title-sm font-extrabold text-foreground">Chính sách thu tiền</h3>
      </div>
      {!policy ? (
        <div className="h-20 rounded-lg bg-surface-muted animate-pulse" aria-busy="true" />
      ) : (
        <div className="flex flex-col gap-3 text-body-sm">
          <label className="flex items-center gap-2">
            <span className="text-text-muted">Khách đặt cọc trước</span>
            <select
              value={policy.depositPercent}
              onChange={(e) => edit({ depositPercent: Number(e.target.value) })}
              className="h-9 px-2 rounded-lg border border-border bg-background"
            >
              <option value={0}>Không — thanh toán đủ</option>
              {[20, 30, 50, 70].map((p) => <option key={p} value={p}>{p}% giá trị đơn</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={policy.requirePaidBeforeProduction} onChange={(e) => edit({ requirePaidBeforeProduction: e.target.checked })} />
            <span>Chỉ cắm hoa khi đã nhận cọc/thanh toán</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={policy.requireFullBeforeDispatch} onChange={(e) => edit({ requireFullBeforeDispatch: e.target.checked })} />
            <span>Chỉ giao hoa khi đã thu đủ tiền</span>
          </label>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <p role="status" className={`text-caption font-medium ${message ? (message.ok ? "text-success" : "text-danger") : "text-text-muted"}`}>
          {message?.text ?? "Mã QR của khách tự hiện đúng số tiền cọc hoặc phần còn lại."}
        </p>
        <Button type="submit" size="sm" disabled={saving || !draft} className="gap-1.5 shrink-0">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>Lưu chính sách</span>
        </Button>
      </div>
    </form>
  )
}
