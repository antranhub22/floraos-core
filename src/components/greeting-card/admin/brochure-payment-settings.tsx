"use client"

import React, { useState } from "react"
import { Landmark, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import {
  BROCHURE_PAYMENT_SETTINGS_KEY,
  parseBrochurePaymentConfig,
} from "@/modules/greeting-card/domain/brochure-commerce-rules"

type FormState = { bank_id: string; bank_name: string; account_no: string; account_name: string }

const EMPTY: FormState = { bank_id: "", bank_name: "", account_no: "", account_name: "" }

const FIELDS: Array<{ key: keyof FormState; label: string; placeholder: string }> = [
  { key: "bank_id", label: "Mã ngân hàng (VietQR)", placeholder: "VD: VCB, MB, TCB, ACB" },
  { key: "bank_name", label: "Tên ngân hàng hiển thị", placeholder: "VD: Vietcombank" },
  { key: "account_no", label: "Số tài khoản", placeholder: "VD: 0011223344" },
  { key: "account_name", label: "Tên chủ tài khoản", placeholder: "VD: NGUYEN VAN A" },
]

/**
 * Tài khoản nhận tiền của TIỆM cho mã QR trên Thẻ chào (lưu ở
 * `organizations.settings.brochure_payment`). Chưa cấu hình thì trang khách
 * không hiện QR mà báo "cửa hàng sẽ liên hệ". Lưu cần quyền sửa hồ sơ tổ chức.
 */
export function BrochurePaymentSettings() {
  const org = useApi<{ settings?: Record<string, unknown> | null }>("/api/v1/organizations/current")
  const [draft, setDraft] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null)
  const loading = !org.data && !org.error
  const configured = parseBrochurePaymentConfig(org.data?.settings) !== null
  // Bản nháp sinh từ dữ liệu đã lưu ở lần sửa đầu — không cần effect đồng bộ state
  const saved = { ...EMPTY, ...((org.data?.settings?.[BROCHURE_PAYMENT_SETTINGS_KEY] ?? {}) as Partial<FormState>) }
  const form = draft ?? saved
  const setForm = (update: (prev: FormState) => FormState) => setDraft(update(form))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    const payload = { [BROCHURE_PAYMENT_SETTINGS_KEY]: form }
    if (!parseBrochurePaymentConfig(payload)) {
      setMessage({ kind: "error", text: "Vui lòng nhập đủ mã ngân hàng, số tài khoản và tên chủ tài khoản hợp lệ" })
      return
    }
    setSaving(true)
    try {
      await apiSend("/api/v1/organizations/current", "PATCH", { settings: payload }, "Không lưu được tài khoản nhận tiền")
      await org.mutate()
      setDraft(null)
      setMessage({ kind: "ok", text: "Đã lưu tài khoản nhận tiền. Mã QR trên Thẻ chào sẽ dùng tài khoản này." })
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Không lưu được tài khoản nhận tiền" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="bg-surface rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Landmark size={18} className="text-primary" />
          <h3 className="text-title-sm font-extrabold text-foreground">Tài khoản nhận tiền chuyển khoản</h3>
        </div>
        <span
          className={`text-caption px-2.5 py-0.5 rounded-full font-bold ${
            configured ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
          }`}
        >
          {loading ? "Đang tải..." : configured ? "Đã cấu hình" : "Chưa cấu hình — khách chưa thấy mã QR"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span className="text-caption font-bold text-foreground">{f.label}</span>
            <input
              type="text"
              value={form[f.key]}
              placeholder={f.placeholder}
              maxLength={60}
              disabled={loading}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {message ? (
          <p role="status" className={`text-caption font-medium ${message.kind === "ok" ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        ) : (
          <p className="text-caption text-text-muted">
            Mã ngân hàng theo chuẩn VietQR. Kiểm tra kỹ số tài khoản trước khi lưu.
          </p>
        )}
        <Button type="submit" size="sm" disabled={saving || loading} className="gap-1.5 shrink-0">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>Lưu tài khoản</span>
        </Button>
      </div>
    </form>
  )
}
