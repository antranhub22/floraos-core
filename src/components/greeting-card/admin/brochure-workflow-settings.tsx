"use client"

import React, { useState } from "react"
import {
  SlidersHorizontal,
  Zap,
  ShieldCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  CheckCircle2,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import {
  BROCHURE_WORKFLOW_POLICY_KEY,
  LEAN_WORKFLOW_POLICY,
  STANDARD_WORKFLOW_POLICY,
  STRICT_WORKFLOW_POLICY,
  parseBrochureWorkflowPolicy,
  serializeWorkflowPolicy,
  detectWorkflowPreset,
  type BrochureWorkflowPolicy,
  type WorkflowPreset,
} from "@/modules/greeting-card/domain/brochure-workflow-policy"
import { hasSavedWorkflowPolicy } from "@/modules/greeting-card/domain/workflow-gates"

export function BrochureWorkflowSettings() {
  const org = useApi<{ settings?: Record<string, unknown> | null }>("/api/v1/organizations/current")
  const [draft, setDraft] = useState<BrochureWorkflowPolicy | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const policy = draft ?? (org.data ? parseBrochureWorkflowPolicy(org.data.settings) : null)

  const handleApplyPreset = (preset: "LEAN" | "STANDARD" | "STRICT") => {
    let newPolicy: BrochureWorkflowPolicy
    if (preset === "LEAN") newPolicy = { ...LEAN_WORKFLOW_POLICY }
    else if (preset === "STRICT") newPolicy = { ...STRICT_WORKFLOW_POLICY }
    else newPolicy = { ...STANDARD_WORKFLOW_POLICY }

    setDraft(newPolicy)
    setMessage(null)
  }

  const handleToggle = (key: keyof Omit<BrochureWorkflowPolicy, "preset">, val: unknown) => {
    if (!policy) return
    const updated = { ...policy, [key]: val }
    const detected = detectWorkflowPreset(updated)
    setDraft({ ...updated, preset: detected })
    setMessage(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!policy) return
    setSaving(true)
    setMessage(null)
    try {
      const existingLegacy = ((org.data?.settings?.["brochure_policy"] as Record<string, unknown>) || {})
      const legacySync = {
        ...existingLegacy,
        require_full_before_dispatch: policy.requireFullPaymentBeforeDispatch,
        require_product_photo_qc: policy.requireFinishedPhoto,
        require_recipient_photo: policy.requireDeliveryProofPhoto,
        tracking_trigger_policy: policy.requireAdminDepositApproval ? "PAYMENT_ONLY" : "PAYMENT_OR_COORDINATOR",
        balance_payment_trigger_policy: policy.requireAdminDepositApproval ? "PAYMENT_ONLY" : "PAYMENT_OR_COORDINATOR",
      }

      await apiSend(
        "/api/v1/organizations/current",
        "PATCH",
        {
          settings: {
            [BROCHURE_WORKFLOW_POLICY_KEY]: serializeWorkflowPolicy(policy),
            brochure_policy: legacySync,
          },
        },
        "Không lưu được ma trận quy trình",
      )
      await org.mutate()
      setDraft(null)
      setMessage({ ok: true, text: "Đã lưu ma trận quy trình vận hành." })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Lỗi lưu cấu hình" })
    } finally {
      setSaving(false)
    }
  }

  if (!policy) {
    return <div className="h-44 rounded-2xl bg-surface-muted animate-pulse" aria-busy="true" />
  }

  const PRESETS: Array<{ id: WorkflowPreset; title: string; subtitle: string; desc: string; icon: React.ReactNode }> = [
    {
      id: "LEAN",
      title: "Tinh Gọn (Tốc Độ)",
      subtitle: "Tiệm 1–3 người",
      desc: "3 chạm là giao. Bỏ chặn duyệt cọc, ảnh thành phẩm tùy chọn, giao trước thu COD sau.",
      icon: <Zap size={18} className="text-warning" />,
    },
    {
      id: "STANDARD",
      title: "Tiêu Chuẩn",
      subtitle: "Tiệm vừa 4–10 người",
      desc: "Mặc định an toàn. Điều hành duyệt cọc, ảnh thành phẩm chờ khách duyệt theo Thời hạn từng bước (được bỏ qua ảnh khi cần), thu đủ trước khi giao.",
      icon: <ShieldCheck size={18} className="text-primary" />,
    },
    {
      id: "STRICT",
      title: "Nghiêm Ngặt",
      subtitle: "Chuỗi lớn & Cao cấp",
      desc: "Kiểm soát tuyệt đối. Bắt buộc Điều hành duyệt tiền, bắt buộc 2 lần ảnh (thành phẩm + người nhận, không có nút bỏ qua), khách phải bấm duyệt ảnh mới giao (không tự duyệt).",
      icon: <Building2 size={18} className="text-foreground" />,
    },
  ]

  return (
    <form onSubmit={handleSave} className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-primary" />
          <h3 className="text-title-sm font-extrabold text-foreground">Ma trận Vận hành & Phân quyền Quy trình</h3>
        </div>
        <span className="text-caption font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
          {policy.preset === "CUSTOM" ? "Đang tùy chỉnh" : `Chế độ: ${policy.preset}`}
        </span>
      </div>

      {!hasSavedWorkflowPolicy(org.data?.settings) && (
        <p role="note" className="text-caption font-semibold text-warning">Tiệm chưa lưu quy trình — đơn đang chạy theo Chính sách thanh toán cũ cho tới khi bấm &quot;Lưu ma trận&quot;.</p>
      )}
      <p className="text-caption text-text-muted">
        Chọn 1 trong 3 chế độ vận hành mẫu để hệ thống tự động cấu hình các nút duyệt và điểm chặn, hoặc bấm &quot;Tùy biến nâng cao&quot; để chỉnh riêng từng công tắc.
      </p>

      {/* Tầng 1: 3 Preset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PRESETS.map((p) => {
          const isSelected = policy.preset === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p.id as "LEAN" | "STANDARD" | "STRICT")}
              className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all relative ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border hover:border-border/80 bg-surface hover:bg-surface-muted/40"
              }`}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 text-primary">
                  <CheckCircle2 size={16} />
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                {p.icon}
                <span className="text-body-sm font-extrabold text-foreground">{p.title}</span>
              </div>
              <span className="text-caption font-bold text-text-muted mb-2">{p.subtitle}</span>
              <p className="text-caption text-text-muted leading-relaxed">{p.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Tầng 2: Tùy biến nâng cao */}
      <div className="border border-border rounded-xl overflow-hidden bg-background/50">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-3.5 bg-surface text-body-sm font-bold text-foreground hover:bg-surface-muted transition-colors"
        >
          <span className="flex items-center gap-2">
            <span>Tùy biến nâng cao từng chốt chặn</span>
            {policy.preset === "CUSTOM" && (
              <span className="text-caption font-extrabold text-warning bg-warning-bg px-2 py-0.5 rounded-md">
                (Đã ghi đè)
              </span>
            )}
          </span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvanced && (
          <div className="p-4 flex flex-col gap-3.5 divide-y divide-border/60">
            {/* Gate 1: Bắt buộc Điều hành duyệt cọc */}
            <div className="flex items-start justify-between gap-3 pt-2">
              <div>
                <label className="text-body-sm font-bold text-foreground block">
                  Bắt buộc Điều hành duyệt tiền cọc (Gate 1)
                </label>
                <p className="text-caption text-text-muted">
                  Bật: Chỉ tài khoản Điều hành mới bấm được &quot;Xác nhận tiền về&quot;. Tắt: Cho phép Điều phối và Sale xác nhận cọc ngay khi thấy bill.
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.requireAdminDepositApproval}
                onChange={(e) => handleToggle("requireAdminDepositApproval", e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
              />
            </div>

            {/* Gate 3: Bắt buộc chụp Ảnh thành phẩm */}
            <div className="flex items-start justify-between gap-3 pt-3">
              <div>
                <label className="text-body-sm font-bold text-foreground block">
                  Bắt buộc chụp Ảnh thành phẩm QC (Gate 3)
                </label>
                <p className="text-caption text-text-muted">
                  Bật: Phải có ảnh hoa đã cắm xong mới cho xuất giao. Tắt: Cho phép bấm &quot;Bỏ qua ảnh&quot; với đơn gấp hoặc khách quen.
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.requireFinishedPhoto}
                onChange={(e) => handleToggle("requireFinishedPhoto", e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
              />
            </div>

            {/* Gate 4: Khách duyệt ảnh */}
            <div className={`flex items-start justify-between gap-3 pt-3 ${!policy.requireFinishedPhoto ? "opacity-50 pointer-events-none" : ""}`}>
              <div>
                <label className="text-body-sm font-bold text-foreground flex items-center gap-1.5">
                  <span>Cơ chế Khách duyệt ảnh (Gate 4)</span>
                  {!policy.requireFinishedPhoto && <Lock size={12} className="text-text-muted" />}
                </label>
                <p className="text-caption text-text-muted">
                  Chọn cách xử lý khi khách xem ảnh trên link theo dõi tiến độ.
                </p>
              </div>
              <select
                disabled={!policy.requireFinishedPhoto}
                value={policy.customerApprovalMode}
                onChange={(e) => handleToggle("customerApprovalMode", e.target.value)}
                className="h-8 px-2 rounded-lg border border-border bg-surface text-caption font-semibold"
              >
                <option value="AUTO_PASS_10M">Tự duyệt khi hết thời gian chờ (Chuẩn)</option>
                <option value="REQUIRE_CUSTOMER">Bắt buộc khách bấm duyệt</option>
                <option value="BYPASS">Bỏ qua duyệt khách (Giao ngay)</option>
              </select>
            </div>

            {/* Gate 5: Chặn giao ship nếu chưa thu đủ */}
            <div className="flex items-start justify-between gap-3 pt-3">
              <div>
                <label className="text-body-sm font-bold text-foreground block">
                  Chặn Giao Ship nếu chưa thu đủ 100% (Gate 5)
                </label>
                <p className="text-caption text-text-muted">
                  Bật: Đơn cọc bắt buộc thu nốt lần 2 mới mở nút Giao Ship. Tắt: Mở nút giao ngay (cho phép thu tiền mặt COD).
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.requireFullPaymentBeforeDispatch}
                onChange={(e) => handleToggle("requireFullPaymentBeforeDispatch", e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
              />
            </div>

            {/* Gate 6: Bắt buộc ảnh người nhận */}
            <div className="flex items-start justify-between gap-3 pt-3">
              <div>
                <label className="text-body-sm font-bold text-foreground block">
                  Bắt buộc chụp Ảnh người nhận hoa (Gate 6)
                </label>
                <p className="text-caption text-text-muted">
                  Bật: Shipper phải tải ảnh người nhận mới bấm Hoàn tất. Tắt: Cho phép bấm hoàn tất trực tiếp 1 click.
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.requireDeliveryProofPhoto}
                onChange={(e) => handleToggle("requireDeliveryProofPhoto", e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
              />
            </div>

            {/* Gate 7: Cho phép ủy quyền duyệt SLA */}
            <div className="flex items-start justify-between gap-3 pt-3">
              <div>
                <label className="text-body-sm font-bold text-foreground block">
                  Cho phép Điều phối / Sale duyệt cọc khi quá hạn SLA (Gate 7)
                </label>
                <p className="text-caption text-text-muted">
                  Nếu Điều hành không bấm duyệt sau thời gian SLA, tự động mở khóa nút duyệt cho Điều phối và Sale phụ trách (chống nghẽn đơn).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={policy.allowSlaEscalation}
                  onChange={(e) => handleToggle("allowSlaEscalation", e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
                />
                {policy.allowSlaEscalation && (
                  <select
                    value={policy.slaEscalationMinutes}
                    onChange={(e) => handleToggle("slaEscalationMinutes", Number(e.target.value))}
                    className="h-8 px-2 rounded-lg border border-border bg-surface text-caption font-semibold"
                  >
                    <option value={5}>Sau 5 phút</option>
                    <option value={10}>Sau 10 phút</option>
                    <option value={15}>Sau 15 phút</option>
                    <option value={30}>Sau 30 phút</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer & Nút lưu */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <p role="status" className={`text-caption font-medium ${message ? (message.ok ? "text-success" : "text-danger") : "text-text-muted"}`}>
          {message?.text ?? "Các thay đổi sẽ áp dụng ngay lập tức cho toàn bộ tài khoản trong tiệm."}
        </p>
        <Button type="submit" size="sm" disabled={saving || !draft} className="gap-1.5 shrink-0">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>Lưu ma trận</span>
        </Button>
      </div>
    </form>
  )
}
