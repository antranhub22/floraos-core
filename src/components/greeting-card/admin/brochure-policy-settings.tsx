"use client"

import React, { useState } from "react"
import { AlertTriangle, Loader2, Save, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import {
  BROCHURE_POLICY_SETTINGS_KEY,
  parsePaymentPolicy,
  serializePaymentPolicy,
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
            // Ghi đủ mọi trường — giữ cả hạn thanh toán / giao hoa đặt ở Hồ sơ cửa hàng
            [BROCHURE_POLICY_SETTINGS_KEY]: serializePaymentPolicy(policy),
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
            <input type="checkbox" checked={policy.requirePaymentProof !== false} onChange={(e) => edit({ requirePaymentProof: e.target.checked })} />
            <span>Bắt buộc khách tải ảnh chuyển khoản khi xác nhận thanh toán</span>
          </label>

          {/* Cấu hình bắt buộc chụp ảnh thành phẩm & ảnh người nhận */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <span className="font-semibold text-foreground">Quy định chụp ảnh kiểm định chất lượng & giao nhận</span>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={policy.requireProductPhotoQC !== false}
                onChange={(e) => edit({ requireProductPhotoQC: e.target.checked })}
              />
              <span>Bắt buộc chụp ảnh hoa thành phẩm (QC) trước khi Giao Ship</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={policy.requireRecipientPhoto !== false}
                onChange={(e) => edit({ requireRecipientPhoto: e.target.checked })}
              />
              <span>Bắt buộc chụp ảnh người nhận hoa lúc giao thành công</span>
            </label>

            {/* Banner cảnh báo khi Điều hành tắt một trong các bước chụp ảnh */}
            {(policy.requireProductPhotoQC === false || policy.requireRecipientPhoto === false) && (
              <div className="p-3 rounded-xl border border-warning/40 bg-warning-bg/40 text-caption text-warning flex flex-col gap-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={15} className="shrink-0" />
                  CẢNH BÁO QUẢN TRỊ RỦI RO CHẤT LƯỢNG
                </span>
                <p className="leading-relaxed">
                  Việc tắt yêu cầu chụp ảnh sẽ bỏ qua chốt chặn kiểm định hoa thực tế. Điều phối vẫn có thể chụp ảnh tự nguyện nếu muốn, nhưng nút Giao Ship sẽ không bị chặn và tiến độ của khách sẽ tự động cập nhật theo giờ dự kiến. Điều này có thể <strong>ảnh hưởng lớn tới uy tín chất lượng của cửa hàng và tăng nguy cơ khiếu nại từ khách hàng</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Cấu hình thời gian tự hủy khi Điều phối từ chối nhận đơn mà Điều hành chưa duyệt */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
            <label className="flex items-center justify-between gap-2">
              <span className="text-text-muted">Tự hủy đơn khi Điều phối từ chối mà Điều hành chưa duyệt sau</span>
              <select
                value={policy.cancellationApprovalTimeoutMinutes ?? 15}
                onChange={(e) => edit({ cancellationApprovalTimeoutMinutes: Number(e.target.value) })}
                className="h-9 px-2 rounded-lg border border-border bg-background"
              >
                {[5, 10, 15, 30, 60].map((m) => (
                  <option key={m} value={m}>{m} phút {m === 15 ? "(Mặc định)" : ""}</option>
                ))}
              </select>
            </label>
            <p className="text-caption text-text-muted">
              Bảo vệ trải nghiệm khách hàng: Nếu Điều phối từ chối đơn mà Điều hành bận không duyệt kịp, hệ thống tự động hủy đơn và chuyển hoàn tiền.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
            <span className="font-semibold text-foreground">Kích hoạt bước tiếp theo (Theo dõi tiến độ)</span>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="trackingTriggerPolicy"
                checked={policy.trackingTriggerPolicy !== "PAYMENT_ONLY"}
                onChange={() => edit({ trackingTriggerPolicy: "PAYMENT_OR_COORDINATOR" })}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-foreground">Cho phép thêm Điều phối xác nhận Nhận đơn</span>
                <span className="block text-caption text-text-muted">
                  Điều hành xác nhận tiền HOẶC Điều phối bấm nhận đơn đều mở màn hình theo dõi tiến độ cho khách.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="trackingTriggerPolicy"
                checked={policy.trackingTriggerPolicy === "PAYMENT_ONLY"}
                onChange={() => edit({ trackingTriggerPolicy: "PAYMENT_ONLY" })}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-foreground">Chỉ Điều hành xác nhận đã thanh toán</span>
                <span className="block text-caption text-text-muted">
                  Bắt buộc Điều hành phải xác nhận đã nhận tiền (đủ hoặc cọc) thì khách mới được mở theo dõi tiến độ.
                </span>
              </span>
            </label>
          </div>
          {policy.requireFullBeforeDispatch && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
              <span className="font-semibold text-foreground">Xác nhận Thanh toán Lần 2 (đặt cọc → đủ, trước khi giao)</span>
              <p className="text-caption text-text-muted">Áp dụng khi đơn đặt cọc, hoa đã hoàn thành và khách báo đã chuyển khoản lần 2.</p>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="balancePaymentTriggerPolicy"
                  checked={(policy.balancePaymentTriggerPolicy ?? policy.trackingTriggerPolicy ?? "PAYMENT_OR_COORDINATOR") !== "PAYMENT_ONLY"}
                  onChange={() => edit({ balancePaymentTriggerPolicy: "PAYMENT_OR_COORDINATOR" })}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-foreground">Cho phép Điều phối duyệt qua ảnh bill</span>
                  <span className="block text-caption text-text-muted">
                    Điều hành xác nhận tiền HOẶC Điều phối bấm "Xác nhận Đã Nhận Đủ Tiền" đều cho phép giao hoa.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="balancePaymentTriggerPolicy"
                  checked={(policy.balancePaymentTriggerPolicy ?? policy.trackingTriggerPolicy ?? "PAYMENT_OR_COORDINATOR") === "PAYMENT_ONLY"}
                  onChange={() => edit({ balancePaymentTriggerPolicy: "PAYMENT_ONLY" })}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-foreground">Chỉ Điều hành xác nhận đã nhận đủ tiền</span>
                  <span className="block text-caption text-text-muted">
                    Bắt buộc Điều hành phải xác nhận đã nhận đủ tiền thì đơn mới được phép giao hoa.
                  </span>
                </span>
              </label>
            </div>
          )}
          <p className="text-caption text-text-muted">
            Giao hoa {policy.requireFullBeforeDispatch ? "bắt buộc thu đủ tiền trước" : "không bắt buộc thu đủ trước"}
            {policy.paymentTimeoutMinutes ? ` · tự huỷ đơn chưa thanh toán sau ${policy.paymentTimeoutMinutes} phút` : ""}
            {" "}— đổi ở Hồ sơ cửa hàng → Chính sách & Cam kết, cùng các mức đặt cọc (mã thanh toán).
          </p>
          {!policy.paymentTimeoutMinutes && <label className="flex items-center gap-2">
            <span className="text-text-muted">Giữ đơn chờ chuyển khoản</span>
            <select
              value={policy.holdMinutes ?? 0}
              onChange={(e) => edit({ holdMinutes: Number(e.target.value) })}
              className="h-9 px-2 rounded-lg border border-border bg-background"
            >
              <option value={0}>Không hiện đồng hồ</option>
              {[15, 30, 60, 120].map((m) => <option key={m} value={m}>{m} phút</option>)}
            </select>
          </label>}
          {!policy.paymentTimeoutMinutes && (policy.holdMinutes ?? 0) > 0 && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={policy.autoCancelUnpaid === true} onChange={(e) => edit({ autoCancelUnpaid: e.target.checked })} />
              <span>Hết giờ giữ đơn: nhắc khách chuyển khoản; quá thêm 60 phút vẫn chưa chuyển thì tự huỷ đơn</span>
            </label>
          )}
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
