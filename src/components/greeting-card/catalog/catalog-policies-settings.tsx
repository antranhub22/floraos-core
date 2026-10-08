"use client"

import React, { useState } from "react"
import { Gift, ShieldCheck, FileText, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import {
  parseStorePolicies,
  type StorePoliciesConfig,
} from "@/modules/greeting-card/domain/store-policy"

interface Props {
  catalogId: string
  currentFilters?: Record<string, unknown> | null
  onSaved: () => void
}

export function CatalogPoliciesSettings({ catalogId, currentFilters, onSaved }: Props) {
  const org = useApi<{ settings?: Record<string, unknown> | null }>("/api/v1/organizations/current")
  const policies = org.data ? parseStorePolicies(org.data.settings) : null

  const rawPolicyConfig = (currentFilters?.appliedPolicies as {
    promotionIds?: string[]
    commitmentIds?: string[]
    agreementIds?: string[]
    allowCustomerPromotionChoice?: boolean
    photoApprovalCountdownMinutes?: number
  } | undefined) ?? {}

  const [selectedPromos, setSelectedPromos] = useState<string[]>(
    rawPolicyConfig.promotionIds ?? policies?.promotions.map((p) => p.id) ?? []
  )
  const [selectedCommits, setSelectedCommits] = useState<string[]>(
    rawPolicyConfig.commitmentIds ?? policies?.commitments.map((c) => c.id) ?? []
  )
  const [selectedAgrees, setSelectedAgrees] = useState<string[]>(
    rawPolicyConfig.agreementIds ?? policies?.agreements.map((a) => a.id) ?? []
  )
  const [allowPromoChoice, setAllowPromoChoice] = useState<boolean>(
    rawPolicyConfig.allowCustomerPromotionChoice ?? true
  )
  const [countdownMinutes, setCountdownMinutes] = useState<number>(
    rawPolicyConfig.photoApprovalCountdownMinutes ?? 10
  )

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const togglePromo = (id: string) =>
    setSelectedPromos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleCommit = (id: string) =>
    setSelectedCommits((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleAgree = (id: string) =>
    setSelectedAgrees((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  async function handleSave() {
    setSaving(true)
    try {
      const updatedFilters = {
        ...(currentFilters ?? {}),
        appliedPolicies: {
          promotionIds: selectedPromos,
          commitmentIds: selectedCommits,
          agreementIds: selectedAgrees,
          allowCustomerPromotionChoice: allowPromoChoice,
          photoApprovalCountdownMinutes: countdownMinutes,
        },
      }

      await apiSend(
        `/api/v1/greeting-card/catalogs/${catalogId}`,
        "PATCH",
        { filters: updatedFilters },
        "Không lưu được cài đặt chính sách"
      )

      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
      onSaved()
    } catch {
      // API error handled by apiSend
    } finally {
      setSaving(false)
    }
  }

  if (org.isLoading || !policies) {
    return <div className="p-8 text-center text-text-muted text-caption">Đang tải chính sách cửa hàng...</div>
  }

  return (
    <div className="space-y-5 bg-surface p-5 rounded-2xl border border-border shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h3 className="text-body font-bold text-foreground">Chính sách & Cam kết áp dụng cho Bộ sưu tập</h3>
          <p className="text-caption text-text-muted">
            Chọn các ưu đãi, cam kết và thỏa thuận áp dụng khi khách xem và đặt hoa trong bộ sưu tập này.
          </p>
        </div>
        <Button type="button" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 font-bold h-9">
          {saving ? <Loader2 size={14} className="animate-spin" /> : success ? <Check size={14} /> : null}
          <span>{saving ? "Đang lưu..." : success ? "Đã lưu!" : "Lưu cài đặt"}</span>
        </Button>
      </div>

      {/* 1. ƯU ĐÃI ÁP DỤNG */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-body-sm font-extrabold text-foreground flex items-center gap-1.5">
            <Gift size={15} className="text-primary" />
            <span>Ưu đãi áp dụng ({selectedPromos.length}/{policies.promotions.length})</span>
          </h4>
          <label className="flex items-center gap-2 cursor-pointer text-caption font-semibold text-foreground">
            <input
              type="checkbox"
              checked={allowPromoChoice}
              onChange={(e) => setAllowPromoChoice(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span>Cho phép khách chọn 01 ưu đãi khi đặt hoa</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {policies.promotions.map((p) => {
            const active = selectedPromos.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePromo(p.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  active ? "border-primary bg-primary/5 text-foreground" : "border-border text-text-muted opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-caption">
                  <span>{p.title}</span>
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${active ? "bg-primary border-primary text-white" : "border-border"}`}>
                    {active && <Check size={12} />}
                  </div>
                </div>
                <p className="text-caption text-text-muted line-clamp-2">{p.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. CAM KẾT ÁP DỤNG */}
      <div className="space-y-3 pt-3 border-t border-border">
        <h4 className="text-body-sm font-extrabold text-foreground flex items-center gap-1.5">
          <ShieldCheck size={15} className="text-success" />
          <span>Cam kết công bố ({selectedCommits.length}/{policies.commitments.length})</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {policies.commitments.map((c) => {
            const active = selectedCommits.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCommit(c.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  active ? "border-success bg-success/5 text-foreground" : "border-border text-text-muted opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-caption">
                  <span>{c.title}</span>
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${active ? "bg-success border-success text-white" : "border-border"}`}>
                    {active && <Check size={12} />}
                  </div>
                </div>
                <p className="text-caption text-text-muted line-clamp-2">{c.customerText}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. THỎA THUẬN ÁP DỤNG */}
      <div className="space-y-3 pt-3 border-t border-border">
        <h4 className="text-body-sm font-extrabold text-foreground flex items-center gap-1.5">
          <FileText size={15} className="text-warning" />
          <span>Thỏa thuận khách cần xác nhận ({selectedAgrees.length}/{policies.agreements.length})</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {policies.agreements.map((a) => {
            const active = selectedAgrees.includes(a.id)
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAgree(a.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  active ? "border-warning bg-warning/5 text-foreground" : "border-border text-text-muted opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-caption">
                  <span>{a.title}</span>
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${active ? "bg-warning border-warning text-white" : "border-border"}`}>
                    {active && <Check size={12} />}
                  </div>
                </div>
                <p className="text-caption text-text-muted line-clamp-2">{a.customerText}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. CẤU HÌNH THỜI GIAN DUYỆT ẢNH HOÀN THIỆN (SPEC #3) */}
      <div className="space-y-2 pt-3 border-t border-border">
        <h4 className="text-body-sm font-extrabold text-foreground flex items-center gap-1.5">
          <span>Thời gian khách duyệt ảnh hoàn thiện (Phút)</span>
        </h4>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={60}
            value={countdownMinutes}
            onChange={(e) => setCountdownMinutes(Math.max(1, parseInt(e.target.value) || 10))}
            className="w-24 h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground font-bold"
          />
          <p className="text-caption text-text-muted">
            Thời gian đếm ngược khi thợ/điều phối tải ảnh lên. Hết thời gian này hệ thống sẽ tự động coi như khách đã duyệt để chuẩn bị giao hoa. (Mặc định: 10 phút)
          </p>
        </div>
      </div>
    </div>
  )
}
