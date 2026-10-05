"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { apiGet } from "@/components/greeting-card/greeting-api"
import { Check, Copy, QrCode, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BrochurePaymentInstructions } from "@/modules/greeting-card/domain/greeting-card-types"
import Image from "next/image"

const POLL_INTERVAL_MS = 5000
const PAID_ORDER_STATUSES = new Set(["CONFIRMED", "PROCESSING", "DELIVERED", "COMPLETED"])

function isPaid(order: { status: string; paidVnd: number; totalVnd: number } | undefined): boolean {
  return !!order && (order.paidVnd >= order.totalVnd || PAID_ORDER_STATUSES.has(order.status))
}

interface BrochurePaymentViewProps {
  orderCode: string
  totalVnd: number
  /** `null` khi tiệm chưa cấu hình tài khoản nhận tiền — cửa hàng tự liên hệ khách. */
  vietQr: BrochurePaymentInstructions | null
  shopPhone?: string | null | undefined
  onReportPaid: () => Promise<void>
  onGoToTracking: () => void
}

export function BrochurePaymentView({
  orderCode,
  totalVnd,
  vietQr,
  shopPhone,
  onReportPaid,
  onGoToTracking,
}: BrochurePaymentViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [hasReported, setHasReported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  // Hỏi trạng thái đơn định kỳ (SWR) để tự hiện "đã thanh toán" khi Điều hành/ngân hàng xác nhận.
  // Dừng khi đã xác nhận; SWR tự bỏ lượt khi tab đang ẩn.
  const tracking = useSWR<{ status: string; order?: { status: string; paidVnd: number; totalVnd: number } }>(
    `/api/v1/public/brochure/tracking/${orderCode}`,
    apiGet,
    { refreshInterval: (latest) => (isPaid(latest?.order) ? 0 : POLL_INTERVAL_MS), revalidateOnFocus: true }
  )
  const isPaymentConfirmed = isPaid(tracking.data?.order)

  function copyToClipboard(text: string, field: string) {
    void navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  async function handleReportPaid() {
    setLoading(true)
    setReportError(null)
    try {
      await onReportPaid()
      setHasReported(true)
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Không gửi được thông báo, vui lòng thử lại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-sm flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
        <QrCode size={26} />
      </div>

      {vietQr ? (
        <>
        <h2 className="text-title font-extrabold text-foreground mb-1">
          Thanh toán Chuyển khoản QR
        </h2>
        <p className="text-caption text-text-muted mb-4">
          Mở ứng dụng ngân hàng bất kỳ để quét mã QR thanh toán nhanh
        </p>
          {vietQr.purpose !== "FULL" && (
            <p className="text-body-sm text-foreground mb-3">
              Tổng giá trị đơn: <strong>{vietQr.orderTotalVnd.toLocaleString("vi-VN")} đ</strong>
              {vietQr.purpose === "DEPOSIT" && " — phần còn lại cửa hàng sẽ thu sau theo thoả thuận."}
            </p>
          )}

        {/* QR Card */}
        <div className="p-3 bg-white rounded-2xl border border-border shadow-md mb-5 w-64 aspect-square flex items-center justify-center">
          <Image
            src={vietQr.qrUrl}
            alt={`Mã VietQR đơn ${orderCode}`}
            width={232}
            height={232}
            unoptimized
            priority
            className="w-full h-full object-contain"
          />
        </div>

        {/* Payment details list */}
        <div className="w-full bg-surface-muted rounded-xl p-3.5 flex flex-col gap-2.5 text-body-sm text-left mb-5 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Ngân hàng:</span>
            <span className="font-bold text-foreground">{vietQr.bankName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">Chủ tài khoản:</span>
            <span className="font-bold text-foreground">{vietQr.accountName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">Số tài khoản:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-extrabold text-foreground">{vietQr.accountNo}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(vietQr.accountNo, "acc")}
                aria-label="Sao chép số tài khoản"
                className="text-primary hover:text-primary-dark p-1 cursor-pointer"
              >
                {copiedField === "acc" ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">
              {vietQr.purpose === "DEPOSIT" ? "Đặt cọc lần này:" : vietQr.purpose === "BALANCE" ? "Còn phải trả:" : "Số tiền:"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-primary">{vietQr.amount.toLocaleString("vi-VN")} đ</span>
              <button
                type="button"
                onClick={() => copyToClipboard(String(vietQr.amount), "amount")}
                aria-label="Sao chép số tiền"
                className="text-primary hover:text-primary-dark p-1 cursor-pointer"
              >
                {copiedField === "amount" ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">Nội dung chuyển khoản:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-extrabold text-foreground">{vietQr.transferMemo}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(vietQr.transferMemo, "memo")}
                aria-label="Sao chép nội dung chuyển khoản"
                className="text-primary hover:text-primary-dark p-1 cursor-pointer"
              >
                {copiedField === "memo" ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
        </>
      ) : (
        <>
          <h2 className="text-title font-extrabold text-foreground mb-1">Đặt hoa thành công!</h2>
          <p className="text-body-sm text-text-muted mb-4">
            Đơn <span className="font-mono font-bold text-foreground">#{orderCode}</span> trị giá{" "}
            <span className="font-bold text-primary">{totalVnd.toLocaleString("vi-VN")} đ</span>. Cửa hàng sẽ liên hệ
            bạn để hướng dẫn thanh toán.
            {shopPhone && <span className="block mt-1">Hotline cửa hàng: {shopPhone}</span>}
          </p>
        </>
      )}

      {/* Confirmation State Actions */}
      {isPaymentConfirmed ? (
        <div className="w-full flex flex-col gap-3.5">
          <div className="p-4 rounded-2xl bg-success-bg border border-success/30 text-success flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <div className="text-center">
              <p className="text-title-sm font-extrabold text-success">
                Đã thanh toán thành công!
              </p>
              <p className="text-body-sm text-text-muted mt-1">
                Điều hành cửa hàng đã xác nhận nhận tiền cho đơn #{orderCode}. Đơn hàng đang được chuẩn bị cắm hoa.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={onGoToTracking}
            className="w-full h-12 font-extrabold text-body flex items-center justify-center gap-2 rounded-xl shadow-md bg-primary hover:bg-primary-dark text-white cursor-pointer"
          >
            <span>Theo dõi tiến độ Đơn hàng</span>
            <ArrowRight size={18} />
          </Button>
        </div>
      ) : hasReported ? (
        <div className="w-full flex flex-col gap-3">
          <div className="p-3.5 rounded-xl bg-success-bg border border-success/30 text-success text-body-sm flex flex-col items-center justify-center gap-1.5 text-center">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck size={18} />
              <span>Đã báo chuyển khoản thành công!</span>
            </div>
            <p className="text-caption text-text-muted">
              Đang chờ Điều hành cửa hàng đối soát xác nhận (hệ thống sẽ tự động cập nhật ngay khi nhận được tiền)...
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={onGoToTracking}
            className="w-full h-11 font-extrabold text-body-sm flex items-center justify-center gap-2 rounded-xl cursor-pointer"
          >
            <span>Theo dõi tiến độ Đơn hàng</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      ) : vietQr ? (
        <div className="w-full flex flex-col gap-2.5">
          {reportError && (
            <p role="alert" className="text-caption text-danger font-medium">{reportError}</p>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={handleReportPaid}
            className="w-full h-12 bg-success hover:bg-success/90 text-white font-extrabold text-body flex items-center justify-center gap-2 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
          >
            <Check size={18} />
            <span>{loading ? "Đang xử lý..." : "TÔI ĐÃ CHUYỂN KHOẢN THANH TOÁN"}</span>
          </button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onGoToTracking}
            className="text-caption text-text-muted hover:text-foreground cursor-pointer"
          >
            Bỏ qua & xem Theo dõi tiến độ Đơn hàng
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={onGoToTracking}
          className="w-full h-11 font-extrabold text-body-sm flex items-center justify-center gap-2 rounded-xl cursor-pointer"
        >
          <span>Theo dõi tiến độ Đơn hàng</span>
          <ArrowRight size={16} />
        </Button>
      )}
    </div>
  )
}
