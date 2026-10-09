"use client"

import React, { useState } from "react"
import { Timer, CheckCircle2, AlertCircle } from "lucide-react"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import {
  STEP_TIMEOUT_SETTINGS_KEY,
  DEFAULT_STEP_TIMEOUT_POLICY,
  parseStepTimeoutPolicy,
  serializeStepTimeoutPolicy,
  formatTimeoutDuration,
  type StepTimeoutPolicy,
} from "@/modules/greeting-card/domain/step-timeout-policy"

/**
 * Cài đặt thời gian tự động huỷ theo từng bước trong quy trình Thẻ chào (Hồ sơ tiệm).
 * Áp dụng làm chuẩn mặc định cho toàn bộ cửa hàng.
 */
export function BrochureStepTimeoutSettings() {
  const org = useApi<{ settings?: Record<string, unknown> | null }>("/api/v1/organizations/current")
  const savedPolicy = org.data ? parseStepTimeoutPolicy(org.data.settings) : null

  const [policy, setPolicy] = useState<StepTimeoutPolicy | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  // Đồng bộ với dữ liệu đã lưu khi tải xong
  const current = policy ?? savedPolicy ?? DEFAULT_STEP_TIMEOUT_POLICY

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const payload = serializeStepTimeoutPolicy(current)
      await apiSend(
        "/api/v1/organizations/current",
        "PATCH",
        { settings: { [STEP_TIMEOUT_SETTINGS_KEY]: payload } },
        "Không lưu được thời gian tự động hủy"
      )
      await org.mutate()
      setMessage({ ok: true, text: "Đã lưu cài đặt thời gian tự động hủy theo bước của tiệm." })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Lỗi lưu cài đặt" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-surface rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={18} className="text-primary" aria-hidden="true" />
          <h3 className="text-title-sm font-extrabold text-foreground">
            Thời hạn & Tự động huỷ đơn theo bước
          </h3>
        </div>
        <span className="text-caption font-bold text-text-muted bg-surface-muted px-2.5 py-1 rounded-full">
          Chuẩn toàn tiệm
        </span>
      </div>

      <p className="text-caption text-text-muted leading-relaxed">
        Thiết lập thời gian tối đa cho khách hàng thao tác tại từng chặng. Khi quá thời hạn, hệ thống sẽ tự động hủy kích hoạt link hoặc hủy đơn và hiển thị rõ lý do trên trang Theo dõi tiến độ. Từng Thẻ Chào có thể tùy biến lại các thông số này.
      </p>

      {savedPolicy === null ? (
        <div className="h-40 rounded-xl bg-surface-muted animate-pulse" aria-busy="true" />
      ) : (
        <div className="space-y-3.5">
          {/* Bước 1: Quá hạn mở link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface-alt">
            <div className="space-y-0.5">
              <label className="flex items-center gap-2 text-body-sm font-bold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={current.autoCancelUnopened}
                  onChange={(e) =>
                    setPolicy({ ...current, autoCancelUnopened: e.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>1. Tự động hủy nếu khách không mở link</span>
              </label>
              <p className="text-caption text-text-muted">
                Tính từ khi gửi link. Quá hạn link sẽ bị vô hiệu hóa, phiên chuyển sang &ldquo;Đã hủy: Quá hạn mở link&rdquo;.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={1}
                max={720}
                disabled={!current.autoCancelUnopened}
                value={current.unopenedExpiryHours}
                onChange={(e) =>
                  setPolicy({
                    ...current,
                    unopenedExpiryHours: Math.max(1, parseInt(e.target.value) || 24),
                  })
                }
                className="h-9 w-20 rounded-lg border border-border bg-surface px-2 text-right text-body-sm font-bold text-foreground disabled:opacity-40"
              />
              <span className="text-caption text-text-muted">giờ</span>
              <span className="text-caption font-medium text-text-muted">
                ({formatTimeoutDuration(current.unopenedExpiryHours, "hours")})
              </span>
            </div>
          </div>

          {/* Bước 2: Quá hạn lướt chọn mẫu */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface-alt">
            <div className="space-y-0.5">
              <label className="flex items-center gap-2 text-body-sm font-bold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={current.autoCancelBrowsing}
                  onChange={(e) =>
                    setPolicy({ ...current, autoCancelBrowsing: e.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>2. Tự động hủy nếu khách mở nhưng không chọn mẫu</span>
              </label>
              <p className="text-caption text-text-muted">
                Tính từ lần hoạt động cuối sau khi mở. Quá hạn phiên sẽ tự đóng và chuyển sang &ldquo;Đã hủy: Quá hạn chọn mẫu&rdquo;.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={1}
                max={168}
                disabled={!current.autoCancelBrowsing}
                value={current.browsingExpiryHours}
                onChange={(e) =>
                  setPolicy({
                    ...current,
                    browsingExpiryHours: Math.max(1, parseInt(e.target.value) || 12),
                  })
                }
                className="h-9 w-20 rounded-lg border border-border bg-surface px-2 text-right text-body-sm font-bold text-foreground disabled:opacity-40"
              />
              <span className="text-caption text-text-muted">giờ</span>
              <span className="text-caption font-medium text-text-muted">
                ({formatTimeoutDuration(current.browsingExpiryHours, "hours")})
              </span>
            </div>
          </div>

          {/* Bước 3: Quá hạn thanh toán cọc */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface-alt">
            <div className="space-y-0.5">
              <label className="flex items-center gap-2 text-body-sm font-bold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={current.autoCancelUnpaid}
                  onChange={(e) =>
                    setPolicy({ ...current, autoCancelUnpaid: e.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>3. Tự động hủy nếu khách chưa cọc / thanh toán</span>
              </label>
              <p className="text-caption text-text-muted">
                Tính từ lúc đặt đơn. Hết hạn mà chưa nhận được tiền và khách chưa báo chuyển, đơn tự hủy để giải phóng hoa.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={5}
                max={1440}
                disabled={!current.autoCancelUnpaid}
                value={current.unpaidExpiryMinutes}
                onChange={(e) =>
                  setPolicy({
                    ...current,
                    unpaidExpiryMinutes: Math.max(5, parseInt(e.target.value) || 30),
                  })
                }
                className="h-9 w-20 rounded-lg border border-border bg-surface px-2 text-right text-body-sm font-bold text-foreground disabled:opacity-40"
              />
              <span className="text-caption text-text-muted">phút</span>
              <span className="text-caption font-medium text-text-muted">
                ({formatTimeoutDuration(current.unpaidExpiryMinutes, "minutes")})
              </span>
            </div>
          </div>

          {/* Bước 4: Chờ khách duyệt ảnh hoa */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface-alt">
            <div className="space-y-0.5">
              <label className="flex items-center gap-2 text-body-sm font-bold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={current.autoApprovePhotoOnTimeout}
                  onChange={(e) =>
                    setPolicy({ ...current, autoApprovePhotoOnTimeout: e.target.checked })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>4. Tự động duyệt ảnh hoa nếu khách không phản hồi</span>
              </label>
              <p className="text-caption text-text-muted">
                Tính từ lúc thợ hoa tải ảnh thành phẩm. Hết thời gian này hệ thống tự duyệt để kịp giờ giao hoa.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={5}
                max={120}
                disabled={!current.autoApprovePhotoOnTimeout}
                value={current.photoReviewTimeoutMinutes}
                onChange={(e) =>
                  setPolicy({
                    ...current,
                    photoReviewTimeoutMinutes: Math.max(5, parseInt(e.target.value) || 15),
                  })
                }
                className="h-9 w-20 rounded-lg border border-border bg-surface px-2 text-right text-body-sm font-bold text-foreground disabled:opacity-40"
              />
              <span className="text-caption text-text-muted">phút</span>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo & Nút Lưu */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {message ? (
          <div
            role="status"
            className={`flex items-center gap-1.5 text-caption font-medium ${
              message.ok ? "text-success" : "text-danger"
            }`}
          >
            {message.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{message.text}</span>
          </div>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={savedPolicy === null || saving}
          className="h-9 rounded-lg bg-primary px-4 text-body-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu thời hạn tiệm"}
        </button>
      </div>
    </section>
  )
}
