"use client"

import React, { useState, useEffect } from "react"
import { Settings2, Clock, Check, RefreshCw, X, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DispatchReminderPolicyConfig } from "@/modules/coordinator/domain/dispatch-reminder-types"

interface CoordinatorReminderSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

export function CoordinatorReminderSettingsModal({
  isOpen,
  onClose,
  onSaved,
}: CoordinatorReminderSettingsModalProps) {
  const [config, setConfig] = useState<DispatchReminderPolicyConfig>({
    m0MinutesAfterPaid: 10,
    m1MinutesBeforeDelivery: 120,
    m2MinutesBeforeDelivery: 60,
    m3MinutesAfterShipperAssigned: 20,
    m5MinutesAfterDelivery: 30,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    fetch("/api/v1/coordinator/settings/reminders")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải cấu hình chính sách")
        return res.json()
      })
      .then((data: { config?: DispatchReminderPolicyConfig }) => {
        if (data.config) {
          setConfig(data.config)
        }
      })
      .catch((err: Error) => {
        setErrorMessage(err.message || "Lỗi tải cấu hình")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [isOpen])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await fetch("/api/v1/coordinator/settings/reminders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(errData.message || "Lưu cấu hình thất bại")
      }

      setSuccessMessage("Đã lưu chính sách nhắc việc thành công!")
      onSaved?.()
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra"
      setErrorMessage(msg)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Settings2 size={18} />
            </div>
            <div>
              <h2 className="text-body font-bold text-text">
                Cài Đặt Chính Sách Nhắc Nghiệp Vụ
              </h2>
              <p className="text-caption text-text-muted">
                Chuỗi 6 mốc thời gian nhắc việc tự động cho Điều phối viên (M0..M5)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            title="Đóng"
            className="p-1 rounded-md text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-danger-bg text-danger text-body-sm flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-success-bg text-success text-body-sm flex items-center gap-2">
              <Check size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-text-muted">
              <RefreshCw size={24} className="animate-spin text-primary" />
              <span className="text-body-sm">Đang tải cài đặt chính sách...</span>
            </div>
          ) : (
            <>
              {/* M0 */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-alt/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-caption font-bold text-primary uppercase">
                      M0 · In thẻ gia công
                    </span>
                    <h4 className="text-body-sm font-bold text-text">
                      Sau khi nhận thanh toán
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={360}
                      value={config.m0MinutesAfterPaid}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          m0MinutesAfterPaid: Number(e.target.value),
                        })
                      }
                      className="w-16 h-8 text-center text-body-sm font-bold rounded-md border border-border bg-surface text-text"
                    />
                    <span className="text-caption text-text-muted">phút</span>
                  </div>
                </div>
                <p className="text-caption text-text-muted leading-relaxed">
                  Nhắc kiểm tra hóa đơn, in thẻ gia công và gửi xưởng xác nhận nhận đơn.
                </p>
              </div>

              {/* M1 */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-alt/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-caption font-bold text-warning uppercase">
                      M1 · Bắt đầu cắm hoa
                    </span>
                    <h4 className="text-body-sm font-bold text-text">
                      Trước giờ giao hẹn
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={10}
                      max={720}
                      value={config.m1MinutesBeforeDelivery}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          m1MinutesBeforeDelivery: Number(e.target.value),
                        })
                      }
                      className="w-16 h-8 text-center text-body-sm font-bold rounded-md border border-border bg-surface text-text"
                    />
                    <span className="text-caption text-text-muted">phút</span>
                  </div>
                </div>
                <p className="text-caption text-text-muted leading-relaxed">
                  Tạo cửa sổ đệm can thiệp: nhắc xưởng xác nhận đã bắt đầu thực hiện đơn.
                </p>
              </div>

              {/* M2 */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-alt/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-caption font-bold text-info uppercase">
                      M2 · Hoàn thành & Book ship
                    </span>
                    <h4 className="text-body-sm font-bold text-text">
                      Trước giờ giao hẹn
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={10}
                      max={360}
                      value={config.m2MinutesBeforeDelivery}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          m2MinutesBeforeDelivery: Number(e.target.value),
                        })
                      }
                      className="w-16 h-8 text-center text-body-sm font-bold rounded-md border border-border bg-surface text-text"
                    />
                    <span className="text-caption text-text-muted">phút</span>
                  </div>
                </div>
                <p className="text-caption text-text-muted leading-relaxed">
                  Nhắc xưởng chụp ảnh thành phẩm kiểm tra và báo SĐT tài xế shipper.
                </p>
              </div>

              {/* M3 */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-alt/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-caption font-bold text-warning uppercase">
                      M3 · Shipper lấy hàng
                    </span>
                    <h4 className="text-body-sm font-bold text-text">
                      Sau khi gán shipper
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={config.m3MinutesAfterShipperAssigned}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          m3MinutesAfterShipperAssigned: Number(e.target.value),
                        })
                      }
                      className="w-16 h-8 text-center text-body-sm font-bold rounded-md border border-border bg-surface text-text"
                    />
                    <span className="text-caption text-text-muted">phút</span>
                  </div>
                </div>
                <p className="text-caption text-text-muted leading-relaxed">
                  Xóa blind spot: kiểm tra tài xế đã đến xưởng nhận hoa hay chưa.
                </p>
              </div>

              {/* M5 */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-alt/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-caption font-bold text-success uppercase">
                      M5 · Chăm sóc sau giao
                    </span>
                    <h4 className="text-body-sm font-bold text-text">
                      Sau giờ giao thành công
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={5}
                      max={360}
                      value={config.m5MinutesAfterDelivery}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          m5MinutesAfterDelivery: Number(e.target.value),
                        })
                      }
                      className="w-16 h-8 text-center text-body-sm font-bold rounded-md border border-border bg-surface text-text"
                    />
                    <span className="text-caption text-text-muted">phút</span>
                  </div>
                </div>
                <p className="text-caption text-text-muted leading-relaxed">
                  Nhắc kiểm tra ảnh POD từ shipper và liên hệ hỏi mức độ hài lòng của khách.
                </p>
              </div>
            </>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="h-9 px-4 text-body-sm"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || isLoading}
              className="h-9 px-5 bg-primary hover:bg-primary-dark text-white font-bold text-body-sm"
            >
              {isSaving ? "Đang lưu..." : "Lưu chính sách"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
