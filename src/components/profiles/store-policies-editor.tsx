"use client"

import React, { useState } from "react"
import { Gift, ShieldCheck, FileText, Plus, Trash2, Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PromotionKindField } from "./promotion-kind-field"
import {
  type StorePoliciesConfig,
  type PromotionItem,
  type CommitmentItem,
  type AgreementItem,
  DEFAULT_PROMOTIONS,
  DEFAULT_COMMITMENTS,
  DEFAULT_AGREEMENTS,
} from "@/modules/greeting-card/domain/store-policy"

interface Props {
  initialPolicies?: StorePoliciesConfig | null
  onSave: (policies: StorePoliciesConfig) => Promise<boolean>
  saving: boolean
}

export function StorePoliciesEditor({ initialPolicies, onSave, saving }: Props) {
  const [promotions, setPromotions] = useState<PromotionItem[]>(initialPolicies?.promotions ?? DEFAULT_PROMOTIONS)
  const [commitments, setCommitments] = useState<CommitmentItem[]>(initialPolicies?.commitments ?? DEFAULT_COMMITMENTS)
  const [agreements, setAgreements] = useState<AgreementItem[]>(initialPolicies?.agreements ?? DEFAULT_AGREEMENTS)
  const [intakeCta, setIntakeCta] = useState(() => initialPolicies?.intakePromotionCta ?? { enabled: true, percent: 10 })
  const [activeSection, setActiveSection] = useState<"promo" | "commit" | "agree">("promo")
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleResetDefaults = () => {
    if (!window.confirm("Khôi phục danh sách Ưu đãi, Cam kết và Thỏa thuận về mặc định ban đầu?")) return
    setPromotions(DEFAULT_PROMOTIONS)
    setCommitments(DEFAULT_COMMITMENTS)
    setAgreements(DEFAULT_AGREEMENTS)
    setIntakeCta({ enabled: true, percent: 10 })
  }

  const handleSave = async () => {
    const ok = await onSave({ promotions, commitments, agreements, intakePromotionCta: intakeCta })
    if (ok) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  // --- Helpers for Promotions ---
  const addPromo = () => {
    const id = `promo-${Date.now()}`
    setPromotions([...promotions, { id, title: "Ưu đãi mới", description: "Mô tả ưu đãi tặng cho khách hàng", kind: "GIFT" }])
  }
  const removePromo = (id: string) => setPromotions(promotions.filter((p) => p.id !== id))
  const updatePromo = (id: string, patch: Partial<PromotionItem>) =>
    setPromotions(promotions.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  // --- Helpers for Commitments ---
  const addCommit = () => {
    const id = `commit-${Date.now()}`
    setCommitments([...commitments, { id, title: "Cam kết mới", customerText: "Cam kết của cửa hàng gửi tới khách hàng" }])
  }
  const removeCommit = (id: string) => setCommitments(commitments.filter((c) => c.id !== id))
  const updateCommit = (id: string, patch: Partial<CommitmentItem>) =>
    setCommitments(commitments.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  // --- Helpers for Agreements ---
  const addAgree = () => {
    const id = `agree-${Date.now()}`
    setAgreements([...agreements, { id, title: "Thỏa thuận mới", customerText: "Thỏa thuận cần khách đọc và hiểu trước khi đặt" }])
  }
  const removeAgree = (id: string) => setAgreements(agreements.filter((a) => a.id !== id))
  const updateAgree = (id: string, patch: Partial<AgreementItem>) =>
    setAgreements(agreements.map((a) => (a.id === id ? { ...a, ...patch } : a)))

  return (
    <div className="space-y-6">
      {/* Thanh chuyển đổi Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSection("promo")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-body-sm font-bold transition-colors ${
              activeSection === "promo" ? "bg-primary text-white" : "text-text-muted hover:bg-surface-muted"
            }`}
          >
            <Gift size={16} />
            <span>A. Ưu đãi ({promotions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("commit")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-body-sm font-bold transition-colors ${
              activeSection === "commit" ? "bg-primary text-white" : "text-text-muted hover:bg-surface-muted"
            }`}
          >
            <ShieldCheck size={16} />
            <span>B. Cam kết ({commitments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("agree")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-body-sm font-bold transition-colors ${
              activeSection === "agree" ? "bg-primary text-white" : "text-text-muted hover:bg-surface-muted"
            }`}
          >
            <FileText size={16} />
            <span>C. Thỏa thuận ({agreements.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleResetDefaults} className="h-9 gap-1 text-caption text-text-muted">
            <RotateCcw size={13} /> Khôi phục mặc định
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving} className="h-9 gap-1.5 font-bold">
            {saveSuccess ? <Check size={14} className="text-white" /> : null}
            <span>{saving ? "Đang lưu..." : saveSuccess ? "Đã lưu!" : "Lưu thay đổi"}</span>
          </Button>
        </div>
      </div>

      {/* SECTION A: ƯU ĐÃI */}
      {activeSection === "promo" && (
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-title-sm font-extrabold text-foreground">Danh mục Ưu đãi (Khách chọn khi đặt hoa)</h3>
              <p className="text-caption text-text-muted">Bộ sưu tập áp dụng ưu đãi sẽ cho phép khách chọn duy nhất 01 ưu đãi trong nhóm này.</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addPromo} className="gap-1 h-8 text-caption font-bold">
              <Plus size={14} /> Thêm ưu đãi
            </Button>
          </div>

          {/* Cấu hình CTA Ưu đãi Chặng 1 khi mở link */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={intakeCta.enabled}
                  onChange={(e) => setIntakeCta({ ...intakeCta, enabled: e.target.checked })}
                  className="h-4 w-4 accent-primary rounded"
                />
                <span className="text-body-sm font-bold text-foreground">
                  Bật dòng ưu đãi khi khách mở link Thẻ Chào (Chặng 1)
                </span>
              </label>

              {intakeCta.enabled && (
                <div className="flex items-center gap-1.5 text-body-sm">
                  <span className="text-text-muted">Mức giảm:</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={intakeCta.percent}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(1, Number(e.target.value) || 1))
                      setIntakeCta({ ...intakeCta, percent: val })
                    }}
                    className="h-8 w-16 px-2 text-center rounded-lg border border-border bg-background text-body-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="font-bold text-primary">%</span>
                </div>
              )}
            </div>

            {intakeCta.enabled && (
              <p className="text-caption text-text-muted">
                Xem trước: <strong className="text-foreground">"Nhận quà {intakeCta.percent}% giảm giá khi Đặt mua hoa trực tiếp tại link này!"</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {promotions.map((p) => (
              <div key={p.id} className="p-3.5 rounded-xl border border-border bg-surface-muted/30 flex flex-col gap-2 relative group">
                <button
                  type="button"
                  onClick={() => removePromo(p.id)}
                  aria-label="Xóa ưu đãi"
                  className="absolute top-3 right-3 text-text-muted hover:text-danger p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
                <input
                  type="text"
                  value={p.title}
                  onChange={(e) => updatePromo(p.id, { title: e.target.value })}
                  placeholder="Tiêu đề ưu đãi..."
                  className="font-bold text-body-sm text-foreground bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={p.description}
                  onChange={(e) => updatePromo(p.id, { description: e.target.value })}
                  placeholder="Mô tả quyền lợi nhận được..."
                  className="text-caption text-text-muted bg-transparent border-none focus:ring-0 focus:outline-none resize-none p-0"
                />
                <PromotionKindField item={p} onChange={(patch) => updatePromo(p.id, patch)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION B: CAM KẾT */}
      {activeSection === "commit" && (
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-title-sm font-extrabold text-foreground">Cam kết cốt lõi của Cửa hàng</h3>
              <p className="text-caption text-text-muted">Những điều cửa hàng chắc chắn thực hiện đúng chuẩn đã công bố tới khách hàng.</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addCommit} className="gap-1 h-8 text-caption font-bold">
              <Plus size={14} /> Thêm cam kết
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {commitments.map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl border border-border bg-surface-muted/30 flex flex-col gap-2 relative group">
                <button
                  type="button"
                  onClick={() => removeCommit(c.id)}
                  aria-label="Xóa cam kết"
                  className="absolute top-3 right-3 text-text-muted hover:text-danger p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
                <input
                  type="text"
                  value={c.title}
                  onChange={(e) => updateCommit(c.id, { title: e.target.value })}
                  placeholder="Tiêu đề cam kết..."
                  className="font-bold text-body-sm text-foreground bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={c.customerText}
                  onChange={(e) => updateCommit(c.id, { customerText: e.target.value })}
                  placeholder="Văn bản công bố với khách hàng..."
                  className="text-caption text-text-muted bg-transparent border-none focus:ring-0 focus:outline-none resize-none p-0"
                />
                <input
                  type="text"
                  value={c.internalText || ""}
                  onChange={(e) => updateCommit(c.id, { internalText: e.target.value })}
                  placeholder="Quy định nội bộ cho nhân viên (tùy chọn)..."
                  className="text-caption text-text-muted/70 italic bg-transparent border-t border-border/40 pt-1 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION C: THỎA THUẬN */}
      {activeSection === "agree" && (
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-title-sm font-extrabold text-foreground">Thỏa thuận với Khách hàng (Hiển thị khi Review Đơn)</h3>
              <p className="text-caption text-text-muted">Các tình huống phát sinh có thể xảy ra mà khách bắt buộc phải xác nhận hiểu trước khi gửi đơn.</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addAgree} className="gap-1 h-8 text-caption font-bold">
              <Plus size={14} /> Thêm thỏa thuận
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agreements.map((a) => (
              <div key={a.id} className="p-3.5 rounded-xl border border-border bg-surface-muted/30 flex flex-col gap-2 relative group">
                <button
                  type="button"
                  onClick={() => removeAgree(a.id)}
                  aria-label="Xóa thỏa thuận"
                  className="absolute top-3 right-3 text-text-muted hover:text-danger p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
                <input
                  type="text"
                  value={a.title}
                  onChange={(e) => updateAgree(a.id, { title: e.target.value })}
                  placeholder="Tiêu đề thỏa thuận..."
                  className="font-bold text-body-sm text-foreground bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={a.customerText}
                  onChange={(e) => updateAgree(a.id, { customerText: e.target.value })}
                  placeholder="Nội dung khách cần đọc và hiểu..."
                  className="text-caption text-text-muted bg-transparent border-none focus:ring-0 focus:outline-none resize-none p-0"
                />
                <input
                  type="text"
                  value={a.internalText || ""}
                  onChange={(e) => updateAgree(a.id, { internalText: e.target.value })}
                  placeholder="Quy chuẩn xử lý nội bộ..."
                  className="text-caption text-text-muted/70 italic bg-transparent border-t border-border/40 pt-1 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
