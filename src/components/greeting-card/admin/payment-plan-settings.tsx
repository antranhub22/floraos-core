"use client"

import React, { useState } from "react"
import { Loader2, Plus, Save, Trash2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import {
  FULL_PAYMENT,
  normalizePaymentCode,
  parsePaymentPlans,
  PAYMENT_PLANS_SETTINGS_KEY,
  serializePaymentPlans,
  type PaymentCodeRule,
  type PaymentPlansConfig,
  type PolicyCampaign,
} from "@/modules/greeting-card/domain/payment-plan"

const POLICIES = [FULL_PAYMENT, "DEPOSIT_20", "DEPOSIT_30", "DEPOSIT_40", "DEPOSIT_50", "DEPOSIT_70"]
const POLICY_TEXT = (p: string) => (p === FULL_PAYMENT ? "Thanh toán 100%" : `Đặt cọc ${p.replace("DEPOSIT_", "")}%`)
const INPUT = "h-9 px-2 rounded-lg border border-border bg-background text-body-sm"
const numOrNull = (v: string): number | null => {
  const n = Number(v.replace(/\D/g, ""))
  return v.trim() && Number.isInteger(n) && n > 0 ? n : null
}

/**
 * Mã thanh toán (DC30, DC50…) và đợt áp cách thu mặc định (VD: dịp 20/10 thu 100%).
 * Mã thanh toán KHÔNG giảm giá — chỉ cho khách đặt cọc thay vì trả đủ (hoặc ngược lại).
 */
export function PaymentPlanSettings() {
  const org = useApi<{ settings?: Record<string, unknown> | null }>("/api/v1/organizations/current")
  const [draft, setDraft] = useState<PaymentPlansConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const config = draft ?? (org.data ? parsePaymentPlans(org.data.settings) : null)
  const edit = (next: PaymentPlansConfig) => {
    setDraft(next)
    setMessage(null)
  }
  const setCode = (i: number, patch: Partial<PaymentCodeRule>) =>
    config && edit({ ...config, codes: config.codes.map((c, j) => (j === i ? { ...c, ...patch } : c)) })
  const setCampaign = (i: number, patch: Partial<PolicyCampaign>) =>
    config && edit({ ...config, campaigns: config.campaigns.map((c, j) => (j === i ? { ...c, ...patch } : c)) })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!config) return
    setSaving(true)
    try {
      await apiSend("/api/v1/organizations/current", "PATCH", { settings: { [PAYMENT_PLANS_SETTINGS_KEY]: serializePaymentPlans(config) } }, "Không lưu được mã thanh toán")
      await org.mutate()
      setDraft(null)
      setMessage({ ok: true, text: "Đã lưu. Mã hoặc đợt thiếu thông tin bắt buộc sẽ không được lưu." })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Không lưu được mã thanh toán" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="bg-surface rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Wallet size={18} className="text-primary" />
        <h3 className="text-title-sm font-extrabold text-foreground">Mã thanh toán & đợt thu tiền</h3>
      </div>
      {!config ? (
        <div className="h-20 rounded-lg bg-surface-muted animate-pulse" aria-busy="true" />
      ) : (
        <div className="flex flex-col gap-5 text-body-sm">
          <section className="flex flex-col gap-2">
            <p className="font-bold text-foreground">Đợt áp cách thu mặc định</p>
            <p className="text-caption text-text-muted">Đơn có ngày giao trong đợt sẽ thu theo cách của đợt thay cho mặc định của tiệm.</p>
            {config.campaigns.map((c, i) => (
              <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                <input aria-label="Tên đợt" value={c.name} onChange={(e) => setCampaign(i, { name: e.target.value })} placeholder="VD: Ngày 20/10" className={`${INPUT} flex-1 min-w-32`} />
                <PolicySelect value={c.policy} onChange={(policy) => setCampaign(i, { policy })} />
                <input aria-label="Từ ngày" type="date" value={c.startsOn} onChange={(e) => setCampaign(i, { startsOn: e.target.value })} className={INPUT} />
                <input aria-label="Đến ngày" type="date" value={c.endsOn} onChange={(e) => setCampaign(i, { endsOn: e.target.value })} className={INPUT} />
                <label className="flex items-center gap-1"><input type="checkbox" checked={c.active} onChange={(e) => setCampaign(i, { active: e.target.checked })} /> Bật</label>
                <Button type="button" size="sm" variant="ghost" aria-label="Xoá đợt" onClick={() => edit({ ...config, campaigns: config.campaigns.filter((_, j) => j !== i) })}><Trash2 size={14} /></Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" className="self-start gap-1" onClick={() => edit({
              ...config,
              campaigns: [...config.campaigns, { id: `camp-${Date.now()}`, name: "", policy: FULL_PAYMENT, active: true, startsOn: "", endsOn: "" }],
            })}><Plus size={14} /> Thêm đợt</Button>
          </section>

          <section className="flex flex-col gap-2">
            <p className="font-bold text-foreground">Mã thanh toán</p>
            <p className="text-caption text-text-muted">Sale gửi mã cho khách; khách nhập mã để đặt cọc. Tổng tiền đơn không đổi.</p>
            {config.codes.map((c, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input aria-label="Mã" value={c.code} onChange={(e) => setCode(i, { code: normalizePaymentCode(e.target.value) })} placeholder="VD: DC30" className={`${INPUT} w-28 font-mono`} />
                  <PolicySelect value={c.policy} onChange={(policy) => setCode(i, { policy })} />
                  <label className="flex items-center gap-1"><input type="checkbox" checked={c.active} onChange={(e) => setCode(i, { active: e.target.checked })} /> Đang dùng</label>
                  <Button type="button" size="sm" variant="ghost" aria-label={`Xoá mã ${c.code}`} onClick={() => edit({ ...config, codes: config.codes.filter((_, j) => j !== i) })}><Trash2 size={14} /></Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-caption">
                  <label className="flex items-center gap-1">Từ <input type="date" value={c.startsOn ?? ""} onChange={(e) => setCode(i, { startsOn: e.target.value || null })} className={INPUT} /></label>
                  <label className="flex items-center gap-1">đến <input type="date" value={c.endsOn ?? ""} onChange={(e) => setCode(i, { endsOn: e.target.value || null })} className={INPUT} /></label>
                  <label className="flex items-center gap-1">Số lượt <input inputMode="numeric" value={c.maxUses ?? ""} onChange={(e) => setCode(i, { maxUses: numOrNull(e.target.value) })} placeholder="Không giới hạn" className={`${INPUT} w-28`} /></label>
                  <label className="flex items-center gap-1">Đơn từ <input inputMode="numeric" value={c.minOrderVnd ?? ""} onChange={(e) => setCode(i, { minOrderVnd: numOrNull(e.target.value) })} placeholder="0" className={`${INPUT} w-28`} /></label>
                  <label className="flex items-center gap-1">đến <input inputMode="numeric" value={c.maxOrderVnd ?? ""} onChange={(e) => setCode(i, { maxOrderVnd: numOrNull(e.target.value) })} placeholder="Không giới hạn" className={`${INPUT} w-28`} /></label>
                  <label className="flex items-center gap-1">Người cấp <input value={c.issuedBy ?? ""} onChange={(e) => setCode(i, { issuedBy: e.target.value || null })} className={`${INPUT} w-32`} /></label>
                  <label className="flex items-center gap-1 flex-1 min-w-40">Ghi chú <input value={c.note ?? ""} onChange={(e) => setCode(i, { note: e.target.value || null })} className={`${INPUT} flex-1`} /></label>
                </div>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" className="self-start gap-1" onClick={() => edit({
              ...config,
              codes: [...config.codes, {
                code: "", policy: "DEPOSIT_30", active: true, startsOn: null, endsOn: null, maxUses: null,
                minOrderVnd: null, maxOrderVnd: null, catalogIds: [], issuedBy: null, note: null,
              }],
            })}><Plus size={14} /> Thêm mã</Button>
          </section>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <p role="status" className={`text-caption font-medium ${message ? (message.ok ? "text-success" : "text-danger") : "text-text-muted"}`}>
          {message?.text ?? "Khách không tự chọn phần trăm — chỉ nhập mã do tiệm cấp."}
        </p>
        <Button type="submit" size="sm" disabled={saving || !draft} className="gap-1.5 shrink-0">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>Lưu</span>
        </Button>
      </div>
    </form>
  )
}

function PolicySelect({ value, onChange }: { value: string; onChange: (policy: string) => void }) {
  const options = POLICIES.includes(value) ? POLICIES : [...POLICIES, value]
  return (
    <select aria-label="Cách thu" value={value} onChange={(e) => onChange(e.target.value)} className={INPUT}>
      {options.map((p) => <option key={p} value={p}>{POLICY_TEXT(p)}</option>)}
    </select>
  )
}
