"use client"

import React, { useState } from "react"
import { Loader2, Save, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import {
  BROCHURE_POLICY_SETTINGS_KEY,
  DEFAULT_PAYMENT_TIMEOUT_MINUTES,
  parsePaymentPolicy,
  serializePaymentPolicy,
  type BrochurePaymentPolicy,
} from "@/modules/greeting-card/domain/brochure-payment-policy"

const TIMEOUT_CHOICES = [15, 30, 45, 60, 120]

/**
 * Chính sách thanh toán của tiệm (Điều hành quyết): có bắt thu đủ tiền trước khi giao hoa không,
 * và hạn thanh toán — quá hạn mà khách chưa chuyển khoản, chưa bấm "Tôi đã chuyển khoản" thì đơn
 * tự huỷ (thanh toán thất bại).
 */
export function PaymentPolicySection() {
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
        { settings: { [BROCHURE_POLICY_SETTINGS_KEY]: serializePaymentPolicy(policy) } },
        "Không lưu được chính sách thanh toán",
      )
      await org.mutate()
      setDraft(null)
      setMessage({ ok: true, text: "Đã lưu chính sách thanh toán." })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Không lưu được chính sách thanh toán" })
    } finally {
      setSaving(false)
    }
  }

  const timeoutOn = (policy?.paymentTimeoutMinutes ?? 0) > 0
  return (
    <form onSubmit={save} className="bg-surface rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Truck size={18} className="text-primary" aria-hidden="true" />
        <h3 className="text-title-sm font-extrabold text-foreground">Chính sách thanh toán & giao hoa</h3>
      </div>
      {!policy ? (
        <div className="h-20 rounded-lg bg-surface-muted animate-pulse" aria-busy="true" />
      ) : (
        <div className="flex flex-col gap-4 text-body-sm">
          <fieldset className="flex flex-col gap-2">
            <legend className="font-bold text-foreground mb-1">Khi nào được giao hoa?</legend>
            <label className="flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer has-[:checked]:border-primary">
              <input type="radio" name="dispatch-rule" className="mt-1" checked={!policy.requireFullBeforeDispatch} onChange={() => edit({ requireFullBeforeDispatch: false })} />
              <span>
                <span className="font-semibold text-foreground">Không bắt buộc thu đủ trước khi giao</span>
                <span className="block text-caption text-text-muted">Đơn đặt cọc vẫn được giao; phần còn lại thu sau (VD: khi giao hoặc chuyển khoản sau).</span>
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer has-[:checked]:border-primary">
              <input type="radio" name="dispatch-rule" className="mt-1" checked={policy.requireFullBeforeDispatch} onChange={() => edit({ requireFullBeforeDispatch: true })} />
              <span>
                <span className="font-semibold text-foreground">Bắt buộc thu đủ tiền trước khi giao</span>
                <span className="block text-caption text-text-muted">Đơn còn nợ không giao được — khách thanh toán phần còn lại sau khi xem ảnh hoa hoàn thành.</span>
              </span>
            </label>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="font-bold text-foreground mb-1">Hạn thanh toán</legend>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={timeoutOn}
                onChange={(e) => edit({ paymentTimeoutMinutes: e.target.checked ? DEFAULT_PAYMENT_TIMEOUT_MINUTES : 0 })}
              />
              <span>Tự huỷ đơn khi khách không thanh toán trong</span>
              <select
                aria-label="Số phút chờ thanh toán"
                disabled={!timeoutOn}
                value={policy.paymentTimeoutMinutes || DEFAULT_PAYMENT_TIMEOUT_MINUTES}
                onChange={(e) => edit({ paymentTimeoutMinutes: Number(e.target.value) })}
                className="h-9 px-2 rounded-lg border border-border bg-background disabled:opacity-50"
              >
                {TIMEOUT_CHOICES.map((m) => <option key={m} value={m}>{m} phút</option>)}
              </select>
            </label>
            <p className="text-caption text-text-muted">
              Tính từ lúc khách thấy thông tin chuyển khoản. Hết giờ mà cửa hàng chưa nhận được tiền và khách chưa bấm
              “Tôi đã chuyển khoản” → thanh toán không thành công, đơn tự huỷ và khách được mời đặt lại đơn mới.
            </p>
          </fieldset>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <p role="status" className={`text-caption font-medium ${message ? (message.ok ? "text-success" : "text-danger") : "text-text-muted"}`}>
          {message?.text ?? "Áp dụng cho các đơn đặt hoa trực tuyến."}
        </p>
        <Button type="submit" size="sm" disabled={saving || !draft} className="gap-1.5 shrink-0">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>Lưu chính sách</span>
        </Button>
      </div>
    </form>
  )
}
