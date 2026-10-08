"use client"

import React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FULL_PAYMENT, policyLabel, type PolicyCampaign } from "@/modules/greeting-card/domain/payment-plan"

export const POLICY_CHOICES = [FULL_PAYMENT, "DEPOSIT_20", "DEPOSIT_30", "DEPOSIT_40", "DEPOSIT_50", "DEPOSIT_70"]
export const FIELD = "h-9 px-2 rounded-lg border border-border bg-background text-body-sm"

export function PolicySelect({ value, onChange, label }: { value: string; onChange: (policy: string) => void; label: string }) {
  const options = POLICY_CHOICES.includes(value) ? POLICY_CHOICES : [...POLICY_CHOICES, value]
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD}>
      {options.map((p) => <option key={p} value={p}>{policyLabel(p)}</option>)}
    </select>
  )
}

/**
 * Đợt thu tiền: trong khoảng ngày giao này, cách thu mặc định đổi theo đợt (VD: dịp 20/10 thu 100%).
 * Mã thanh toán khách nhập vẫn ghi đè cách thu của đợt.
 */
export function PaymentCampaignsEditor({ campaigns, onChange }: { campaigns: PolicyCampaign[]; onChange: (next: PolicyCampaign[]) => void }) {
  const set = (i: number, patch: Partial<PolicyCampaign>) => onChange(campaigns.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  return (
    <section className="flex flex-col gap-2">
      <p className="font-bold text-foreground">Cách thu theo đợt (dịp lễ, chiến dịch)</p>
      <p className="text-caption text-text-muted">Đơn có ngày giao trong đợt sẽ thu theo cách của đợt thay cho mặc định của tiệm.</p>
      {campaigns.map((c, i) => (
        <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
          <input aria-label="Tên đợt" value={c.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="VD: Ngày 20/10" className={`${FIELD} flex-1 min-w-32`} />
          <PolicySelect label="Cách thu của đợt" value={c.policy} onChange={(policy) => set(i, { policy })} />
          <input aria-label="Từ ngày giao" type="date" value={c.startsOn} onChange={(e) => set(i, { startsOn: e.target.value })} className={FIELD} />
          <input aria-label="Đến ngày giao" type="date" value={c.endsOn} onChange={(e) => set(i, { endsOn: e.target.value })} className={FIELD} />
          <label className="flex items-center gap-1"><input type="checkbox" checked={c.active} onChange={(e) => set(i, { active: e.target.checked })} /> Bật</label>
          <Button type="button" size="sm" variant="ghost" aria-label={`Xoá đợt ${c.name}`} onClick={() => onChange(campaigns.filter((_, j) => j !== i))}>
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start gap-1"
        onClick={() => onChange([...campaigns, { id: `camp-${Date.now()}`, name: "", policy: FULL_PAYMENT, active: true, startsOn: "", endsOn: "" }])}
      >
        <Plus size={14} /> Thêm đợt
      </Button>
    </section>
  )
}
